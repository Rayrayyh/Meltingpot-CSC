import Link from "next/link";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { dueLabel, kindLabel, providerName } from "@/lib/classwork/labels";
import type { ConnectionSummary, DueEntry } from "@/lib/data/classwork";

/**
 * The next week's deadlines, on Home, only when there are any. Quiet by
 * design: a class with nothing due sees nothing, and an item is never marked
 * late, since no provider tells us whether it was handed in.
 */
export function DueSoonModule({ items, now, zone }: { items: DueEntry[]; now: number; zone: string }) {
  if (items.length === 0) return null;
  return (
    <Card data-testid="due-soon">
      <CardSection className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Due soon</Eyebrow>
          <Link href="/calendar" className="text-[12px] text-ink-muted transition-colors hover:text-ink">
            Open calendar
          </Link>
        </div>
        <ul className="divide-y divide-edge">
          {items.map((item) => {
            const inner = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink group-hover:text-primary">{item.title}</p>
                  <p className="text-[12px] text-ink-faint">
                    {kindLabel(item.itemKind)} &middot; {item.courseName}
                    {item.potTitle ? <> &middot; {item.potTitle}</> : null}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-ink-muted">
                  {dueLabel(item.dueAt, item.dueAllDay, now, zone)}
                </span>
              </>
            );
            return (
              <li key={item.itemId} className="py-2.5 first:pt-0 last:pb-0">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-start justify-between gap-3"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex items-start justify-between gap-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </CardSection>
    </Card>
  );
}

/** A lapsed consent, said once, in a warning tone rather than an error. */
export function ReconnectNotices({ connections }: { connections: ConnectionSummary[] }) {
  const lapsed = connections.filter((c) => c.needsReconnectAt);
  if (lapsed.length === 0) return null;
  return (
    <>
      {lapsed.map((connection) => (
        <NoticeBanner
          key={connection.id}
          tone="warning"
          icon={<Warning weight="fill" />}
          title={`${providerName(connection.provider)} needs reconnecting`}
          action={
            <Button native href={`/api/classwork/connect/${connection.provider}?next=/home`} size="sm">
              Reconnect
            </Button>
          }
        >
          {connection.provider === "google_classroom"
            ? "Google asks for this every week while the app is in testing. Your classwork stays as it was until then."
            : "Your school's Canvas stopped accepting the connection. Your classwork stays as it was until then."}
        </NoticeBanner>
      ))}
    </>
  );
}
