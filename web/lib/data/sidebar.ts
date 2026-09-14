import { getAuthUser } from "@/lib/auth/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  DEFAULT_SIDEBAR_PREFERENCES,
  NAV_KEYS,
  type NavKey,
  type SidebarPreferences,
} from "@/lib/sidebar-links";

function toKeys(values: string[] | null | undefined): NavKey[] {
  return (values ?? []).filter((v): v is NavKey => (NAV_KEYS as readonly string[]).includes(v));
}

/**
 * The person's sidebar arrangement, read on the server.
 *
 * It has to be read here rather than in the browser. The nav is rendered by the
 * server on every navigation, so a preference held only on the client would
 * paint the default order first and correct it after hydration, which is the
 * flash the theme picker had to solve with a script in the document head
 * (memory/decisions/020). A destination that jumps a row after load is worse
 * than one that never moved.
 *
 * A row that does not exist yet is not an error. Nobody has a row until the
 * first time they change something.
 */
export async function getSidebarPreferences(): Promise<SidebarPreferences> {
  const user = await getAuthUser();
  if (!user) return DEFAULT_SIDEBAR_PREFERENCES;
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("sidebar_preferences")
    .select("nav_order, nav_hidden")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return DEFAULT_SIDEBAR_PREFERENCES;
  return { navOrder: toKeys(data.nav_order), navHidden: toKeys(data.nav_hidden) };
}
