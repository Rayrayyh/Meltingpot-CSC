import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
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
 * What still has to be true for this to run: docs/CLERK.md, step by step.
 */

/**
 * One Backend API round trip per request, however many seam methods a page
 * calls. currentUser() itself is not memoized, and a class online at once
 * would otherwise walk into Clerk's rate limit three calls at a time.
 */
const clerkUser = cache(() => currentUser());

/** The display name Clerk holds for a person, in the product's order of preference. */
function displayNameOf(
  user: {
    firstName: string | null;
    lastName: string | null;
    unsafeMetadata: Record<string, unknown>;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null,
): string {
  if (!user) return "Student";
  const chosen = typeof user.unsafeMetadata?.displayName === "string" ? user.unsafeMetadata.displayName : "";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const local = user.emailAddresses[0]?.emailAddress.split("@")[0] ?? "";
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

export const clerkServerAuth: ServerAuthProvider = {
  name: "clerk",

  async getUser(): Promise<AuthUser | null> {
    const { userId } = await auth();
    if (!userId) return null;

    const supabase = await supabaseServer();
    const { data: found, error: lookupError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (lookupError) throw refused("the profile lookup", lookupError.message);

    const user = await clerkUser();
    let profile = found;
    if (!profile) {
      // First arrival: the row the trigger on auth.users used to make.
      const { data: id, error } = await supabase.rpc("ensure_profile", { p_display_name: displayNameOf(user) });
      if (error || !id) throw refused("ensure_profile", error?.message);
      const { data: made, error: readError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (readError || !made) throw refused("reading the new profile", readError?.message);
      profile = made;
    }

    const primary =
      user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      "";
    return {
      id: profile.id,
      email: primary,
      displayName: profile.display_name,
      avatarPath: profile.avatar_url,
    };
  },

  async getAssuranceLevel(): Promise<AssuranceLevel> {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { current: null, next: null };
    const user = await clerkUser();
    const enrolled = user?.twoFactorEnabled === true;
    // fva: minutes since the first and second factor were verified, -1 for a
    // factor this session never cleared. Clerk refuses a session to an
    // enrolled account without its second factor, so aal1/aal2 has one
    // cause: the factor was enrolled inside this session. That session is
    // sent to the verify step, where reverification stamps the age in. A
    // token with no fva at all has nothing to read and is taken as whole.
    const fva = (sessionClaims as { fva?: [number, number] } | null)?.fva;
    const cleared = !Array.isArray(fva) || fva[1] >= 0;
    return { current: enrolled && !cleared ? "aal1" : enrolled ? "aal2" : "aal1", next: enrolled ? "aal2" : "aal1" };
  },

  async getVerifiedSecondFactorId(): Promise<string | null> {
    const user = await clerkUser();
    return user?.totpEnabled ? "totp" : null;
  },
};
