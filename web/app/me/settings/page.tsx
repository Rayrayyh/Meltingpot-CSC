import { getVerifiedSecondFactorId } from "@/lib/auth/server";
import { UserShell } from "@/components/shell/user-shell";
import { ConnectedClassesPanel, type ClassworkNotice } from "@/components/settings/connected-classes-panel";
import { PasswordPanel } from "@/components/settings/password-panel";
import { ProfilePanel } from "@/components/settings/profile-panel";
import { SidebarPanel } from "@/components/settings/sidebar-panel";
import { ThemeChoice } from "@/components/settings/theme-choice";
import { TwoFactorPanel } from "@/components/settings/two-factor-panel";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { classworkAvailability } from "@/lib/classwork/config";
import { isClassworkProvider } from "@/lib/classwork";
import { getConnections, getOwnLinks } from "@/lib/data/classwork";
import { getUserPots, requireUser, runsAnyPot } from "@/lib/data/user";
import { getSidebarPreferences } from "@/lib/data/sidebar";

export const metadata = { title: "Settings" };

export default async function AccountSettingsPage({ searchParams }: PageProps<"/me/settings">) {
  const [user, runsAPot, pots, sidebar, params, connections, links] = await Promise.all([
    requireUser(),
    runsAnyPot(),
    getUserPots(),
    getSidebarPreferences(),
    searchParams,
    getConnections(),
    getOwnLinks(),
  ]);
  // The connect routes come back here with a one word outcome in the query.
  const classworkNotice: ClassworkNotice = {
    connected:
      typeof params.connected === "string" && isClassworkProvider(params.connected) ? params.connected : undefined,
    error: typeof params.classwork === "string" ? params.classwork : undefined,
  };

  // Read the enrolled factor here so the security panel opens in the right
  // state instead of resolving it after paint.
  const enrolledFactorId = runsAPot ? await getVerifiedSecondFactorId() : null;

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-2xl px-6 py-10 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-ink-muted">
            Your account and how MeltingPot looks while you work.
          </p>
        </header>

        <ProfilePanel
          userId={user.id}
          email={user.email}
          initialName={user.displayName}
          initialAvatarPath={user.avatarPath}
        />

        <PasswordPanel />

        <SidebarPanel
          userId={user.id}
          initialPreferences={sidebar}
          initialPots={pots.map((p) => ({
            id: p.id,
            title: p.title,
            favorite: Boolean(p.favoritedAt),
          }))}
        />

        <ConnectedClassesPanel
          availability={classworkAvailability()}
          connections={connections}
          links={links}
          notice={classworkNotice}
        />

        <Card>
          <CardSection className="space-y-4">
            <div className="space-y-1.5">
              <Eyebrow>Appearance</Eyebrow>
              <p className="text-sm text-ink-muted leading-relaxed">
                Pick a theme, or follow whatever your device is set to.
              </p>
            </div>
            <ThemeChoice />
          </CardSection>
        </Card>

        {runsAPot ? <TwoFactorPanel enrolledFactorId={enrolledFactorId} /> : null}
      </div>
    </UserShell>
  );
}
