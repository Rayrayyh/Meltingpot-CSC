import Link from "next/link";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { dueLabel, kindLabel } from "@/lib/classwork/labels";
import type { DueEntry } from "@/lib/data/classwork";

/**
 * Three rows under the Pot's vitals: what the linked course wants next. The
 * whole list, and the way to write about any of it, is one tab over.
 */
export function ClassworkStrip({
  potId,
  items,
  now,
  zone,
}: {
  potId: string;
  items: DueEntry[];
  now: number;
  zone: string;
}) {
  return (
    <Card data-testid="classwork-strip">
      <CardSection className="space-y-2.5 py-4">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Classwork</Eyebrow>
          <Link
            href={`/p/${potId}/classwork`}
            className="text-[12px] text-ink-muted transition-colors hover:text-ink"
          >
            See all classwork
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Nothing due in the next two weeks.</p>
        ) : (
          <ul className="divide-y divide-edge">
            {items.map((item) => (
              <li key={item.itemId} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{item.title}</p>
                  <p className="text-[12px] text-ink-faint">
                    {kindLabel(item.itemKind)} &middot; {item.courseName}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-ink-muted">
                  {dueLabel(item.dueAt, item.dueAllDay, now, zone)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardSection>
    </Card>
  );
}
