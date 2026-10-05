import "server-only";

import {
  errorDetail,
  fallbackProvider,
  primaryProvider,
  type MixPart,
  type MixProvider,
} from "@/lib/mix/providers";

export { fallbackConfigured } from "@/lib/mix/providers";
export type { MixPart } from "@/lib/mix/providers";

/**
 * Which model answers which task. Both are deployment config rather than
 * source: a model identifier belongs to the provider, changes on their
 * schedule, and should never need a code change to follow. Unset reads the
 * same as an unset key, so the app falls back rather than calling a guess.
 */
export const FAST_MODEL = process.env.FAST_MODEL ?? "";
export const REASONING_MODEL = process.env.REASONING_MODEL ?? "";

/** True when this server can mix at all: a key and something to send it to. */
export function mixingConfigured(): boolean {
  return Boolean(process.env.MODEL_API_KEY && FAST_MODEL && REASONING_MODEL);
}

export class MixError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "MixError";
  }
}

/** One try, plus three more. */
export const MAX_ATTEMPTS = 4;

/**
 * The whole call, retries included.
 *
 * This has to be under the route's maxDuration, not near it and not over it.
 * At 60 seconds against a 26 second function the platform always won the race,
 * which meant the timeout here could never fire: the invocation was severed
 * mid-flight, the browser was handed a gateway error, and the function went on
 * to finish and save. The class saw a failure sitting next to a test that
 * plainly existed.
 *
 * Under the ceiling, this code gives up first. That matters because giving up
 * here happens before the set is stored, so a run that runs out of time leaves
 * nothing behind and says so honestly.
 */
const TOTAL_BUDGET_MS = 24_000;

/**
 * How long one call needs before it is worth starting at all.
 *
 * A practice test goes to the reasoning model and routinely takes fifteen
 * seconds or more. Starting one with four seconds left does not produce a
 * faster answer, it produces a guaranteed abort that spends the rest of the
 * budget and reports a timeout. Below this floor the code gives up on the
 * remaining attempts and returns whatever the last real error was, so the
 * caller can fall back instead of waiting for an abort it cannot use.
 */
const MIN_ATTEMPT_MS = 6_000;

/**
 * How much of the budget the first mixer may spend when a standby exists.
 *
 * This is the price of asking the busy provider first. The standby cannot
 * start with four seconds left, so the primary has to be cut off while there
 * is still a real call's worth of time behind it. Just under half leaves both
 * sides above MIN_ATTEMPT_MS on the study route's 22 second budget: about ten
 * seconds to be told the pot is full, about twelve to actually cook.
 *
 * Capacity refusals come back in a few hundred milliseconds, so in the case
 * this exists for the primary spends almost none of its share and the standby
 * gets nearly the whole budget. The slow case is the primary accepting the
 * request and then stalling, which is why the share is a ceiling and not a
 * target.
 */
const PRIMARY_SHARE_WITH_FALLBACK = 0.45;

/**
 * Attempts the primary gets when a standby exists.
 *
 * Four rounds of backoff against a full pot is the right answer when there is
 * nowhere else to go. With somewhere else to go it is the wrong one: every
 * extra round is time taken from a mixer that would have answered. Two is
 * enough to ride out a single unlucky refusal.
 */
const PRIMARY_ATTEMPTS_WITH_FALLBACK = 2;

/**
 * Worth another go, or worth giving up on.
 *
 * A busy pot is the case this exists for. Capacity refusals come back fast,
 * usually in a few hundred milliseconds, because nothing is queued behind
 * them: the mixer says it is full and returns. That is what makes retrying
 * affordable inside a fixed budget, and why the waits below are short.
 *
 * A refusal about the request itself is never retried. Bad credentials, a
 * malformed body or a missing model do not become correct by being asked
 * again; they would only spend the budget and arrive at the same answer.
 */
export function isWorthRetrying(status: number | undefined): boolean {
  if (status === undefined) return true; // the connection failed, not the request
  if (status === 429) return true; // too many at once
  return status >= 500 && status < 600; // full, restarting, or behind a bad gateway
}

/**
 * How long to wait before trying again, growing each time so a pot that is
 * genuinely full is not hammered, with jitter so a classroom that all pressed
 * the button together does not come back in lockstep.
 */
export function waitBeforeRetry(attempt: number, random = Math.random): number {
  const base = [400, 900, 2000][attempt - 1] ?? 2000;
  return Math.round(base * (0.75 + random() * 0.5));
}

/** What the mixer asked us to wait, when it says so. Seconds or an HTTP date. */
export function honourRetryAfter(header: string | null, now = Date.now()): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const when = Date.parse(header);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - now);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One mixer, asked until it answers or its share of the budget runs out.
 *
 * Throws the last MixError. The caller decides whether that is worth trying
 * somebody else about.
 */
async function askOneMixer<T>({
  provider,
  instruction,
  parts,
  schema,
  deadline,
  maxAttempts,
}: {
  provider: MixProvider;
  instruction: string;
  parts: MixPart[];
  schema: unknown;
  deadline: number;
  maxAttempts: number;
}): Promise<T> {
  let lastError: MixError = new MixError("The mixer could not be reached", 502);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const remaining = deadline - Date.now();
    // A first attempt always runs: without it a slow start would return the
    // placeholder error having called nothing at all. Later attempts need
    // enough left to actually finish.
    if (remaining <= 0) break;
    if (attempt > 1 && remaining < MIN_ATTEMPT_MS) break;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remaining);
    try {
      const response = await provider.send({ instruction, parts, schema, signal: controller.signal });
      const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

      if (!response.ok) {
        lastError = new MixError(
          errorDetail(payload) ?? "The mixer could not be reached",
          response.status,
        );
        if (attempt < maxAttempts && isWorthRetrying(response.status)) {
          const asked = honourRetryAfter(response.headers.get("retry-after"));
          const wait = Math.max(asked ?? 0, waitBeforeRetry(attempt));
          // Only wait if there is still budget to use the time for.
          if (Date.now() + wait < deadline) {
            clearTimeout(timeout);
            await sleep(wait);
            continue;
          }
        }
        throw lastError;
      }

      const text = provider.read(payload);
      if (text !== null) return JSON.parse(text) as T;

      // A reply that arrived but says nothing usable is not a capacity
      // problem, and asking again would spend a whole generation to find that
      // out. The caller falls back to the deterministic organizer instead.
      throw new MixError("The mixer returned nothing usable", 502);
    } catch (error) {
      if (error instanceof MixError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new MixError("Mixing timed out", 504);
      }
      // The connection itself failed. Worth another go while there is budget.
      lastError = new MixError("The mixer's reply could not be read", 502);
      if (attempt < maxAttempts) {
        const wait = waitBeforeRetry(attempt);
        if (Date.now() + wait < deadline) {
          clearTimeout(timeout);
          await sleep(wait);
          continue;
        }
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

/**
 * Worth asking the other mixer about.
 *
 * The same test as retrying, and for the same reason: a full pot, a restart or
 * a dropped connection is somebody else's to answer, while a rejected key or a
 * malformed body is ours and would fail identically over there. Failing over
 * on those would hide a mistake behind a second bill.
 *
 * A reply that arrived and was unusable is deliberately not here either. It is
 * a 502 like the rest, but it means the mixer worked and the content did not,
 * which the deterministic fallback handles better than another generation.
 */
function isWorthAskingElsewhere(error: MixError): boolean {
  if (error.message === "The mixer returned nothing usable") return false;
  return isWorthRetrying(error.status);
}

export async function generateStructured<T>({
  model,
  instruction,
  parts,
  schema,
  deadlineAt,
  allowFallback = false,
}: {
  model: string;
  instruction: string;
  parts: MixPart[];
  schema: unknown;
  /**
   * When this call must be finished by, as an absolute time.
   *
   * A request that makes more than one call has to share one budget between
   * them, or the first spends everything and the platform kills the function
   * before the second runs. Organizing a note with images is exactly that
   * shape: reading the pictures, then writing the note.
   */
  deadlineAt?: number;
  /**
   * Whether a capacity refusal should be put to the standby mixer.
   *
   * Off by default, so a caller that has not thought about the budget split
   * keeps the behaviour it always had. The study route turns it on, because
   * that is where a full pot is actually being felt.
   */
  allowFallback?: boolean;
}): Promise<T> {
  const primary = primaryProvider(model);
  if (!primary) throw new MixError("Mixing is not configured", 503);

  const deadline = deadlineAt ?? Date.now() + TOTAL_BUDGET_MS;
  const standby = allowFallback ? fallbackProvider() : null;

  // With nowhere to fall back to, the primary gets the whole budget and every
  // attempt, exactly as before. The split only exists to make room.
  const primaryDeadline = standby
    ? Math.min(deadline, Date.now() + (deadline - Date.now()) * PRIMARY_SHARE_WITH_FALLBACK)
    : deadline;
  const primaryAttempts = standby ? PRIMARY_ATTEMPTS_WITH_FALLBACK : MAX_ATTEMPTS;

  try {
    return await askOneMixer<T>({
      provider: primary,
      instruction,
      parts,
      schema,
      deadline: primaryDeadline,
      maxAttempts: primaryAttempts,
    });
  } catch (error) {
    const failure = error instanceof MixError ? error : new MixError("Mixing failed", 502);
    if (!standby || !isWorthAskingElsewhere(failure)) throw failure;
    if (deadline - Date.now() < MIN_ATTEMPT_MS) throw failure;

    console.warn(
      `[mix] ${primary.label} refused (${failure.status ?? "no status"}): ${failure.message}. Asking ${standby.label}.`,
    );

    try {
      return await askOneMixer<T>({
        provider: standby,
        instruction,
        parts,
        schema,
        deadline,
        maxAttempts: MAX_ATTEMPTS,
      });
    } catch (second) {
      // Report the standby's failure, since it is the one that had the time
      // and the last word. The primary's refusal is already in the log above.
      throw second instanceof MixError ? second : failure;
    }
  }
}
