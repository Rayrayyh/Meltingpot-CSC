import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { supabaseServer } from "@/lib/supabase/server";
import { AuthError, type AssuranceLevel, type AuthUser, type ServerAuthProvider } from "@/lib/auth/types";

/**
 * Clerk behind the seam, server half, selected when
 * NEXT_PUBLIC_AUTH_PROVIDER=clerk. The browser half is clerk-client.ts; they
 * are two files because this one reads the request (next/headers) and must
 * never reach the client bundle.
 *
 * Identity here is the profile id, not Clerk's user id: every table and
 * policy keys on a uuid, and public.current_uid() (migration 0054) turns a
 * Clerk subject into one, so the rest of the app never learns which provider
 * signed the person in. Supabase trusts Clerk's session token through
 * third-party auth, which lib/supabase/server.ts passes along.
 *
 * The session token is the first source for everything here. docs/CLERK.md
 * step 1.6 puts the primary email and the second factor state into it as the
 * `email` and `two_factor` claims (the latter mirrored from Clerk's own
 * record by app/api/auth/second-factor/route.ts), so a render costs no
 * Backend API call. That API answers 100 requests per 10 seconds on a
 * development instance, which a class online at once would exceed; it is
 * reached only when a claim is missing or a profile has to be made.
 *
 * What still has to be true for this to run: docs/CLERK.md, step by step.
 */

/** What the token says, read leniently: a template renders strings as often as booleans. */
function claimsOf(sessionClaims: unknown): { email?: string; twoFactor?: boolean } {
  const claims = sessionClaims as { email?: unknown; two_factor?: unknown } | null;
  const email = typeof claims?.email === "string" && claims.email.includes("@") ? claims.email : undefined;
  const raw = claims?.two_factor;
  const twoFactor = raw === true || raw === "true" ? true : raw === false || raw === "false" ? false : undefined;
  return { email, twoFactor };
}

/**
 * One Backend API round trip per request at most, however many seam methods
 * a page calls, and a rate limit answered as "unknown" rather than a crash.
 */
const clerkUser = cache(async () => {
  try {
    return { user: await currentUser(), limited: false };
  } catch (error) {
    if (isClerkAPIResponseError(error) && error.status === 429) return { user: null, limited: true };
    throw error;
  }
});

/** The display name Clerk holds for a person, in the product's order of preference. */
function displayNameOf(
  user: {
    firstName: string | null;
    lastName: string | null;
    unsafeMetadata: Record<string, unknown>;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null,
  email: string | undefined,
): string {
  const chosen = typeof user?.unsafeMetadata?.displayName === "string" ? user.unsafeMetadata.displayName : "";
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const local = (user?.emailAddresses[0]?.emailAddress ?? email ?? "").split("@")[0];
  return (chosen.trim() || full.trim() || local || "Student").slice(0, 80);
}

/**
 * Clerk knows who this is and Supabase would not say. Thrown rather than
 * returned as nobody, because nobody would send the person to the sign in
 * form, where Clerk would sign them straight back in, forever. A page that
 * fails loudly names the setup step instead.
 */
function refused(step: string, detail: string | undefined): AuthError {
  return new AuthError(
    "not_configured",
    `Supabase refused ${step} for a Clerk session${detail ? ` (${detail})` : ""}. Check third-party auth in the Supabase dashboard; docs/CLERK.md step 2.`,
  );
}

/** Whether the account has a second factor: the claim, else Clerk's record. */
async function enrolled(sessionClaims: unknown): Promise<boolean> {
  const { twoFactor } = claimsOf(sessionClaims);
  if (twoFactor !== undefined) return twoFactor;
  const { user, limited } = await clerkUser();
  if (limited) {
    // Reaching here means the two_factor claim was never set up, so the
    // database's gate is absent too; silence would hide that.
    throw new AuthError(
      "not_configured",
      "Clerk's Backend API is rate limited and the session token carries no two_factor claim. Add the claim; docs/CLERK.md step 1.6.",
    );
  }
  return user?.twoFactorEnabled === true;
}

export const clerkServerAuth: ServerAuthProvider = {
  name: "clerk",

  async getUser(): Promise<AuthUser | null> {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;
    const claims = claimsOf(sessionClaims);

    const supabase = await supabaseServer();
    const { data: found, error: lookupError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (lookupError) throw refused("the profile lookup", lookupError.message);

    let profile = found;
    let email = claims.email;
    if (!profile || email === undefined) {
      const { user } = await clerkUser();
      email ??=
        user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
        user?.emailAddresses[0]?.emailAddress ??
        "";
      if (!profile) {
        // First arrival: the row the trigger on auth.users used to make.
        const { data: id, error } = await supabase.rpc("ensure_profile", {
          p_display_name: displayNameOf(user, email),
        });
        if (error || !id) throw refused("ensure_profile", error?.message);
        const { data: made, error: readError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", id)
          .maybeSingle();
        if (readError || !made) throw refused("reading the new profile", readError?.message);
        profile = made;
      }
    }

    return {
      id: profile.id,
      email,
      displayName: profile.display_name,
      avatarPath: profile.avatar_url,
    };
  },

  async getAssuranceLevel(): Promise<AssuranceLevel> {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { current: null, next: null };
    const hasFactor = await enrolled(sessionClaims);
    // fva: minutes since the first and second factor were verified, -1 for a
    // factor this session never cleared. Clerk refuses a session to an
    // enrolled account without its second factor, so aal1/aal2 has one
    // cause: the factor was enrolled inside this session. That session is
    // sent to the verify step, where reverification stamps the age in. A
    // token with no fva at all has nothing to read and is taken as whole.
    const fva = (sessionClaims as { fva?: [number, number] } | null)?.fva;
    const cleared = !Array.isArray(fva) || fva[1] >= 0;
    return {
      current: hasFactor && !cleared ? "aal1" : hasFactor ? "aal2" : "aal1",
      next: hasFactor ? "aal2" : "aal1",
    };
  },

  async getVerifiedSecondFactorId(): Promise<string | null> {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;
    return (await enrolled(sessionClaims)) ? "totp" : null;
  },
};
