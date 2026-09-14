import Link from "next/link";
import { Suspense } from "react";
import { Archive, Plus } from "@phosphor-icons/react/dist/ssr";
import { ActivityList } from "@/components/home/activity-list";
import {
  DraftsModule,
  ReviewQueueModule,
  RevisionRequestedModule,
} from "@/components/home/attention-modules";
import { ContributionRecord } from "@/components/home/contribution-record";
import { DueSoonModule, ReconnectNotices } from "@/components/home/due-soon";
import { HomeJoinCard } from "@/components/home/home-join-card";
import { PotStatCard } from "@/components/home/pot-stat-card";
import { ClassworkAutoSync } from "@/components/classwork/auto-sync";
import { UserShell } from "@/components/shell/user-shell";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CLOSED_POT_MESSAGE, INVALID_CODE_MESSAGE } from "@/lib/join-messages";
import {
  classworkOffered,
  getConnections,
  getDueSoon,
  getVisibleLinks,
  staleLinkIds,
} from "@/lib/data/classwork";
import { getDashboard } from "@/lib/data/dashboard";
import { readerZone } from "@/lib/data/streak";
import { requireUser } from "@/lib/data/user";

export const metadata = { title: "Home" };

function greeting(name: string, zone: string) {
  // The server's clock is not the reader's: the hour is read in their zone,
  // the same one the record cuts its days in.
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: zone }).format(new Date()),
  );
  const part = hour < 5 ? "Evening" : hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return `${part}, ${name.split(" ")[0]}`;
}

export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const user = await requireUser();
  const params = await searchParams;
  // A dead invite link followed while signed in lands here with the failed
  // code, so the error is shown instead of silently swallowed.
  const joinCode = typeof params.code === "string" ? params.code : "";
  const joinError =
    params.error === "notfound"
      ? INVALID_CODE_MESSAGE
      : params.error === "closed"
        ? CLOSED_POT_MESSAGE
        : params.error === "busy"
          ? "Too many tries from this network. Wait a few minutes and try again."
          : params.error === "error"
            ? "We couldn't reach that Pot just now. Try again in a moment."
            : null;
  // Classwork reads only run on a site where a provider can be connected;
  // everywhere else Home costs exactly what it did before.
  const offered = classworkOffered();
  const zone = await readerZone();
  const now = new Date().getTime();
  const [dashboard, dueSoon, connections, links] = await Promise.all([
    getDashboard(user.id),
    offered ? getDueSoon(zone, 7, 5, now) : Promise.resolve([]),
    offered ? getConnections() : Promise.resolve([]),
    offered ? getVisibleLinks() : Promise.resolve([]),
  ]);
  const lapsed = connections.some((c) => c.needsReconnectAt);
  const hasAttention =
    dashboard.reviewQueue.length > 0 ||
    dashboard.revisionRequested.length > 0 ||
    dashboard.drafts.length > 0 ||
    dueSoon.length > 0 ||
    lapsed;

  const archivedGroup =
    dashboard.archivedPots.length > 0 ? (
      <details>
        <summary className="cursor-pointer text-[13px] text-ink-muted hover:text-ink transition-colors">
          Archived Pots ({dashboard.archivedPots.length})
        </summary>
        <div className="mt-3 space-y-2">
          {dashboard.archivedPots.map((pot) => (
            <Link
              key={pot.id}
              href={pot.role === "owner" ? `/p/${pot.id}/settings` : `/p/${pot.id}`}
              className="block group"
            >
              <Card className="group-hover:border-edge-strong transition-colors">
                <CardSection className="flex items-center gap-3 py-3.5">
                  <Archive className="size-4 text-ink-faint shrink-0" aria-hidden />
                  <p className="min-w-0 flex-1 text-sm text-ink truncate">{pot.title}</p>
                  <span className="text-[12px] text-ink-faint shrink-0">
                    {pot.role === "owner" ? "Open settings to unarchive" : "Still readable"}
                  </span>
                </CardSection>
              </Card>
            </Link>
          ))}
          <Link
            href="/pots"
            className="inline-block pt-1 text-[12px] text-ink-muted hover:text-ink transition-colors"
          >
            Manage every Pot
          </Link>
        </div>
      </details>
    ) : null;

  return (
    <UserShell>
      {offered ? <ClassworkAutoSync linkIds={staleLinkIds(links, now)} /> : null}
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting(user.displayName, zone)}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {dashboard.reviewQueue.length > 0
                ? `${dashboard.reviewQueue.length} ${
                    dashboard.reviewQueue.length === 1 ? "correction is" : "corrections are"
                  } waiting on you.`
                : "Pick up where your class left off."}
            </p>
          </div>
          {dashboard.isMaintainerAnywhere || dashboard.pots.length === 0 ? (
            <Button href="/pots/new" variant="secondary">
              <Plus className="size-4" />
              Create a Pot
            </Button>
          ) : null}
        </header>

        {dashboard.pots.length === 0 ? (
          <div className="space-y-6">
            <ReconnectNotices connections={connections} />
            <Card>
              <EmptyState
                title="Join your first Pot"
                body="Enter a class code to see what your class is building."
              />
              <div className="px-6 pb-8 max-w-sm mx-auto">
                <HomeJoinCard initialCode={joinCode} initialError={joinError} />
              </div>
            </Card>
            {/* A course can be in a person's calendar before they have a class here. */}
            <DueSoonModule items={dueSoon} now={now} zone={zone} />
            {/* A user whose only Pot is archived still needs a path to it. */}
            {archivedGroup}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
            <div className="space-y-6 min-w-0">
              {hasAttention ? (
                <section aria-label="Needs your attention" className="space-y-4">
                  <ReconnectNotices connections={connections} />
                  <DueSoonModule items={dueSoon} now={now} zone={zone} />
                  <ReviewQueueModule items={dashboard.reviewQueue} />
                  <RevisionRequestedModule items={dashboard.revisionRequested} />
                  <DraftsModule items={dashboard.drafts} />
                </section>
              ) : null}

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow>Your Pots</Eyebrow>
                  {/* One path to every Pot, archived ones included, and to the
                      archive and delete controls that otherwise sit inside each
                      Pot's own settings. */}
                  <Link
                    href="/pots"
                    className="text-[12px] text-ink-muted hover:text-ink transition-colors"
                  >
                    Manage Pots
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {dashboard.pots.map((pot) => (
                    <PotStatCard key={pot.id} pot={pot} />
                  ))}
                </div>
              </section>

              {archivedGroup}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
              {/* Students lead with joining the next class; teachers lead
                  with what their classes are doing. */}
              {dashboard.isMaintainerAnywhere ? (
                <>
                  <ActivityList
                    items={dashboard.activity}
                    contributeHref={`/p/${dashboard.pots[0].id}/contribute`}
                  />
                  <Card>
                    <CardSection className="space-y-2.5">
                      <p className="text-sm font-semibold text-ink">Have a class code?</p>
                      <HomeJoinCard initialCode={joinCode} initialError={joinError} />
                    </CardSection>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardSection className="space-y-2.5">
                      <p className="text-sm font-semibold text-ink">Have a class code?</p>
                      <HomeJoinCard initialCode={joinCode} initialError={joinError} />
                    </CardSection>
                  </Card>
                  <ActivityList
                    items={dashboard.activity}
                    contributeHref={`/p/${dashboard.pots[0].id}/contribute`}
                  />
                </>
              )}
              {/* Personal recognition sits last and streams on its own, so its
                  query never delays what needs the reader's attention. */}
              <Suspense fallback={null}>
                <ContributionRecord
                  userId={user.id}
                  contributeHref={`/p/${dashboard.pots[0].id}/contribute`}
                />
              </Suspense>
            </aside>
          </div>
        )}
      </div>
    </UserShell>
  );
}
