"use client";

import { useMemo, useState } from "react";
import { Reorder, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  DotsSixVertical,
  Eye,
  EyeSlash,
  Star,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardSection, Eyebrow } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  DEFAULT_SIDEBAR_PREFERENCES,
  resolveNavLinks,
  type NavKey,
  type SidebarPreferences,
} from "@/lib/sidebar-links";
import { supabaseBrowser } from "@/lib/supabase/client";

export type SidebarPanelPot = { id: string; title: string; favorite: boolean };

/**
 * Arranging the sidebar.
 *
 * Dragging is not the accessible half of this, it is the pleasant half. Every
 * move is also a pair of buttons, and every move announces itself through a
 * live region, so the whole panel works from the keyboard with nothing to
 * discover. The ARIA pattern is the plain one: a list of items, each with named
 * controls, and a polite status that says what just happened and where the item
 * landed. A drag handle that is the only way to reorder is a feature a keyboard
 * user does not have.
 */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowShell({
  children,
  dragging,
}: {
  children: React.ReactNode;
  dragging: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-(--radius-control) border border-edge bg-surface px-2.5 py-2 transition-colors",
        dragging && "border-edge-strong bg-sunken",
      )}
    >
      {children}
    </div>
  );
}

function MoveButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
  label,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  label: string;
}) {
  const cls =
    "inline-flex size-7 shrink-0 items-center justify-center rounded-(--radius-control) text-ink-faint transition-colors hover:bg-sunken hover:text-ink disabled:opacity-30 disabled:pointer-events-none";
  return (
    <>
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp}
        aria-label={`Move ${label} up`}
        className={cls}
      >
        <ArrowUp aria-hidden className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown}
        aria-label={`Move ${label} down`}
        className={cls}
      >
        <ArrowDown aria-hidden className="size-3.5" />
      </button>
    </>
  );
}

export function SidebarPanel({
  userId,
  initialPreferences,
  initialPots,
}: {
  userId: string;
  initialPreferences: SidebarPreferences;
  initialPots: SidebarPanelPot[];
}) {
  const initialLinks = useMemo(
    () => resolveNavLinks(initialPreferences),
    [initialPreferences],
  );
  const [order, setOrder] = useState<NavKey[]>(() => initialLinks.map((l) => l.key));
  const [hidden, setHidden] = useState<NavKey[]>(
    () => initialLinks.filter((l) => l.hidden).map((l) => l.key),
  );
  const [pots, setPots] = useState<SidebarPanelPot[]>(initialPots);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const labels = useMemo(() => {
    const map = new Map(resolveNavLinks(null).map((l) => [l.key, l.label]));
    return map;
  }, []);

  const visibleCount = order.length - hidden.length;

  function announceMove(name: string, index: number, total: number) {
    setStatus(`${name} moved to position ${index + 1} of ${total}`);
  }

  function moveLink(index: number, delta: number) {
    const next = moveItem(order, index, index + delta);
    if (next === order) return;
    setOrder(next);
    announceMove(labels.get(order[index]) ?? "Link", index + delta, next.length);
  }

  function movePot(index: number, delta: number) {
    const next = moveItem(pots, index, index + delta);
    if (next === pots) return;
    setPots(next);
    announceMove(pots[index].title, index + delta, next.length);
  }

  function toggleHidden(key: NavKey) {
    const isHidden = hidden.includes(key);
    if (!isHidden && visibleCount <= 1) {
      setStatus("At least one link has to stay in the sidebar.");
      return;
    }
    setHidden((h) => (isHidden ? h.filter((k) => k !== key) : [...h, key]));
    setStatus(`${labels.get(key) ?? "Link"} ${isHidden ? "shown" : "hidden"}`);
  }

  function reset() {
    setOrder([...DEFAULT_SIDEBAR_PREFERENCES.navOrder]);
    setHidden([]);
    setPots(initialPots);
    setStatus("Sidebar reset to the default arrangement. Save to keep it.");
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: prefError } = await supabase.from("sidebar_preferences").upsert(
      {
        user_id: userId,
        nav_order: order,
        nav_hidden: hidden,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    // Positions are written for every class, not only the moved ones, so the
    // stored order is always the whole list rather than a sparse set that only
    // makes sense next to the join order it was built from.
    const { error: potError } = pots.length
      ? await supabase.from("pot_preferences").upsert(
          pots.map((pot, index) => ({ user_id: userId, pot_id: pot.id, position: index })),
          { onConflict: "user_id,pot_id" },
        )
      : { error: null };
    setSaving(false);
    if (prefError || potError) {
      setError("That did not save. Try again.");
      return;
    }
    setStatus("Sidebar saved");
    // A full reload rather than a router refresh: the nav is rendered by the
    // server on every route, and this is the one change that has to be visible
    // in it immediately.
    window.location.reload();
  }

  return (
    <Card>
      <CardSection className="space-y-5">
        <div className="space-y-1.5">
          <Eyebrow>Sidebar</Eyebrow>
          <p className="text-sm text-ink-muted leading-relaxed">
            What appears in the sidebar, and in what order. Drag a row or use the arrows.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-[13px] font-medium text-ink">Links</h3>
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-1.5"
          >
            {order.map((key, index) => {
              const isHidden = hidden.includes(key);
              const label = labels.get(key) ?? key;
              return (
                <Reorder.Item
                  key={key}
                  value={key}
                  dragListener={!reducedMotion}
                  transition={reducedMotion ? { duration: 0 } : undefined}
                >
                  <RowShell dragging={false}>
                    <DotsSixVertical
                      aria-hidden
                      className="size-4 shrink-0 cursor-grab text-ink-faint"
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[13px]",
                        isHidden ? "text-ink-faint line-through" : "text-ink",
                      )}
                    >
                      {label}
                    </span>
                    <MoveButtons
                      label={label}
                      onUp={() => moveLink(index, -1)}
                      onDown={() => moveLink(index, 1)}
                      disableUp={index === 0}
                      disableDown={index === order.length - 1}
                    />
                    <button
                      type="button"
                      onClick={() => toggleHidden(key)}
                      aria-pressed={isHidden}
                      aria-label={isHidden ? `Show ${label}` : `Hide ${label}`}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-(--radius-control) text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
                    >
                      {isHidden ? (
                        <EyeSlash aria-hidden className="size-3.5" />
                      ) : (
                        <Eye aria-hidden className="size-3.5" />
                      )}
                    </button>
                  </RowShell>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          <p className="text-[13px] text-ink-muted">
            A hidden link keeps its keyboard shortcut and its page. Search stays where it is.
          </p>
        </div>

        {pots.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-ink">Your classes</h3>
            <Reorder.Group axis="y" values={pots} onReorder={setPots} className="space-y-1.5">
              {pots.map((pot, index) => (
                <Reorder.Item
                  key={pot.id}
                  value={pot}
                  dragListener={!reducedMotion}
                  transition={reducedMotion ? { duration: 0 } : undefined}
                >
                  <RowShell dragging={false}>
                    <DotsSixVertical
                      aria-hidden
                      className="size-4 shrink-0 cursor-grab text-ink-faint"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {pot.title}
                    </span>
                    {pot.favorite ? (
                      <>
                        <Star aria-hidden weight="fill" className="size-3.5 shrink-0 text-primary" />
                        <span className="sr-only">, a favorite</span>
                      </>
                    ) : null}
                    <MoveButtons
                      label={pot.title}
                      onUp={() => movePot(index, -1)}
                      onDown={() => movePot(index, 1)}
                      disableUp={index === 0}
                      disableDown={index === pots.length - 1}
                    />
                  </RowShell>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <p className="text-[13px] text-ink-muted">
              The class at the top is the one the pot icon opens while the sidebar is collapsed.
            </p>
          </div>
        ) : null}

        {/* Every move is announced here, so the arrows are not a silent control
            for anyone who cannot see the list settle. */}
        <p aria-live="polite" className="sr-only">
          {status}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving" : "Save sidebar"}
          </Button>
          <Button size="sm" variant="secondary" onClick={reset} disabled={saving}>
            Reset to default
          </Button>
          {error ? <span className="text-[13px] text-danger">{error}</span> : null}
        </div>
      </CardSection>
    </Card>
  );
}
