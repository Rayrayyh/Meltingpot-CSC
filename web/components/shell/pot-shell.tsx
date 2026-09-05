import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PotTabs } from "@/components/shell/pot-tabs";
import { MainNav } from "@/components/shell/main-nav";
import { getPotContext, type PotContext } from "@/lib/data/pot";
import { getUserPots, requireUser } from "@/lib/data/user";
import { getNotifications } from "@/lib/data/notifications";
import { getSidebarPreferences } from "@/lib/data/sidebar";
import { avatarSrc } from "@/lib/avatar-url";
import { navPots } from "@/components/shell/nav-pots";
import { RecordPotVisit } from "@/components/shell/record-pot-visit";
import { ClassworkAutoSync } from "@/components/classwork/auto-sync";
import { classworkOffered, getVisibleLinks, staleLinkIds } from "@/lib/data/classwork";

/**
 * Signed-in shell inside a Pot. Resolves membership and passes the Pot
 * context to the page via a render prop so data loads once.
 */
export async function PotShell({
  potId,
  children,
}: {
  potId: string;
  children: (pot: PotContext) => ReactNode;
}) {
  const user = await requireUser();
  const pot = await getPotContext(potId);
  if (!pot) notFound();
  // The sidebar is account level everywhere, so a Pot page still lists every
  // class rather than swapping the nav out underneath you.
  const offered = classworkOffered();
  const [pots, notifications, preferences, links] = await Promise.all([
    getUserPots(),
    getNotifications(user.id),
    getSidebarPreferences(),
    offered ? getVisibleLinks({ potId: pot.id }) : Promise.resolve([]),
  ]);

  return (
    <AppShell
      displayName={user.displayName}
      avatarSrc={avatarSrc(user.avatarPath)}
      email={user.email}
      nav={<MainNav userId={user.id} pots={navPots(pots)} preferences={preferences} />}
      notifications={notifications}
    >
      {/* Records that this class was opened, which is what the collapsed rail
          falls back to when nobody has arranged an order or marked a class. */}
      <RecordPotVisit userId={user.id} potId={pot.id} />
      {/* Opening a class is when its linked courses catch up (decision 038). */}
      {offered ? <ClassworkAutoSync linkIds={staleLinkIds(links)} /> : null}
      <PotTabs
        potId={pot.id}
        role={pot.role}
        openReviewCount={pot.openProposalCount}
        classworkLinkCount={pot.classworkLinkCount}
      />
      {children(pot)}
    </AppShell>
  );
}
