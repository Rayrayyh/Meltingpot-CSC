import Link from "next/link";
import { ArrowSquareOut, LinkSimple, NotePencil, Warning } from "@phosphor-icons/react/dist/ssr";
import { SyncNowButton } from "@/components/classwork/sync-now-button";
import { Button } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { StatusPill } from "@/components/ui/pills";
import { dueBucket, dueLabel, kindLabel, providerName, type DueBucket } from "@/lib/classwork/labels";
import type { LinkSummary, PotClassworkItem } from "@/lib/data/classwork";
import { relativeTime } from "@/lib/time";

/**
 * What a Pot's linked courses published, read-only, with one action: write a
 * note about it. No grades, no submissions, no "Turn in". Grouped by when it
 * is due, because that is the question a student opens this with.
 */
const GROUPS: Array<{ key: DueBucket; title: string }> = [
  { key: "soon", title: "Due soon" },
  { key: "later", title: "Later" },
  { key: "undated", title: "No date" },
  { key: "past", title: "Past" },
];

const MATERIALS_SHOWN = 6;

export function ClassworkList({
  potId,
  items,
  links,
  canSync,
  viewerId,
  now,
  zone,
}: {
  potId: string;
  items: PotClassworkItem[];
  links: LinkSummary[];
  /** Maintainers and the linker may force a pass. */
  canSync: boolean;
  viewerId: string;
  now: number;
  zone: string;
}) {
  const grouped = new Map<DueBucket, PotClassworkItem[]>();
  for (const item of items) {
    const bucket = dueBucket(item.dueAt, now, zone);
    grouped.set(bucket, [...(grouped.get(bucket) ?? []), item]);
  }
  // Past runs newest first; the rest keep their soonest-first order.
  grouped.set("past", [...(grouped.get("past") ?? [])].reverse());
  const catchingUp = links.some((l) => l.syncStatus === "never" || l.syncStatus === "running");
  const manyCourses = links.length > 1;

  return (
    <div className="space-y-6">
      <ul className="space-y-2" aria-label="Linked courses">
        {links.map((link) => (
          <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-muted">
            <span>
              From {providerName(link.provider)}
              {manyCourses ? <>, {link.courseName}</> : null}
              {link.linkerName ? <>, linked by {link.linkerName}</> : null}.
              {link.syncFinishedAt ? <> Last synced {relativeTime(link.syncFinishedAt)}.</> : null}
              {link.syncStatus === "error" && link.syncError ? <> {link.syncError}</> : null}
            </span>
            {canSync || link.userId === viewerId ? <SyncNowButton linkId={link.id} /> : null}
          </li>
        ))}
      </ul>

      {links
        .filter((link) => link.syncStatus === "reconnect")
        .map((link) => (
          <NoticeBanner
            key={link.id}
            tone="warning"
            icon={<Warning weight="fill" />}
            action={
              link.userId === viewerId ? (
                <Button href="/me/settings#connected-classes" size="sm">
                  Reconnect
                </Button>
              ) : undefined
            }
          >
            {providerName(link.provider)} needs reconnecting
            {link.userId === viewerId
              ? ". Reconnect it from your account settings."
              : link.linkerName
                ? `. ${link.linkerName} can reconnect it from account settings.`
                : "."}{" "}
            The classwork below is as it was at the last sync.
          </NoticeBanner>
        ))}

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title={catchingUp ? "Still catching up on this course" : "Nothing published yet"}
            body={
              catchingUp
                ? "The first sync is running. Open this again in a moment."
                : "When the course publishes an assignment, an announcement or a material, it shows up here."
            }
          />
        </Card>
      ) : (
        GROUPS.map(({ key, title }) => {
          const group = grouped.get(key) ?? [];
          if (group.length === 0) return null;
          return (
            <section key={key} aria-labelledby={`classwork-${key}`} className="space-y-2">
              <h2 id={`classwork-${key}`} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                {title}
              </h2>
              <ul className="space-y-2">
                {group.map((item) => (
                  <li key={item.id} data-testid="classwork-item">
                    <ItemRow item={item} potId={potId} now={now} zone={zone} showCourse={manyCourses} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function ItemRow({
  item,
  potId,
  now,
  zone,
  showCourse,
}: {
  item: PotClassworkItem;
  potId: string;
  now: number;
  zone: string;
  showCourse: boolean;
}) {
  const due = dueLabel(item.dueAt, item.dueAllDay, now, zone);
  const materials = item.materials.slice(0, MATERIALS_SHOWN);
  const more = item.materials.length - materials.length;
  return (
    <Card>
      <CardSection className="space-y-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="neutral">{kindLabel(item.kind)}</StatusPill>
              {showCourse ? <span className="text-[12px] text-ink-faint">{item.courseName}</span> : null}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
            {item.description ? (
              <p className="line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{item.description}</p>
            ) : null}
          </div>
          {due ? <span className="shrink-0 text-[12px] font-medium tabular-nums text-ink-muted">{due}</span> : null}
        </div>

        {materials.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Materials">
            {materials.map((material) => (
              <li key={material.url}>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-edge bg-surface px-2.5 py-1 text-[12px] text-ink-muted transition-colors hover:border-edge-strong hover:text-ink"
                >
                  <LinkSimple className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{material.title}</span>
                </a>
              </li>
            ))}
            {more > 0 ? <li className="self-center text-[12px] text-ink-faint">and {more} more</li> : null}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button href={`/p/${potId}/contribute?from=${item.id}`} size="sm">
            <NotePencil className="size-3.5" aria-hidden />
            Start a note from this
          </Button>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[13px] text-ink-muted transition-colors hover:text-ink"
            >
              Open in {providerName(item.provider)}
              <ArrowSquareOut className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {item.notesStarted > 0 ? (
            <Link href={`/p/${potId}`} className="text-[13px] text-ink-muted transition-colors hover:text-ink">
              {item.notesStarted} {item.notesStarted === 1 ? "note" : "notes"} started from this
            </Link>
          ) : null}
        </div>
      </CardSection>
    </Card>
  );
}
