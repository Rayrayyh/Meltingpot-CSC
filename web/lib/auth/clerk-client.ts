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

/**
 * Asks the server to mirror the account's second factor into the token's
 * two_factor claim (app/api/auth/second-factor/route.ts), then fetches the
 * token that carries it. Best effort: a failure here leaves the claim stale
 * until the next sign in repeats it, and the server's own read of the account
 * still gates every page, so it is logged rather than thrown.
 */
async function syncSecondFactorClaim(c: LoadedClerk): Promise<void> {
  try {
    const response = await fetch("/api/auth/second-factor", { method: "POST" });
    if (!response.ok) console.warn(`second factor claim not mirrored: ${response.status}`);
  } catch (error) {
    console.warn("second factor claim not mirrored", error);
  }
  await c.session?.getToken({ skipCache: true });
}

/** What clears a reverification: the password, a code, or whichever Clerk asks for. */
type Proof = { password?: string; code?: string };

/**
 * Clerk refuses its own sensitive actions (password change, adding or
 * removing a factor) ten minutes after sign in with
 * session_reverification_required, and expects the person to prove
 * themselves again. This runs the action, and on that refusal asks Clerk
 * which proof it wants, hands over the one the caller collected, refreshes
 * the token and runs the action once more. Without the right proof it
 * surfaces reverification_required so the panel can ask for it.
 */
async function reverified<T>(c: LoadedClerk, proof: Proof, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (clerkErrorCode(error) !== "reverification_required") throw error;
    const session = c.session;
    if (!session) throw new AuthError("unknown", "Not signed in.");
    // Clerk drops the level to the password when the account has no second factor.
    const started = await session.startVerification({ level: "second_factor" });
    if (started.status === "needs_first_factor") {
      if (!proof.password) throw new AuthError("reverification_required", "Clerk wants the password again first.");
      const verified = await session.attemptFirstFactorVerification({ strategy: "password", password: proof.password });
      if (verified.status === "needs_second_factor") {
        if (!proof.code) throw new AuthError("reverification_required", "Clerk wants a code from the app as well.");
        const both = await session.attemptSecondFactorVerification({ strategy: "totp", code: proof.code });
        if (both.status !== "complete") throw new AuthError("invalid_code");
      } else if (verified.status !== "complete") {
        throw new AuthError("invalid_credentials");
      }
    } else if (started.status === "needs_second_factor") {
      if (!proof.code) throw new AuthError("reverification_required", "Clerk wants a code from the app first.");
      const verified = await session.attemptSecondFactorVerification({ strategy: "totp", code: proof.code });
      if (verified.status !== "complete") throw new AuthError("invalid_code");
    }
    await session.getToken({ skipCache: true });
    return await run();
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
      // an email and a password, most often "Verify at sign-up", which Clerk
      // turns on by default. The product has no step for that yet;
      // docs/CLERK.md step 1.2 says which switch to turn off.
      throw new AuthError(
        "not_configured",
        `Clerk asked for more before creating the account (${attempt.status ?? "unknown"}). Turn off "Verify at sign-up" in the Clerk dashboard, or add the verification step.`,
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
        await syncSecondFactorClaim(c);
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
            `Clerk asks for a second factor this product does not offer (${strategies.join(", ") || "none listed"}). Turn on Authenticator application in the Clerk dashboard.`,
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

  async changePassword({ password, currentPassword, code }): Promise<void> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    const user = c.user;
    try {
      // Clerk wants the current password from an account that has one, which
      // every account this product makes does; the panel asks for it under
      // Clerk. Every other session ends with the old password, as the seam
      // promises.
      await reverified(c, { password: currentPassword, code }, () =>
        user.updatePassword({ newPassword: password, currentPassword, signOutOfOtherSessions: true }),
      );
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
        await syncSecondFactorClaim(c);
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

  async beginSecondFactorSetup(input): Promise<SecondFactorSetup> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    const user = c.user;
    try {
      const totp = await reverified(c, { password: input?.password }, () => user.createTOTP());
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
    } catch (error) {
      throw new AuthError("invalid_code", clerkErrorMessage(error));
    }
    // Enrolment may or may not clear the factor for this session (Clerk's
    // docs say the age is stamped at sign in and at reverification). Either
    // way the claim is mirrored now and the token refreshed, so the next
    // protected page sees the account as enrolled; if the age still says
    // never, that page asks for a code once, through verifySecondFactor.
    await syncSecondFactorClaim(c);
  },

  async cancelSecondFactorSetup(): Promise<void> {
    const c = await clerk();
    if (!c.user) return;
    // An unverified TOTP is still a TOTP on the account; taking it off is the
    // only way to abandon it.
    await c.user.disableTOTP().catch(() => undefined);
  },

  async removeSecondFactor({ code }): Promise<void> {
    const c = await clerk();
    if (!c.user) throw new AuthError("unknown", "Not signed in.");
    const user = c.user;
    try {
      await reverified(c, { code }, () => user.disableTOTP());
    } catch (error) {
      throw failure(error);
    }
    await syncSecondFactorClaim(c);
  },
};
