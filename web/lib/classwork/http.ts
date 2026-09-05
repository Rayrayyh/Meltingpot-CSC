import {
  MAX_ATTEMPTS,
  honourRetryAfter,
  isWorthRetrying,
  waitBeforeRetry,
} from "@/lib/mix/server";
import { ClassworkError } from "@/lib/classwork/types";

/**
 * One call to a provider, inside a budget, the way lib/mix/server.ts talks to
 * the model. The budget is an absolute time, so a sync that makes twenty calls
 * shares one clock. Capacity refusals and connection failures are retried with
 * the same short jittered waits; a refusal about the request itself is not.
 *
 * What comes back is the Response, unread, because Canvas puts its rate limit
 * in headers and Google its page token in the body, and the adapter knows
 * which it is looking at.
 */
const MIN_ATTEMPT_MS = 1_500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ProviderFetchInit = RequestInit & {
  deadlineAt: number;
  fetch?: typeof fetch;
  /** Names the call in errors, never the token. */
  label: string;
};

export async function providerFetch(url: string, init: ProviderFetchInit): Promise<Response> {
  const { deadlineAt, fetch: doFetch = fetch, label, ...request } = init;
  let lastError: ClassworkError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const remaining = deadlineAt - Date.now();
    if (remaining < MIN_ATTEMPT_MS) {
      throw lastError ?? new ClassworkError(`${label} ran out of time`, "timed_out", 504);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    let response: Response | undefined;
    try {
      response = await doFetch(url, { ...request, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ClassworkError(`${label} timed out`, "timed_out", 504);
      }
      lastError = new ClassworkError(
        `${label} could not be reached`,
        "provider_failed",
        undefined,
      );
      void error;
    } finally {
      clearTimeout(timer);
    }

    if (response) {
      if (response.ok) return response;
      if (response.status === 401) {
        throw new ClassworkError(`${label} was refused`, "reconnect_required", 401);
      }
      if (response.status === 403 && !looksLikeThrottle(response)) {
        throw new ClassworkError(`${label} is not allowed`, "forbidden", 403);
      }
      const status = response.status === 403 ? 429 : response.status;
      if (!isWorthRetrying(status)) {
        throw new ClassworkError(`${label} failed (${response.status})`, "provider_failed", response.status);
      }
      lastError = new ClassworkError(
        status === 429 ? `${label} is busy` : `${label} failed (${response.status})`,
        status === 429 ? "rate_limited" : "provider_failed",
        response.status,
      );
      // Drain so the connection can be reused.
      await response.text().catch(() => undefined);
      const asked = honourRetryAfter(response.headers.get("retry-after"));
      const wait = asked ?? waitBeforeRetry(attempt);
      if (attempt < MAX_ATTEMPTS && Date.now() + wait + MIN_ATTEMPT_MS < deadlineAt) {
        await sleep(wait);
        continue;
      }
      throw lastError;
    }

    const wait = waitBeforeRetry(attempt);
    if (attempt < MAX_ATTEMPTS && Date.now() + wait + MIN_ATTEMPT_MS < deadlineAt) {
      await sleep(wait);
      continue;
    }
    throw lastError ?? new ClassworkError(`${label} failed`, "provider_failed");
  }
  throw lastError ?? new ClassworkError(`${label} failed`, "provider_failed");
}

/** Canvas reports a spent quota as 403 with a telltale header. */
function looksLikeThrottle(response: Response): boolean {
  return response.headers.has("x-rate-limit-remaining");
}

/** Read JSON, or say plainly that the provider did not send any. */
export async function readJson<T>(response: Response, label: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ClassworkError(`${label} sent something that was not JSON`, "provider_failed", response.status);
  }
}
