"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { clerkErrorCode, clerkErrorMessage } from "@/lib/auth/clerk-errors";
import { clerkOnWindow, type LoadedClerk } from "@/lib/auth/clerk-window";
import {
  AuthError,
  type ClientAuthProvider,
  type SecondFactorSetup,
  type SignInOutcome,
} from "@/lib/auth/types";

/**
 * Clerk behind the seam, browser half, selected when
 * NEXT_PUBLIC_AUTH_PROVIDER=clerk. It drives Clerk's own client, window.Clerk,
 * which ClerkProvider in the root layout loads. The method names are the
 * product's: signIn is Clerk's signIn.create, the second factor is its TOTP
 * strategy, register is signUp.create. The server half is clerk-server.ts.
 *
 * What still has to be true for this to run: docs/CLERK.md, step by step.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Clerk, loaded, or the reason it is not. */
async function clerk(): Promise<LoadedClerk> {
  if (typeof window === "undefined") throw new AuthError("not_configured", "Clerk runs in the browser.");
  const instance = await clerkOnWindow();
  if (!instance) {
    throw new AuthError(
      "not_configured",
      "Clerk did not load. Check NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and the content security policy.",
    );
  }
  return instance;
}

/** One AuthError out of whatever Clerk threw, keeping one the code already made. */
function failure(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  return new AuthError(clerkErrorCode(error), clerkErrorMessage(error));
}

async function activate(c: LoadedClerk, sessionId: string | null): Promise<void> {
  if (!sessionId) throw new AuthError("unknown", "Clerk finished without a session.");
  await c.setActive({ session: sessionId });
}

/** The display name Clerk holds for a person, in the product's order of preference. */
function displayNameOf(user: LoadedClerk["user"]): string {
  const chosen = typeof user?.unsafeMetadata?.displayName === "string" ? user.unsafeMetadata.displayName : "";
  const full = user?.fullName ?? "";
  const local = user?.primaryEmailAddress?.emailAddress.split("@")[0] ?? "";
  return (chosen.trim() || full.trim() || local || "Student").slice(0, 80);
}

/**
 * The profile row a Clerk subject stands behind, made on first arrival and a
 * no-op after. Called the moment a session opens in the browser, because the
 * sign in form's next act is a class code join that writes a membership
 * against profiles, before any server render has had the chance to make the
 * row. A refusal here means Supabase did not accept Clerk's token at all, which
 * is a setup fault worth naming rather than a wrong code.
 */
async function ensureProfile(c: LoadedClerk): Promise<void> {
  const { error } = await supabaseBrowser().rpc("ensure_profile", {
    p_display_name: displayNameOf(c.user ?? c.session?.user ?? null),
  });
  if (error) {
    throw new AuthError(
      "not_configured",
      `Supabase did not accept Clerk's session token (${error.message}). Check third-party auth in the Supabase dashboard; docs/CLERK.md step 2.`,
    );
  }
}

export const clerkClientAuth: ClientAuthProvider = {
  name: "clerk",

  async getUserId(): Promise<string | null> {
    const c = await clerk();
    if (!c.user) return null;
    // The profile id, not Clerk's: current_uid() maps the session's subject
    // the same way every policy does, so a browser-side insert carries the
    // id the row's own policy expects.
    const { data } = await supabaseBrowser().rpc("current_uid");
    return typeof data === "string" && UUID.test(data) ? data : null;
  },

  async register({ email, password, displayName }): Promise<void> {
    const c = await clerk();
    if (!c.client) throw new AuthError("not_configured");
    try {
      const attempt = await c.client.signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { displayName: displayName.trim().slice(0, 80) },
      });
      if (attempt.status === "complete") {
        // Clerk signs the new account in as part of creating it. The form's
        // own sign in that follows sees this session and lets it stand.
        await activate(c, attempt.createdSessionId);
        await ensureProfile(c);
        return;
      }
      // "missing_requirements" means the Clerk application asks for more than
      // an email and a password, most often email verification. The product
      // has no step for that yet; docs/CLERK.md says which switch to turn off.
      throw new AuthError(
        "not_configured",
        `Clerk asked for more before creating the account (${attempt.status ?? "unknown"}). Turn off email verification in the Clerk dashboard, or add the verification step.`,
      );
    } catch (error) {
      throw failure(error);
    }
  },

  async signIn({ email, password }): Promise<SignInOutcome> {
    const c = await clerk();
    if (!c.client) throw new AuthError("not_configured");
    try {
      if (c.user) {
        const wanted = email.trim().toLowerCase();
        const same = c.user.emailAddresses.some((e) => e.emailAddress.toLowerCase() === wanted);
        if (same) {
          // The session register just opened, or this person's own: it stands.
          await ensureProfile(c);
          return { status: "signed-in" };
        }
        // Somebody else is signed in on this device. Under Supabase a sign in
        // simply replaces the session; here the old one is ended first, without
        // Clerk's signOut, which would navigate away mid form.
        await c.session?.remove();
        await c.setActive({ session: null });
      }
      const attempt = await c.client.signIn.create({ identifier: email, password });
      if (attempt.status === "complete") {
        await activate(c, attempt.createdSessionId);
        await ensureProfile(c);
        return { status: "signed-in" };
      }
      if (attempt.status === "needs_second_factor") {
        const strategies = (attempt.supportedSecondFactors ?? []).map((f) => f.strategy);
        if (!strategies.includes("totp")) {
          // The dashboard offers a factor the product has no screen for (SMS,
          // backup codes); a code field that can never be satisfied would be
          // the alternative. docs/CLERK.md step 1.3 says which to turn on.
          throw new AuthError(
            "not_configured",
            `Clerk asks for a second factor this product does not offer (${strategies.join(", ") || "none listed"}). Turn on Authenticator app in the Clerk dashboard.`,
          );
        }
        return { status: "second-factor-required", factorId: "totp" };
      }
      throw new AuthError("unknown", `Clerk stopped the sign in at ${attempt.status ?? "an unknown step"}.`);
    } catch (error) {
      throw failure(error);
    }
  },

  async signOut(): Promise<void> {
    const c = await clerk();
    await c.signOut();
  },

  async changePassword({ password, currentPassword }): Promise<void> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    try {
      // Clerk wants the current password from an account that has one, which
      // every account this product makes does; the panel asks for it under
      // Clerk. Every other session ends with the old password, as the seam
      // promises.
      await c.user.updatePassword({ newPassword: password, currentPassword, signOutOfOtherSessions: true });
    } catch (error) {
      throw failure(error);
    }
  },

  async verifySecondFactor({ code }): Promise<void> {
    const c = await clerk();
    if (!c.client) throw new AuthError("not_configured");
    try {
      const pending = c.client.signIn;
      if (pending.status === "needs_second_factor") {
        // Mid sign in: the attempt the form started is waiting for this code.
        const attempt = await pending.attemptSecondFactor({ strategy: "totp", code });
        if (attempt.status !== "complete") throw new AuthError("invalid_code");
        await activate(c, attempt.createdSessionId);
        await ensureProfile(c);
        return;
      }
      // No sign in pending, so this is an open session whose factor has not
      // cleared: the one that was signed in when two step sign in was turned
      // on. Clerk calls what follows reverification. It stamps the second
      // factor's age into the session token, which is what has_required_aal()
      // in Postgres and getAssuranceLevel() on the server read, so the
      // session is whole everywhere at once rather than only in this tab.
      const session = c.session;
      if (!session) throw new AuthError("unknown", "Not signed in.");
      const started = await session.startVerification({ level: "second_factor" });
      if (started.status === "needs_first_factor") {
        throw new AuthError("unknown", "Clerk wants the password again first. Sign out and back in.");
      }
      if (started.status !== "complete") {
        const verified = await session.attemptSecondFactorVerification({ strategy: "totp", code });
        if (verified.status !== "complete") throw new AuthError("invalid_code");
      }
      // The token Clerk cached still says the factor never cleared; fetch the
      // one that says otherwise so the next request carries it.
      await session.getToken({ skipCache: true });
    } catch (error) {
      throw failure(error);
    }
  },

  async beginSecondFactorSetup(): Promise<SecondFactorSetup> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    try {
      const totp = await c.user.createTOTP();
      // Clerk hands back the otpauth uri; the settings panel wants an image.
      const { toDataURL } = await import("qrcode");
      const qrCode = totp.uri ? await toDataURL(totp.uri, { margin: 1, width: 240 }) : "";
      return { factorId: totp.id, qrCode, secret: totp.secret ?? "" };
    } catch (error) {
      throw failure(error);
    }
  },

  async completeSecondFactorSetup({ code }): Promise<void> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    try {
      await c.user.verifyTOTP({ code });
      // Enrolment does not clear the factor for this session: the token still
      // carries -1 for it, so the next protected page asks for a code once,
      // through verifySecondFactor above. The refresh makes sure that page
      // sees the account as enrolled straight away.
      await c.session?.getToken({ skipCache: true });
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("invalid_code", clerkErrorMessage(error));
    }
  },

  async cancelSecondFactorSetup(): Promise<void> {
    const c = await clerk();
    if (!c.user) return;
    // An unverified TOTP is still a TOTP on the account; taking it off is the
    // only way to abandon it.
    await c.user.disableTOTP().catch(() => undefined);
  },

  async removeSecondFactor(): Promise<void> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    try {
      await c.user.disableTOTP();
    } catch (error) {
      throw new AuthError("unknown", clerkErrorMessage(error));
    }
  },
};
