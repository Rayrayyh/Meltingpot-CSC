import "server-only";
import { z } from "zod";
import type { ClassworkProvider } from "@/lib/classwork/types";

/**
 * Everything the classwork routes read from the environment, checked once and
 * read lazily, so an unset value degrades to "not set up on this site" rather
 * than a broken button or a crash at import time. Nothing here carries a
 * NEXT_PUBLIC_ prefix: availability is computed on the server and handed to
 * pages as props.
 */
const schema = z.object({
  APP_ORIGIN: z.string().url().optional(),
  CLASSWORK_STATE_SECRET: z.string().min(32).optional(),
  CLASSWORK_SERVER_KEY: z.string().min(32).optional(),
  CLASSROOM_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  CLASSROOM_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  CANVAS_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  CANVAS_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  CANVAS_INSTANCE_URL: z.string().url().optional(),
  CLASSWORK_PROVIDER_MODE: z.enum(["live", "stub"]).optional(),
  CLASSWORK_STUB_ORIGIN: z.string().url().optional(),
  CLASSWORK_SYNC_TRIGGER_SECRET: z.string().min(32).optional(),
});

export type ClassworkConfig = z.infer<typeof schema>;

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

/** Read fresh each time: tests set and clear these, and the cost is nothing. */
export type EnvLike = Record<string, string | undefined>;

/** Each malformed variable is named once per process, not once per request. */
const warned = new Set<string>();

export function getClassworkConfig(env: EnvLike = process.env): ClassworkConfig {
  // Each value is checked on its own. A malformed one is treated as unset and
  // named in the server log, rather than thrown or allowed to switch the
  // whole feature off: a bad Canvas URL leaves Google Classroom working.
  const out: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, field] of Object.entries(schema.shape)) {
    const value = blankToUndefined(env[key]);
    if (value === undefined) continue;
    const parsed = field.safeParse(value);
    if (parsed.success) out[key] = parsed.data;
    else dropped.push(key);
  }
  const fresh = dropped.filter((key) => !warned.has(key));
  if (fresh.length > 0) {
    for (const key of fresh) warned.add(key);
    console.warn(`[classwork] ignoring malformed environment values: ${fresh.join(", ")}`);
  }
  return out as ClassworkConfig;
}

/** Which providers this deployment can actually connect. */
export function classworkAvailability(env: EnvLike = process.env): Record<ClassworkProvider, boolean> {
  const c = getClassworkConfig(env);
  const shared = Boolean(c.APP_ORIGIN && c.CLASSWORK_STATE_SECRET && c.CLASSWORK_SERVER_KEY);
  return {
    google_classroom: shared && Boolean(c.CLASSROOM_OAUTH_CLIENT_ID && c.CLASSROOM_OAUTH_CLIENT_SECRET),
    canvas:
      shared &&
      Boolean(c.CANVAS_OAUTH_CLIENT_ID && c.CANVAS_OAUTH_CLIENT_SECRET && c.CANVAS_INSTANCE_URL),
  };
}

/** The redirect URI for a provider, built from APP_ORIGIN and nothing else. */
export function redirectUriFor(provider: ClassworkProvider, env: EnvLike = process.env): string {
  const origin = getClassworkConfig(env).APP_ORIGIN;
  if (!origin) throw new Error("APP_ORIGIN is not set");
  return `${origin.replace(/\/$/, "")}/api/classwork/callback/${provider}`;
}

/**
 * Where the provider's endpoints live. In stub mode both providers point at
 * the local stub server, and nothing else about the adapters changes, so the
 * end to end suite exercises the real code with fake answers.
 */
export function providerOrigins(env: EnvLike = process.env): {
  googleAuth: string;
  googleToken: string;
  googleRevoke: string;
  googleApi: string;
  canvas: (instanceUrl: string) => string;
} {
  const c = getClassworkConfig(env);
  if (c.CLASSWORK_PROVIDER_MODE === "stub" && c.CLASSWORK_STUB_ORIGIN) {
    const stub = c.CLASSWORK_STUB_ORIGIN.replace(/\/$/, "");
    return {
      googleAuth: `${stub}/google/o/oauth2/v2/auth`,
      googleToken: `${stub}/google/token`,
      googleRevoke: `${stub}/google/revoke`,
      googleApi: `${stub}/google/classroom/v1`,
      canvas: () => `${stub}/canvas`,
    };
  }
  return {
    googleAuth: "https://accounts.google.com/o/oauth2/v2/auth",
    googleToken: "https://oauth2.googleapis.com/token",
    googleRevoke: "https://oauth2.googleapis.com/revoke",
    googleApi: "https://classroom.googleapis.com/v1",
    canvas: (instanceUrl: string) => instanceUrl.replace(/\/$/, ""),
  };
}
