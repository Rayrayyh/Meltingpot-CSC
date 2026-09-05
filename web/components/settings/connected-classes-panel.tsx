"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, CalendarCheck, CalendarBlank, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { StatusPill } from "@/components/ui/pills";
import { providerName } from "@/lib/classwork/labels";
import type { ClassworkProvider, ProviderCourse } from "@/lib/classwork/types";
import type { ConnectionSummary, LinkSummary } from "@/lib/data/classwork";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

/**
 * Connected classes, in account settings.
 *
 * Connecting is a full page hop to the provider's consent screen and back,
 * so those buttons are plain links. Everything else is a call and a refresh:
 * the server owns the state, and this panel never guesses at it. The list of
 * courses is the provider's, as last fetched; a private link ("Show in my
 * calendar") is the one thing a person creates here, and it is theirs alone.
 */
const PROVIDERS: ClassworkProvider[] = ["google_classroom", "canvas"];

export type ClassworkNotice = { connected?: ClassworkProvider; error?: string };

const ERROR_COPY: Record<string, string> = {
  denied: "No problem. Nothing was connected.",
  failed: "We couldn't finish connecting just now. Try again in a moment.",
  expired: "That took a little too long and the link expired. Start again from here.",
  unavailable: "Connecting a class is not set up on this site yet.",
};

function since(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function reconnectCopy(provider: ClassworkProvider) {
  return provider === "google_classroom"
    ? "Google Classroom needs reconnecting. Google asks for this every week while the app is in testing."
    : "Canvas needs reconnecting. Your school's Canvas stopped accepting the connection.";
}

export function ConnectedClassesPanel({
  availability,
  connections,
  links,
  notice,
}: {
  availability: Record<ClassworkProvider, boolean>;
  connections: ConnectionSummary[];
  links: LinkSummary[];
  notice: ClassworkNotice;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<ConnectionSummary | null>(null);
  const offered = PROVIDERS.some((p) => availability[p]);

  async function call(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "classwork_failed");
    return payload;
  }

  async function refreshCourses(connection: ConnectionSummary) {
    setBusy(`courses:${connection.id}`);
    setStatus(null);
    try {
      await call("/api/classwork/courses", { connectionId: connection.id });
      setStatus("Course list refreshed.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error && error.message === "reconnect_required"
          ? reconnectCopy(connection.provider)
          : `We couldn't reach ${providerName(connection.provider)} just now.`,
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(connection: ConnectionSummary) {
    setBusy(`disconnect:${connection.id}`);
    setStatus(null);
    try {
      await call("/api/classwork/disconnect", { connectionId: connection.id });
      setStatus(`${providerName(connection.provider)} disconnected. Everything it brought in is gone.`);
      setDisconnecting(null);
      router.refresh();
    } catch {
      setStatus(`We couldn't disconnect ${providerName(connection.provider)} just now.`);
    } finally {
      setBusy(null);
    }
  }

  async function setInCalendar(connection: ConnectionSummary, course: ProviderCourse, on: boolean) {
    const existing = links.find(
      (l) => l.connectionId === connection.id && l.externalCourseId === course.externalId && l.potId === null,
    );
    setBusy(`course:${connection.id}:${course.externalId}`);
    setStatus(null);
    const supabase = supabaseBrowser();
    try {
      if (on && !existing) {
        const { data: linkId, error } = await supabase.rpc("link_lms_course", {
          p_connection_id: connection.id,
          p_external_course_id: course.externalId,
          p_course_name: course.name,
          p_course_url: course.url,
          p_enrollment: course.enrollment,
        });
        if (error || !linkId) throw new Error(error?.message ?? "link_failed");
        setStatus(`${course.name} is in your calendar. Fetching its due dates.`);
        // The first pass right away, so the calendar has something to show
        // when they go and look.
        await call("/api/classwork/sync", { linkId }).catch(() => null);
        setStatus(`${course.name} is in your calendar.`);
      } else if (!on && existing) {
        const { error } = await supabase.rpc("unlink_lms_course", { p_link_id: existing.id });
        if (error) throw new Error(error.message);
        setStatus(`${course.name} is out of your calendar.`);
      }
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error && error.message.includes("rate_limited")
          ? "That is a lot of changes at once. Give it a few minutes."
          : "That didn't save. Try again in a moment.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card id="connected-classes">
      <CardSection className="space-y-5">
        <div className="space-y-1.5">
          <Eyebrow>Connected classes</Eyebrow>
          <p className="text-sm text-ink-muted leading-relaxed">
            Bring assignments, due dates and materials in from Google Classroom or Canvas.
            MeltingPot only reads; nothing goes back.
          </p>
        </div>

        {notice.connected ? (
          <NoticeBanner tone="success" title={`${providerName(notice.connected)} connected.`}>
            Your courses are listed below. Pick the ones you want in your calendar.
          </NoticeBanner>
        ) : null}
        {notice.error && ERROR_COPY[notice.error] ? (
          <NoticeBanner tone={notice.error === "denied" ? "neutral" : "warning"}>
            {ERROR_COPY[notice.error]}
          </NoticeBanner>
        ) : null}
        {!offered ? (
          <NoticeBanner tone="neutral">Connecting a class is not set up on this site yet.</NoticeBanner>
        ) : null}

        <p role="status" aria-live="polite" className={cn("text-[13px] text-ink-muted", !status && "sr-only")}>
          {status ?? ""}
        </p>

        <ul className="space-y-4">
          {PROVIDERS.map((provider) => {
            const connection = connections.find((c) => c.provider === provider) ?? null;
            const available = availability[provider];
            const providerLinks = links.filter((l) => l.provider === provider);
            return (
              <li
                key={provider}
                className="rounded-(--radius-control) border border-edge bg-surface"
                data-testid={`classwork-${provider}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-ink">{providerName(provider)}</p>
                    <p className="text-[12px] text-ink-muted">
                      {connection
                        ? `Connected${connection.externalDisplay ? ` as ${connection.externalDisplay}` : ""} since ${since(connection.consentAt)}`
                        : available
                          ? "Not connected"
                          : "Not available on this site"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {connection ? (
                      <>
                        <Button native href={`/api/classwork/connect/${provider}`} variant="secondary" size="sm">
                          Reconnect
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => refreshCourses(connection)}
                          disabled={busy !== null}
                        >
                          <ArrowsClockwise className={cn("size-3.5", busy === `courses:${connection.id}` && "animate-spin")} aria-hidden />
                          Refresh list
                        </Button>
                        <Button variant="quiet" size="sm" onClick={() => setDisconnecting(connection)} disabled={busy !== null}>
                          Disconnect
                        </Button>
                      </>
                    ) : available ? (
                      <Button native href={`/api/classwork/connect/${provider}`} size="sm">
                        Connect {providerName(provider)}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {connection?.needsReconnectAt ? (
                  <div className="px-4 pb-4">
                    <NoticeBanner
                      tone="warning"
                      icon={<Warning weight="fill" />}
                      action={
                        <Button native href={`/api/classwork/connect/${provider}`} size="sm">
                          Reconnect
                        </Button>
                      }
                    >
                      {reconnectCopy(provider)}
                    </NoticeBanner>
                  </div>
                ) : null}

                {connection ? (
                  <div className="border-t border-edge px-4 py-3.5 space-y-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Your courses</p>
                    {connection.courses.length === 0 ? (
                      <p className="text-[13px] text-ink-muted">
                        No courses came back. Refresh the list, or check which account you connected.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {connection.courses.map((course) => {
                          const mine = providerLinks.find(
                            (l) => l.connectionId === connection.id && l.externalCourseId === course.externalId && l.potId === null,
                          );
                          const potLinks = providerLinks.filter(
                            (l) => l.externalCourseId === course.externalId && l.potId !== null,
                          );
                          const working = busy === `course:${connection.id}:${course.externalId}`;
                          return (
                            <li
                              key={course.externalId}
                              data-link-id={mine?.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-(--radius-control) bg-sunken px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-ink">
                                  {course.name}
                                  {course.section ? <span className="text-ink-faint"> · {course.section}</span> : null}
                                </p>
                                <p className="text-[12px] text-ink-faint">
                                  {course.enrollment === "teacher" ? "You teach this" : course.enrollment === "student" ? "You are enrolled" : "Enrolled"}
                                  {potLinks.length > 0
                                    ? ` · Linked to ${potLinks.map((l) => l.potTitle ?? "a Pot").join(", ")}`
                                    : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-pressed={Boolean(mine)}
                                disabled={busy !== null}
                                onClick={() => setInCalendar(connection, course, !mine)}
                                className={cn(
                                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors disabled:opacity-50",
                                  mine
                                    ? "border-primary/30 bg-primary-soft text-primary"
                                    : "border-edge-strong bg-surface text-ink-muted hover:text-ink hover:bg-sunken",
                                )}
                              >
                                {mine ? (
                                  <CalendarCheck className={cn("size-3.5", working && "animate-pulse")} aria-hidden />
                                ) : (
                                  <CalendarBlank className={cn("size-3.5", working && "animate-pulse")} aria-hidden />
                                )}
                                {mine ? "In my calendar" : "Show in my calendar"}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {connection.coursesFetchedAt ? (
                      <p className="text-[11px] text-ink-faint">
                        List as of {since(connection.coursesFetchedAt)}.
                        {providerLinks.some((l) => l.syncStatus === "error") ? (
                          <>
                            {" "}
                            <StatusPill tone="warning">Last sync had trouble</StatusPill>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardSection>

      <ConfirmDialog
        open={disconnecting !== null}
        title={disconnecting ? `Disconnect ${providerName(disconnecting.provider)}?` : ""}
        confirmLabel="Disconnect"
        cancelLabel="Keep it connected"
        tone="danger"
        busy={busy?.startsWith("disconnect:") ?? false}
        onConfirm={() => disconnecting && disconnect(disconnecting)}
        onCancel={() => setDisconnecting(null)}
      >
        Every course you linked from this account, including any linked to a Pot, stops syncing and
        its imported classwork is removed. Notes you started from it stay.
      </ConfirmDialog>
    </Card>
  );
}
