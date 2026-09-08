"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthError, getClientAuth } from "@/lib/auth/client";

type Enrolling = { factorId: string; qr: string; secret: string };

/**
 * Second-step sign-in backed by an authenticator app. Offered to people who
 * run a Pot, because their account holds a whole class's work.
 *
 * A provider may ask the person to prove themselves again before a factor is
 * added or removed (Clerk does, ten minutes after sign in). The seam reports
 * that as reverification_required, and the panel then asks for the one thing
 * that clears it: the password before setup, a code before turning off.
 * Under Supabase neither question is ever asked.
 */
export function TwoFactorPanel({ enrolledFactorId }: { enrolledFactorId: string | null }) {
  const router = useRouter();
  // Seeded from the server so the panel never flashes the wrong state; kept
  // locally afterwards so turning it on or off shows immediately.
  const [factorId, setFactorId] = useState(enrolledFactorId);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [askPassword, setAskPassword] = useState(false);
  const [proofPassword, setProofPassword] = useState("");
  const [askCode, setAskCode] = useState(false);
  const [offCode, setOffCode] = useState("");

  function codeOf(caught: unknown): string {
    return caught instanceof AuthError ? caught.code : "unknown";
  }

  async function start(password?: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const setup = await getClientAuth().beginSecondFactorSetup(password ? { password } : undefined);
      setAskPassword(false);
      setProofPassword("");
      setCode("");
      setEnrolling({ factorId: setup.factorId, qr: setup.qrCode, secret: setup.secret });
    } catch (caught) {
      const reason = codeOf(caught);
      if (reason === "reverification_required") setAskPassword(true);
      else if (reason === "invalid_credentials") setError("That is not your password. Try again.");
      else setError("We could not start setup just now. Try again in a moment.");
    }
    setBusy(false);
  }

  async function confirmPassword(e: React.FormEvent) {
    e.preventDefault();
    await start(proofPassword);
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setBusy(true);
    setError(null);
    try {
      await getClientAuth().completeSecondFactorSetup({
        factorId: enrolling.factorId,
        code: code.trim(),
      });
    } catch {
      setError("That code did not match. Codes change every 30 seconds, so try the current one.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setEnrolling(null);
    setCode("");
    setFactorId(enrolling.factorId);
    router.refresh();
  }

  async function cancel() {
    if (!enrolling) return;
    await getClientAuth().cancelSecondFactorSetup({ factorId: enrolling.factorId });
    setEnrolling(null);
    setCode("");
    setError(null);
  }

  async function turnOff(proof?: string) {
    // A second click while the first is in flight would unenrol twice and
    // show the failure message for a factor that is already gone.
    if (!factorId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await getClientAuth().removeSecondFactor({ factorId, code: proof });
    } catch (caught) {
      setBusy(false);
      setConfirmOff(false);
      const reason = codeOf(caught);
      if (reason === "reverification_required") setAskCode(true);
      else if (reason === "invalid_code") setError("That code did not match. Try the current one.");
      else setError("We could not turn it off. Sign out, sign back in with a code, and try again.");
      return;
    }
    setBusy(false);
    setConfirmOff(false);
    setAskCode(false);
    setOffCode("");
    setFactorId(null);
    router.refresh();
  }

  async function confirmOffCode(e: React.FormEvent) {
    e.preventDefault();
    await turnOff(offCode.trim());
  }

  return (
    <Card>
      <CardSection className="space-y-4">
        <div className="space-y-1.5">
          <Eyebrow>Two-step sign in</Eyebrow>
          <p className="text-sm text-ink-muted leading-relaxed">
            Ask for a six-digit code from an authenticator app, like Google
            Authenticator, every time you sign in. Your class trusts what is in
            this Pot, so it is worth the extra few seconds.
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}

        {factorId ? (
          askCode ? (
            <form onSubmit={confirmOffCode} className="space-y-4">
              <p className="text-sm text-ink">
                It has been a while since you signed in, so enter the code from
                your app to turn two-step sign in off.
              </p>
              <Field label="Six-digit code">
                {(props) => (
                  <Input
                    {...props}
                    value={offCode}
                    onChange={(e) => setOffCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    autoFocus
                    className="max-w-40 font-mono tracking-[0.3em]"
                  />
                )}
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="secondary" disabled={busy || offCode.length !== 6}>
                  Turn it off
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => {
                    setAskCode(false);
                    setOffCode("");
                    setError(null);
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle className="size-[18px]" weight="fill" aria-hidden />
                Two-step sign in is on
              </p>
              <Button variant="secondary" size="sm" onClick={() => setConfirmOff(true)}>
                Turn off
              </Button>
            </div>
          )
        ) : enrolling ? (
          <form onSubmit={confirm} className="space-y-5">
            <ol className="space-y-5">
              <li className="space-y-3">
                <p className="text-sm text-ink">
                  1. Scan this with your authenticator app.
                </p>
                {/* A data URI from the provider, so next/image has nothing to optimize. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrolling.qr}
                  alt="Setup code as a scannable square"
                  className="size-44 rounded-(--radius-card) border border-edge bg-white p-2"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] text-ink-muted">Cannot scan? Enter this key:</p>
                  <code className="rounded bg-sunken px-2 py-1 font-mono text-[12px] text-ink break-all">
                    {enrolling.secret}
                  </code>
                  <CopyButton value={enrolling.secret} label="Copy key" />
                </div>
              </li>
              <li className="space-y-2">
                <Field label="2. Enter the six-digit code it shows">
                  {(props) => (
                    <Input
                      {...props}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="max-w-40 font-mono tracking-[0.3em]"
                    />
                  )}
                </Field>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy || code.length !== 6}>
                Turn on two-step sign in
              </Button>
              <Button type="button" variant="quiet" onClick={cancel} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        ) : askPassword ? (
          <form onSubmit={confirmPassword} className="space-y-4">
            <p className="text-sm text-ink">
              It has been a while since you signed in, so confirm your password
              to continue.
            </p>
            <Field label="Password">
              {(props) => (
                <PasswordInput
                  {...props}
                  autoComplete="current-password"
                  value={proofPassword}
                  onChange={(e) => setProofPassword(e.target.value)}
                  autoFocus
                />
              )}
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy || proofPassword.length === 0}>
                Continue
              </Button>
              <Button
                type="button"
                variant="quiet"
                onClick={() => {
                  setAskPassword(false);
                  setProofPassword("");
                  setError(null);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => start()} disabled={busy}>
            <ShieldCheck className="size-[18px]" aria-hidden />
            Set up two-step sign in
          </Button>
        )}
      </CardSection>

      <ConfirmDialog
        open={confirmOff}
        title="Turn off two-step sign in?"
        confirmLabel="Turn it off"
        onConfirm={() => turnOff()}
        onCancel={() => setConfirmOff(false)}
      >
        Your account goes back to a password on its own. You can set this up
        again at any time.
      </ConfirmDialog>
    </Card>
  );
}
