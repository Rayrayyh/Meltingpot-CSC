import type { AuthErrorCode } from "@/lib/auth/types";

/**
 * Clerk reports failures as coded errors. The codes the UI knows are mapped
 * once, here, and the order matters: form_password_incorrect is a wrong
 * password at sign in, and it would read as weak_password if the family
 * prefix were tested first.
 */
export function clerkErrorCode(error: unknown): AuthErrorCode {
  const first = (error as { errors?: Array<{ code?: string }> } | null)?.errors?.[0]?.code ?? "";
  if (first === "form_identifier_exists") return "email_taken";
  if (first === "form_identifier_not_found" || first === "form_password_incorrect") return "invalid_credentials";
  if (first === "form_password_validation_failed") return "invalid_credentials";
  if (first.startsWith("form_password_")) return "weak_password";
  if (first === "form_param_format_invalid" || first === "form_identifier_invalid") return "invalid_email";
  if (first === "form_code_incorrect" || first === "verification_failed") return "invalid_code";
  if (first === "too_many_requests") return "rate_limited";
  return "unknown";
}

/** The sentence Clerk attached, for the AuthError message; never shown as is. */
export function clerkErrorMessage(error: unknown): string | undefined {
  const first = (error as { errors?: Array<{ longMessage?: string; message?: string }> } | null)?.errors?.[0];
  return first?.longMessage ?? first?.message ?? (error instanceof Error ? error.message : undefined);
}
