"use client";

import { useState } from "react";
import { Key } from "@phosphor-icons/react";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthError, getClientAuth } from "@/lib/auth/client";
import { passwordMeetsRules } from "@/lib/auth/password-rules";
import { usingClerk } from "@/lib/auth/provider";

/**
 * Changing the password from inside the account, which also ends every other
 * session. Until this existed the only route was the emailed reset, and a
 * session opened with the old password carried on working afterwards.
 */
export function PasswordPanel() {
  // Clerk will not change a password without the current one; Supabase never
  // asks. The field exists only where it is needed.
  const asksCurrent = usingClerk();
  const [current, setCurrent] = useState("");
  // Revealed only when the provider wants a fresh code before the change
  // (Clerk, for an account with a second factor, ten minutes after sign in).
  const [askCode, setAskCode] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready =
    passwordMeetsRules(password) &&
    confirm === password &&
    (!asksCurrent || current.length > 0) &&
    (!askCode || code.length === 6);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setDone(false);
    if (!passwordMeetsRules(password)) {
      setError("Your new password does not meet all five rules yet.");
      return;
    }
    if (confirm !== password) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await getClientAuth().changePassword({
        password,
        currentPassword: asksCurrent ? current : undefined,
        code: askCode ? code.trim() : undefined,
      });
      setCurrent("");
      setPassword("");
      setConfirm("");
      setAskCode(false);
      setCode("");
      setDone(true);
    } catch (caught) {
      const reason = caught instanceof AuthError ? caught.code : "unknown";
      if (reason === "reverification_required") {
        setAskCode(true);
        setError("It has been a while since you signed in. Enter the code from your authenticator app as well.");
      } else {
        setError(
          reason === "weak_password"
            ? "That password does not meet all five rules."
            : reason === "password_compromised"
              ? "This password has appeared in a data breach. Choose a different one."
              : reason === "invalid_credentials"
                ? "That is not your current password."
                : reason === "invalid_code"
                  ? "That code did not match. Codes change every 30 seconds, so try the current one."
                  : "We could not change it just now. Try again in a moment.",
        );
      }
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardSection className="space-y-4">
        <div className="space-y-1.5">
          <Eyebrow>Password</Eyebrow>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-muted">
            <Key className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
            Changing it here signs out everywhere else. This device stays signed in.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {asksCurrent ? (
            <Field label="Current password">
              {(props) => (
                <PasswordInput
                  {...props}
                  autoComplete="current-password"
                  value={current}
                  onChange={(event) => setCurrent(event.target.value)}
                />
              )}
            </Field>
          ) : null}

          <Field label="New password">
            {(props) => (
              <PasswordInput
                {...props}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>

          <PasswordChecklist password={password} />

          <Field label="Confirm password" error={error ?? undefined}>
            {(props) => (
              <PasswordInput
                {...props}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            )}
          </Field>

          {askCode ? (
            <Field label="Code from your authenticator app">
              {(props) => (
                <Input
                  {...props}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="max-w-40 font-mono tracking-[0.3em]"
                />
              )}
            </Field>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || !ready}>
              {busy ? "Changing" : "Change password"}
            </Button>
            {done ? (
              <p role="status" className="text-[13px] text-success">
                Changed. Every other session has been signed out.
              </p>
            ) : null}
          </div>
        </form>
      </CardSection>
    </Card>
  );
}
