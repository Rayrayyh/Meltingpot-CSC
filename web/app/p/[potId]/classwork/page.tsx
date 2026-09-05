import { notFound } from "next/navigation";
import { ClassworkList } from "@/components/pot/classwork-list";
import { PotShell } from "@/components/shell/pot-shell";
import { getPotClasswork, getVisibleLinks } from "@/lib/data/classwork";
import { readerZone } from "@/lib/data/streak";
import { requireUser } from "@/lib/data/user";

export const metadata = { title: "Classwork" };

/**
 * The Classwork tab: everything the Pot's linked courses publish, and one
 * way to act on it, which is the composer. A Pot with no link has no tab and
 * this page is not found, so a stale link cannot show an empty room.
 */
export default async function ClassworkPage({ params }: PageProps<"/p/[potId]/classwork">) {
  const { potId } = await params;
  const user = await requireUser();
  const zone = await readerZone();
  const now = new Date().getTime();
  const [links, items] = await Promise.all([getVisibleLinks({ potId }), getPotClasswork(potId)]);
  if (links.length === 0) notFound();

  return (
    <PotShell potId={potId}>
      {(pot) => (
        <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Classwork</h1>
            <p className="text-sm text-ink-muted">
              What {pot.title}&apos;s linked {links.length === 1 ? "course publishes" : "courses publish"}. Read
              it here, write about it in a note.
            </p>
          </header>
          <ClassworkList
            potId={pot.id}
            items={items}
            links={links}
            canSync={pot.role !== "member"}
            viewerId={user.id}
            now={now}
            zone={zone}
          />
        </div>
      )}
    </PotShell>
  );
}
