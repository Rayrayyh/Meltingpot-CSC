/**
 * Which identity provider this build runs on. Read in one place so the seam's
 * two sides, the Supabase clients, the edge proxy and the root layout all
 * agree; a NEXT_PUBLIC_ variable so the browser bundle answers the same way
 * as the server.
 */
export type AuthProviderName = "supabase" | "clerk";

export function authProviderName(): AuthProviderName {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === "clerk" ? "clerk" : "supabase";
}

export function usingClerk(): boolean {
  return authProviderName() === "clerk";
}
