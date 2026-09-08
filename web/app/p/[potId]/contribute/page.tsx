import { ContributeFlow, type ContributePrefill } from "@/components/contribute/contribute-flow";
import { PotShell } from "@/components/shell/pot-shell";
import { getClassworkItem } from "@/lib/data/classwork";
import { requireUser } from "@/lib/data/user";
import { parseOrNull, uuidSchema } from "@/lib/validation/inputs";

/**
 * A note from nothing, or a note from classwork: ?from=<item> reads the item
 * under row level security and hands the composer its words and its links.
 * An item the reader cannot see, or one from another Pot, opens a blank
 * composer rather than an error, since the URL came from a link that may be
 * stale.
 */
export default async function ContributePage({
  params,
  searchParams,
}: PageProps<"/p/[potId]/contribute">) {
  const { potId } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const fromId = parseOrNull(uuidSchema, typeof query.from === "string" ? query.from : null);
  const item = fromId ? await getClassworkItem(potId, fromId) : null;
  const prefill: ContributePrefill | undefined = item
    ? {
        itemId: item.id,
        // A title and a description can together pass the column's limit;
        // the composer would then fail its first save.
        rawText: [item.title, item.description].filter(Boolean).join("\n\n").slice(0, 20000),
        links: [
          ...item.materials.map((m) => ({ title: m.title, url: m.url })),
          ...(item.url ? [{ title: `${item.title} (${item.courseName})`, url: item.url }] : []),
        ],
      }
    : undefined;
  return (
    <PotShell potId={potId}>
      {(pot) => (
        <ContributeFlow
          potId={pot.id}
          potTitle={pot.title}
          sections={pot.sections}
          viewerName={user.displayName}
          prefill={prefill}
        />
      )}
    </PotShell>
  );
}
