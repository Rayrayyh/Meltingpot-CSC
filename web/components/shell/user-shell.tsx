import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { MainNav } from "@/components/shell/main-nav";
import { getUserPots, requireUser } from "@/lib/data/user";
import { getNotifications } from "@/lib/data/notifications";
import { getSidebarPreferences } from "@/lib/data/sidebar";
import { avatarSrc } from "@/lib/avatar-url";
import { navPots } from "@/components/shell/nav-pots";

/** Signed-in shell: top bar plus the one nav the whole product shares. */
export async function UserShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [pots, notifications, preferences] = await Promise.all([
    getUserPots(),
    getNotifications(user.id),
    getSidebarPreferences(),
  ]);
  return (
    <AppShell
      displayName={user.displayName}
      avatarSrc={avatarSrc(user.avatarPath)}
      email={user.email}
      nav={<MainNav userId={user.id} pots={navPots(pots)} preferences={preferences} />}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
