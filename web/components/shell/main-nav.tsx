"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarBlank,
  CaretDoubleLeft,
  CaretRight,
  CookingPot,
  GraduationCap,
  House,
  MagnifyingGlass,
  Notebook,
  Star,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { applyNavCollapsed, readNavCollapsed, subscribeToNav } from "@/lib/nav-collapse";
import { collapsedPotDestination } from "@/lib/pot-destination";
import { resolveNavLinks, type NavKey, type SidebarPreferences } from "@/lib/sidebar-links";
import { supabaseBrowser } from "@/lib/supabase/client";

export type NavPot = {
  id: string;
  title: string;
  position: number | null;
  favoritedAt: string | null;
  lastViewedAt: string | null;
};

/**
 * The My Pots list, remembered across sidebars.
 *
 * The Pot shell and the account shell each mount their own MainNav, so
 * leaving a Pot for Contributions replaces the whole nav. Left to useState
 * the new nav would render the list already closed: a cut, where every other
 * close is a slide. So the last state lives here, outside any one instance,
 * and a route change that crosses the Pot boundary slides the list a frame
 * after the new nav has painted the old state.
 */
let lastPotsOpen: boolean | null = null;
let lastInAPot: boolean | null = null;

function Row({
  href,
  label,
  icon,
  active,
  chord,
  fx,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  chord?: string;
  /** The icon's hover micro-move, an mp-fx-* class from globals.css. */
  fx?: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/row mp-fx mp-nav-row flex items-center gap-2 h-9 px-3 rounded-(--radius-control) text-sm transition-colors min-w-0",
        active
          ? "bg-primary-soft text-primary font-medium"
          : "text-ink-muted hover:text-ink hover:bg-sunken",
      )}
    >
      <span aria-hidden className={cn("[&>svg]:size-[18px] shrink-0 me-0.5", fx)}>
        {icon}
      </span>
      <span className="mp-nav-label truncate">{label}</span>
      {chord ? (
        <>
          <kbd
            aria-hidden
            className="mp-kbd mp-nav-open-only ml-auto shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 font-sans text-[11px] text-ink-muted opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
          >
            {chord}
          </kbd>
          <span className="sr-only">, shortcut {chord}</span>
        </>
      ) : null}
    </Link>
  );
}

/**
 * One nav for the whole product.
 *
 * It is account level throughout: nothing here is scoped to a single Pot, so
 * the sidebar never changes shape underneath you. A Pot's own surfaces, its
 * feed, members, admin and settings, live inside the Pot where they belong.
 *
 * My Pots is the one exception, and it expands rather than navigating, so
 * getting to a class costs one click from anywhere without the nav becoming a
 * different nav once you are in one.
 *
 * Settings is not here at all. Personal settings belongs to the person, so it
 * lives in the profile card at the foot of the sidebar with their name and
 * avatar, and a Pot's settings belong to that Pot, so they live on it.
 */
/**
 * The modifier this device actually uses. Apple keyboards put Command where
 * everyone else puts Control, and showing the wrong glyph is worse than
 * showing none: it teaches a shortcut that does not work.
 *
 * Resolved after mount so the server and the first client render agree, then
 * corrected. userAgentData is the supported route; the platform string is the
 * fallback for browsers that do not ship it.
 */
const NO_CHANGE = () => () => {};

function isMacPlatform() {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function useShortcutModifier() {
  // useSyncExternalStore rather than an effect: the platform never changes,
  // and this is the same shape the theme picker uses to read a client-only
  // value without writing state during render or from an effect. The server
  // snapshot is false, so the markup matches and the glyph corrects on
  // hydration.
  const mac = useSyncExternalStore(NO_CHANGE, isMacPlatform, () => false);
  return { mac, symbol: mac ? "\u2318" : "Ctrl" };
}

/**
 * Bare key destinations.
 *
 * Home and Study take their own initials. Calendar takes C because a calendar
 * is C everywhere a calendar has a shortcut, which left Contributions needing
 * a letter of its own: N, for the notes it actually lists. Naming it after
 * what the page contains beats naming it after the word on the tab.
 *
 * Slash for search is the one convention nobody has to be taught.
 */
const DESTINATION_KEYS: Record<string, string> = {
  h: "/home",
  s: "/study",
  c: "/calendar",
  n: "/me/contributions",
  "/": "/search",
};

/**
 * The collapse control, under the wordmark and above the search field, the
 * way kolejain.com places it. One click narrows the sidebar to its icons
 * over a second on a long ease out; the labels are clipped by the narrowing
 * edge rather than faded, and the chevrons turn to point the way back.
 */
function CollapseToggle() {
  const collapsed = useSyncExternalStore(subscribeToNav, readNavCollapsed, () => false);
  return (
    <button
      type="button"
      onClick={() => applyNavCollapsed(!collapsed)}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="mp-nav-row mb-2 hidden h-9 items-center gap-2 rounded-(--radius-control) px-3 text-[13px] text-ink-faint transition-colors hover:bg-sunken hover:text-ink-muted lg:flex"
    >
      {/* Same box as a nav row's icon, so the chevrons sit exactly where the
          house and the pot sit below them. */}
      <span aria-hidden className="me-0.5 shrink-0 [&>svg]:size-[18px]">
        <CaretDoubleLeft className={cn("mp-nav-chevrons", collapsed && "rotate-180")} />
      </span>
      <span className="mp-nav-label">Collapse</span>
      <span className="sr-only">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
    </button>
  );
}

export function MainNav({
  userId,
  pots,
  preferences,
}: {
  /** The signed-in person, for the rows only they can write. */
  userId: string;
  pots: NavPot[];
  preferences: SidebarPreferences;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { mac, symbol } = useShortcutModifier();
  const inAPot = pathname.startsWith("/p/");
  // Optimistic, so the star fills under the pointer instead of after a round
  // trip. The override is stored with the pots it was made against and is
  // read only while those are still the pots on screen: the write ends in
  // router.refresh(), the server sends new pots, and from then on the server
  // is the source of truth again. Without that check the first toggle on a
  // class would have overruled the server for the life of the page.
  const [override, setOverride] = useState<{
    pots: NavPot[];
    favoritedAt: Record<string, string | null>;
  }>({ pots, favoritedAt: {} });
  const overrides = useMemo(
    () => (override.pots === pots ? override.favoritedAt : {}),
    [override, pots],
  );
  const effectivePots = pots.map((pot) =>
    pot.id in overrides ? { ...pot, favoritedAt: overrides[pot.id] } : pot,
  );
  const isMarked = useCallback(
    (pot: NavPot) => Boolean(pot.id in overrides ? overrides[pot.id] : pot.favoritedAt),
    [overrides],
  );
  const listId = useId();
  const navRef = useRef<HTMLElement>(null);

  const links = resolveNavLinks(preferences).filter((link) => !link.hidden);
  // From the same view of the world the stars show, so marking a class moves
  // the collapsed destination at once rather than after the refresh.
  const destination = collapsedPotDestination(effectivePots);
  const potsHref = destination ? `/p/${destination}` : "/home";
  const destinationPot = destination ? (pots.find((p) => p.id === destination) ?? null) : null;
  // Collapsed, the icon is the only thing on the row, so the name of the class
  // it opens has to live in the label. Naming it also answers the question the
  // control otherwise raises, which is why this one and not another.
  const potsLabel = destinationPot ? `My Pots, opens ${destinationPot.title}` : "My Pots";

  const toggleFavorite = useCallback(
    async (pot: NavPot) => {
      const was = pot.id in overrides ? overrides[pot.id] : pot.favoritedAt;
      const next = was ? null : new Date().toISOString();
      const set = (value: string | null) =>
        setOverride((o) => ({
          pots,
          favoritedAt: { ...(o.pots === pots ? o.favoritedAt : {}), [pot.id]: value },
        }));
      set(next);
      const { error } = await supabaseBrowser().from("pot_preferences").upsert(
        { user_id: userId, pot_id: pot.id, favorited_at: next },
        { onConflict: "user_id,pot_id" },
      );
      // Put the star back if the write did not land, rather than showing a
      // preference that was never saved.
      if (error) set(was ?? null);
      else router.refresh();
    },
    [overrides, pots, router, userId],
  );
  // Open by default when you are already inside a Pot, so the sidebar shows
  // where you are rather than hiding it behind a closed group.
  const [open, setOpen] = useState(() => lastPotsOpen ?? inAPot);

  useEffect(() => {
    lastPotsOpen = open;
  }, [open]);

  useEffect(() => {
    const was = lastInAPot;
    lastInAPot = inAPot;
    if (was === null || was === inAPot) return;
    // Two frames, not one: the first guarantees the browser has computed the
    // list at its previous height, so the change to the next one transitions
    // instead of snapping.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setOpen(inAPot));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [inAPot]);

  useEffect(() => {
    /** True while the keystroke belongs to someone else: a text field, a
     *  rich text surface, or a component that has claimed bare keys for
     *  itself (a flashcard run, say, where losing the session to a stray
     *  letter is the worst thing the shortcut could do). */
    function isClaimed(target: HTMLElement | null) {
      if (!target) return false;
      if (target.isContentEditable) return true;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
      // An open listbox, menu or dialog owns its keys: typing "c" to jump to
      // an option must not also jump to the Calendar.
      return Boolean(
        target.closest(
          '[data-no-shortcuts], [role="listbox"], [role="menu"], [role="dialog"], [role="combobox"], dialog',
        ),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      // Two of these are mounted at once, one in the desktop rail and one in
      // the drawer, and both used to answer, so below lg a chord navigated
      // twice. Only the one that is on screen acts; a nav inside a
      // display:none ancestor has no offsetParent.
      if (navRef.current?.offsetParent === null) return;
      const target = event.target as HTMLElement | null;
      if (isClaimed(target)) return;
      if (event.altKey) return;

      // Command or Control plus 1 to 9 jumps to that class. Only the first
      // nine get one, because there is no tenth digit and a two key chord for
      // a sidebar link is a shortcut nobody reaches for.
      if (mac ? event.metaKey : event.ctrlKey) {
        if (event.shiftKey) return;
        const index = Number(event.key) - 1;
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= Math.min(pots.length, 9)
        )
          return;
        event.preventDefault();
        setOpen(true);
        router.push(`/p/${pots[index].id}`);
        return;
      }

      // Bare letters for the destinations. Deliberately bare: the moment a
      // modifier is held the keystroke belongs to the browser or the OS, and
      // Control H, Command S and friends must keep meaning what they mean.
      if (event.metaKey || event.ctrlKey) return;
      const href = DESTINATION_KEYS[event.key.toLowerCase()];
      if (!href) return;
      event.preventDefault();
      router.push(href);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mac, pots, router]);

  const potsControlClasses =
    "mp-fx mp-nav-row flex items-center gap-2.5 h-9 px-3 rounded-(--radius-control) text-sm text-ink-muted transition-colors min-w-0 hover:text-ink hover:bg-sunken";
  const potsIcon = (
    <span aria-hidden className="mp-fx-stir [&>svg]:size-[18px] shrink-0">
      <CookingPot />
    </span>
  );

  /**
   * One control, two jobs, because collapsed it cannot do the first one.
   *
   * Open, My Pots is a disclosure: it expands the class list in place, which is
   * why it has never been a destination. Collapsed, the list it discloses is
   * display:none, so the control was a button that visibly did nothing. The
   * owner's report was exactly that: "I can't click the pot."
   *
   * Both controls are always rendered and the stylesheet shows one, using the
   * same html[data-nav] switch that hides the list. That is deliberate, and it
   * replaced a version that chose the element in React from the stored
   * collapse flag. Choosing in React was wrong three ways: the server HTML
   * always shipped the button, so the first click on a collapsed rail before
   * hydration did nothing; the mobile drawer renders this nav outside .mp-side,
   * so a phone whose owner had collapsed the desktop rail got a link beside a
   * fully visible list it could no longer close; and a storage event from a
   * second tab swapped the control while this tab's rail was still open. With
   * the stylesheet deciding, the control and the list can never disagree,
   * nothing is remounted, and the link can be opened in a new tab like every
   * other class in the rail.
   */
  const potsControl = (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        // Never highlighted. It is a disclosure, not a destination: the only
        // thing that should look selected is the page you are actually on, and
        // when you are inside a class it is that class in the list below.
        title="My Pots"
        className={cn(potsControlClasses, "mp-nav-open-only")}
      >
        {potsIcon}
        <span className="mp-nav-label truncate">My Pots</span>
        <CaretRight
          aria-hidden
          className={cn(
            "ml-auto size-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>
      <Link
        href={potsHref}
        title={potsLabel}
        aria-label={potsLabel}
        className={cn(potsControlClasses, "mp-nav-collapsed-only")}
      >
        {potsIcon}
        <span className="mp-nav-label truncate">My Pots</span>
      </Link>
    </>
  );

  const potsSection = (
    <Fragment key="pots">
      {potsControl}
      {/* Grid rows animate to content height without a measured pixel value,
          which keeps the expand smooth whatever the class list holds. The
          global reduced-motion rule removes the transition. */}
      <div
        id={listId}
        className={cn(
          "mp-nav-open-only grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pl-4 pt-1">
            {pots.length === 0 ? (
              <Link
                href="/home"
                className="block px-3 py-1.5 text-[12px] text-ink-faint transition-colors hover:text-ink"
              >
                No classes yet. Join one from Home.
              </Link>
            ) : (
              pots.map((pot, i) => {
                const here = pathname.startsWith(`/p/${pot.id}`);
                const favorite = isMarked(pot);
                return (
                  // The star is a sibling of the link rather than inside it: a
                  // button nested in an anchor is invalid, and a class you can
                  // only reach by missing the star is worse than either.
                  <div key={pot.id} className="group/pot flex items-center gap-1 min-w-0">
                    <Link
                      href={`/p/${pot.id}`}
                      aria-current={here ? "page" : undefined}
                      className={cn(
                        "flex h-9 flex-1 items-center gap-2 rounded-(--radius-control) px-3 text-[13px] transition-colors min-w-0",
                        here
                          ? "bg-primary-soft text-primary font-medium"
                          : "text-ink-muted hover:text-ink hover:bg-sunken",
                      )}
                    >
                      <span className="truncate">{pot.title}</span>
                      {i < 9 ? (
                        <>
                          {/* Outlined as glass: see .mp-kbd. Smaller than the
                              class name on purpose, because the outline already
                              gives it enough presence and matching the name would
                              make an annotation look like a second label.

                              Quiet until you are on the row. A column of chords
                              beside every class is noise for the reader who never
                              uses them, and the person who does only needs
                              reminding once. Focus reveals it too, so it is not
                              hidden from a keyboard. */}
                          <kbd
                            aria-hidden
                            className="mp-kbd ml-auto shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 font-sans text-[11px] tabular-nums text-ink-muted opacity-0 transition-opacity duration-150 group-hover/pot:opacity-100 group-focus-within/pot:opacity-100"
                          >
                            {symbol} + {i + 1}
                          </kbd>
                          <span className="sr-only">
                            , shortcut {mac ? "Command" : "Control"} {i + 1}
                          </span>
                        </>
                      ) : null}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(pot)}
                      // One name and a state, the way a toggle is meant to be
                      // read: "Favorite Biology, pressed". An action phrase
                      // that inverted with the state contradicted it.
                      aria-pressed={favorite}
                      aria-label={`Favorite ${pot.title}`}
                      className={cn(
                        "mp-nav-open-only inline-flex size-6 shrink-0 items-center justify-center rounded-(--radius-control) transition-all duration-150",
                        // A marked class shows its star always, because the mark
                        // is the point. An unmarked one waits until you are on
                        // the row, so the list is a list of classes rather than
                        // a column of empty stars. A finger cannot hover, so on
                        // a coarse pointer it is always there, quietly.
                        favorite
                          ? "text-primary opacity-100"
                          : "text-ink-faint opacity-0 hover:text-ink group-hover/pot:opacity-100 group-focus-within/pot:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-60",
                      )}
                    >
                      <Star aria-hidden weight={favorite ? "fill" : "regular"} className="size-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );

  const rendered: Record<NavKey, React.ReactNode> = {
    home: (
      <Row
        key="home"
        href="/home"
        label="Home"
        icon={<House />}
        active={pathname === "/home"}
        chord="H"
        fx="mp-fx-hop"
      />
    ),
    pots: potsSection,
    study: (
      <Row
        key="study"
        href="/study"
        label="Study"
        icon={<GraduationCap />}
        active={pathname.startsWith("/study")}
        chord="S"
        fx="mp-fx-doff"
      />
    ),
    calendar: (
      <Row
        key="calendar"
        href="/calendar"
        label="Calendar"
        icon={<CalendarBlank />}
        active={pathname.startsWith("/calendar")}
        chord="C"
        fx="mp-fx-flick"
      />
    ),
    contributions: (
      <Row
        key="contributions"
        href="/me/contributions"
        label="Contributions"
        icon={<Notebook />}
        active={pathname.startsWith("/me/contributions")}
        chord="N"
        fx="mp-fx-jot"
      />
    ),
  };

  return (
    <nav ref={navRef} aria-label="Main" className="flex flex-col gap-0.5 p-3">
      <CollapseToggle />
      <Link
        href="/search"
        title="Search"
        className="group/search mp-fx mp-nav-row mb-4 flex h-9 items-center gap-2 rounded-(--radius-control) border border-edge bg-sunken px-3 text-sm text-ink-faint transition-colors hover:border-edge-strong hover:text-ink-muted"
      >
        <span aria-hidden className="mp-fx-scan shrink-0 [&>svg]:size-[18px]">
          <MagnifyingGlass />
        </span>
        <span className="mp-nav-label truncate">Search</span>
        <kbd
          aria-hidden
          className="mp-kbd mp-nav-open-only ml-auto shrink-0 rounded-md px-1.5 py-0.5 font-sans text-[11px] text-ink-muted opacity-0 transition-opacity duration-150 group-hover/search:opacity-100"
        >
          /
        </kbd>
        <span className="sr-only">, shortcut slash</span>
      </Link>

      {links.map((link) => rendered[link.key])}
    </nav>
  );
}
