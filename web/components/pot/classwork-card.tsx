"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SyncNowButton } from "@/components/classwork/sync-now-button";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/pills";
import { providerName } from "@/lib/classwork/labels";
import type { ConnectionSummary, LinkSummary } from "@/lib/data/classwork";
import { relativeTime } from "@/lib/time";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

/**
 * Linking a course to a Pot, in Pot settings. A maintainer picks from the
 * courses their own connected account can see; linking is an administrative
 * act the ledger records, and every member reads what it brings. Members see
 * the list and nothing to press.
 */
const NONE = "__none__";

type Choice = { value: string; label: string; connectionId: string; externalCourseId: string };

export function ClassworkCard({
  potId,
  role,
  links,
  connections,
  viewerId,
  offered,
}: {
  potId: string;
  role: "member" | "maintainer" | "owner";
  links: LinkSummary[];
  /** The viewer's own connections; empty for members, who cannot link. */
  connections: ConnectionSummary[];
  viewerId: string;
  offered: boolean;
}) {
  const router = useRouter();
  const canManage = role !== "member";
  const [choice, setChoice] = useState<string>(NONE);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<LinkSummary | null>(null);

  const choices = useMemo<Choice[]>(() => {
    // Keyed on the course itself rather than on whose connection brought
    // it, so a course another maintainer already linked is not offered a
    // second time and every item shown twice.
    const linked = new Set(links.map((l) => `${l.provider}:${l.externalCourseId}`));
    return connections.flatMap((connection) =>
      connection.courses
        .filter((course) => !linked.has(`${connection.provider}:${course.externalId}`))
        .map((course) => ({
          value: `${connection.id}:${course.externalId}`,
          label: `${course.name}${course.section ? ` (${course.section})` : ""}${connections.length > 1 ? `, ${providerName(connection.provider)}` : ""}`,
          connectionId: connection.id,
          externalCourseId: course.externalId,
        })),
    );
  }, [connections, links]);

  async function link() {
    const picked = choices.find((c) => c.value === choice);
    if (!picked) return;
    const connection = connections.find((c) => c.id === picked.connectionId);
    const course = connection?.courses.find((c) => c.externalId === picked.externalCourseId);
    if (!connection || !course) return;
    setBusy("link");
    setNote(null);
    try {
      const { data: linkId, error } = await supabaseBrowser().rpc("link_lms_course", {
        p_connection_id: connection.id,
        p_external_course_id: course.externalId,
        p_course_name: course.name,
        p_course_url: course.url,
        p_enrollment: course.enrollment,
        p_pot_id: potId,
      });
      if (error || !linkId) throw new Error(error?.message ?? "link_failed");
      setChoice(NONE);
      setNote(`${course.name} is linked. Fetching what it publishes.`);
      await fetch("/api/classwork/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkId }),
      }).catch(() => null);
      setNote(`${course.name} is linked. Everyone in the Pot can see its classwork now.`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setNote(
        message.includes("pot_archived")
          ? "This Pot is archived. Unarchive it first."
          : message.includes("rate_limited")
            ? "That is a lot of changes at once. Give it a few minutes."
            : "That didn't save. Try again in a moment.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function unlink(target: LinkSummary) {
    setBusy(`unlink:${target.id}`);
    setNote(null);
    try {
      const { error } = await supabaseBrowser().rpc("unlink_lms_course", { p_link_id: target.id });
      if (error) throw new Error(error.message);
      setUnlinking(null);
      setNote(`${target.courseName} is unlinked. Its classwork has left the Pot.`);
      router.refresh();
    } catch {
      setNote("That didn't save. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  if (!offered && links.length === 0) return null;

  return (
    <Card id="classwork">
      <CardSection className="space-y-4">
        <div className="space-y-1.5">
          <Eyebrow>Classwork</Eyebrow>
          <p className="text-sm text-ink-muted leading-relaxed">
            {canManage
              ? "Bring a course's assignments, due dates and materials into this Pot for everyone in it. MeltingPot only reads; nothing goes back."
              : "Courses a maintainer linked to this Pot. Their assignments, due dates and materials sit on the Classwork tab."}
          </p>
        </div>

        <p role="status" aria-live="polite" className={cn("text-[13px] text-ink-muted", !note && "sr-only")}>
          {note ?? ""}
        </p>

        {links.length > 0 ? (
          <ul className="space-y-2" aria-label="Linked courses">
            {links.map((item) => (
              <li
                key={item.id}
                data-testid="pot-course-link"
                className="flex flex-wrap items-center justify-between gap-2 rounded-(--radius-control) border border-edge bg-surface px-3 py-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <span className="truncate">{item.courseName}</span>
                    <StatusPill tone="neutral">{providerName(item.provider)}</StatusPill>
                  </p>
                  <p className="text-[12px] text-ink-faint">
                    Linked by {item.userId === viewerId ? "you" : item.linkerName ?? "a maintainer"}
                    {item.syncFinishedAt ? <> &middot; synced {relativeTime(item.syncFinishedAt)}</> : null}
                    {item.syncStatus === "reconnect" ? <> &middot; needs reconnecting</> : null}
                    {item.syncStatus === "error" ? <> &middot; last sync had trouble</> : null}
                    {item.itemCount > 0 ? <> &middot; {item.itemCount} {item.itemCount === 1 ? "item" : "items"}</> : null}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <SyncNowButton linkId={item.id} />
                    <Button variant="quiet" size="sm" onClick={() => setUnlinking(item)} disabled={busy !== null}>
                      Unlink
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-muted">No course is linked yet.</p>
        )}

        {canManage ? (
          connections.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              {offered ? (
                <>
                  Connect Google Classroom or Canvas in your{" "}
                  <Link href="/me/settings#connected-classes" className="text-primary underline-offset-2 hover:underline">
                    account settings
                  </Link>{" "}
                  first, then pick a course here.
                </>
              ) : (
                "Connecting a class is not set up on this site yet."
              )}
            </p>
          ) : choices.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              Every course your connected accounts can see is already linked. Refresh the list in account
              settings if one is missing.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span id="classwork-course-label" className="sr-only">
                Course to link
              </span>
              <Select
                value={choice}
                options={[{ value: NONE, label: "Choose a course" }, ...choices.map((c) => ({ value: c.value, label: c.label }))]}
                onChange={setChoice}
                labelledBy="classwork-course-label"
                size="sm"
                align="start"
                className="min-w-56"
              />
              <Button size="sm" onClick={link} disabled={choice === NONE || busy !== null}>
                Link to this Pot
              </Button>
            </div>
          )
        ) : null}
      </CardSection>

      <ConfirmDialog
        open={unlinking !== null}
        title={unlinking ? `Unlink ${unlinking.courseName}?` : ""}
        confirmLabel="Unlink"
        cancelLabel="Keep it linked"
        busy={busy?.startsWith("unlink:") ?? false}
        onConfirm={() => unlinking && unlink(unlinking)}
        onCancel={() => setUnlinking(null)}
      >
        Its classwork leaves this Pot for everyone. Notes anyone started from it stay exactly where they
        are.
      </ConfirmDialog>
    </Card>
  );
}
