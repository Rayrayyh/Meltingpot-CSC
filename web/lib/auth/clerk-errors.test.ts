import { describe, expect, it } from "vitest";
import { clerkErrorCode, clerkErrorMessage } from "./clerk-errors";

const clerkError = (code: string, longMessage?: string) => ({ errors: [{ code, longMessage }] });

describe("clerkErrorCode", () => {
  it("reads a wrong password as wrong credentials, not a weak password", () => {
    expect(clerkErrorCode(clerkError("form_password_incorrect"))).toBe("invalid_credentials");
    expect(clerkErrorCode(clerkError("form_password_validation_failed"))).toBe("invalid_credentials");
    expect(clerkErrorCode(clerkError("form_identifier_not_found"))).toBe("invalid_credentials");
  });

  it("reads a breached password as its own case, since it met the rules", () => {
    expect(clerkErrorCode(clerkError("form_password_pwned"))).toBe("password_compromised");
    expect(clerkErrorCode(clerkError("form_password_compromised"))).toBe("password_compromised");
  });

  it("reads the password rule family as a weak password", () => {
    expect(clerkErrorCode(clerkError("form_password_length_too_short"))).toBe("weak_password");
    expect(clerkErrorCode(clerkError("form_password_not_strong_enough"))).toBe("weak_password");
  });

  it("maps the rest of the table", () => {
    expect(clerkErrorCode(clerkError("form_identifier_exists"))).toBe("email_taken");
    expect(clerkErrorCode(clerkError("form_param_format_invalid"))).toBe("invalid_email");
    expect(clerkErrorCode(clerkError("form_code_incorrect"))).toBe("invalid_code");
    expect(clerkErrorCode(clerkError("too_many_requests"))).toBe("rate_limited");
    expect(clerkErrorCode(clerkError("signup_rate_limit_exceeded"))).toBe("rate_limited");
    expect(clerkErrorCode(clerkError("user_locked"))).toBe("account_locked");
    expect(clerkErrorCode(clerkError("session_reverification_required"))).toBe("reverification_required");
  });

  it("reads the captcha's runtime error, which carries its code at the top level", () => {
    expect(clerkErrorCode({ code: "captcha_unavailable", message: "" })).toBe("not_configured");
    expect(clerkErrorCode(clerkError("captcha_invalid"))).toBe("rate_limited");
  });

  it("answers unknown for anything else, including codes Clerk no longer sends", () => {
    expect(clerkErrorCode(clerkError("session_exists"))).toBe("unknown");
    expect(clerkErrorCode(clerkError("verification_failed"))).toBe("unknown");
    expect(clerkErrorCode(clerkError("form_identifier_invalid"))).toBe("unknown");
    expect(clerkErrorCode(new Error("network"))).toBe("unknown");
    expect(clerkErrorCode(null)).toBe("unknown");
  });
});

describe("clerkErrorMessage", () => {
  it("prefers Clerk's long message, then a plain Error's", () => {
    expect(clerkErrorMessage(clerkError("x", "Password is incorrect."))).toBe("Password is incorrect.");
    expect(clerkErrorMessage(new Error("network"))).toBe("network");
    expect(clerkErrorMessage(null)).toBeUndefined();
  });
});
