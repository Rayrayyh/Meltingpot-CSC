import type { AuthErrorCode } from "@/lib/auth/types";

/**
 * Clerk reports failures as coded errors: an API response carries them in
 * `errors[0].code`, and a ClerkRuntimeError (the captcha, for one) carries a
 * top level `code`. The codes the UI knows are mapped once, here, and the
 * order matters: form_password_incorrect is a wrong password at sign in, and
 * form_password_pwned a correct one found in a breach; both would read as
 * weak_password if the family prefix were tested first.
 */
export function clerkErrorCode(error: unknown): AuthErrorCode {
  const shaped = error as { errors?: Array<{ code?: string }>; code?: string } | null;
  const first = shaped?.errors?.[0]?.code ?? (typeof shaped?.code === "string" ? shaped.code : "");
  if (first === "session_reverification_required") return "reverification_required";
  if (first === "user_locked") return "account_locked";
  if (first === "form_identifier_exists") return "email_taken";
  if (first === "form_identifier_not_found" || first === "form_password_incorrect") return "invalid_credentials";
  if (first === "form_password_validation_failed") return "invalid_credentials";
  if (first === "form_password_pwned" || first === "form_password_compromised") return "password_compromised";
  if (first.startsWith("form_password_")) return "weak_password";
  if (first === "form_param_format_invalid") return "invalid_email";
  if (first === "form_code_incorrect") return "invalid_code";
  if (first === "too_many_requests" || first === "signup_rate_limit_exceeded") return "rate_limited";
  // Bot protection left on in the dashboard: the invisible check refused the
  // person, or could not run at all on a page with no slot for it.
  if (first === "captcha_invalid") return "rate_limited";
  if (first === "captcha_unavailable") return "not_configured";
  return "unknown";
}

/** The sentence Clerk attached, for the AuthError message; never shown as is. */
export function clerkErrorMessage(error: unknown): string | undefined {
  const first = (error as { errors?: Array<{ longMessage?: string; message?: string }> } | null)?.errors?.[0];
  return first?.longMessage ?? first?.message ?? (error instanceof Error ? error.message : undefined);
}
