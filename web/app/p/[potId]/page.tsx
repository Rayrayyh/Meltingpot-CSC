import { PotFeed } from "@/components/pot/feed";
import { PotShell } from "@/components/shell/pot-shell";
import { classworkOffered, getDueSoon } from "@/lib/data/classwork";
import { getFeed, getPotContext } from "@/lib/data/pot";
import { readerZone } from "@/lib/data/streak";

export default async function PotPage({ params }: PageProps<"/p/[potId]">) {
  const { potId } = await params;
  // getPotContext is memoised per request, so the shell's own call is free.
  const [notes, context] = await Promise.all([getFeed(potId), getPotContext(potId)]);
  const linked = classworkOffered() && (context?.classworkLinkCount ?? 0) > 0;
  const zone = linked ? await readerZone() : "UTC";
  const now = new Date().getTime();
  const due = linked ? await getDueSoon(zone, 14, 3, now, { potId }) : [];
  return (
    <PotShell potId={potId}>
      {(pot) => (
        <PotFeed
          pot={pot}
          notes={notes}
          classwork={linked ? { items: due, now, zone } : undefined}
        />
      )}
    </PotShell>
  );
}
