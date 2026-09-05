"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, Notebook, PencilSimpleLine, X } from "@phosphor-icons/react";
import type { Notification } from "@/lib/data/notifications";

/**
 * What is waiting on you, pinned above the account control.
 *
 * It sits outside the scrolling nav on purpose: a correction addressed to you
 * should not be something you have to scroll a class list to discover. Three
 * items is the cap, because a sidebar panel that grows without limit starts
 * competing with the navigation it is sitting under.
 */

const KEY = "mp:notifications-dismissed";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Private browsing and blocked site data both throw here rather than
 *  returning null, so every read and write is guarded. */
function readDismissed() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function dismiss(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* Nothing to persist to. The panel still closes for this render. */
  }
  for (const l of listeners) l();
}

const ICONS = {
  review: PencilSimpleLine,
  decision: CheckCircle,
  note: Notebook,
} as const;

export function NavNotifications({ items }: { items: Notification[] }) {
  // Keyed on the newest item, so dismissing clears what you have seen without
  // muting the next thing that happens.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => null);

  if (items.length === 0) {
    return (
      <div className="mb-4 px-2">
        <div className="mp-nav-alerts shrink-0 overflow-hidden rounded-(--radius-card) border border-edge bg-sunken px-2.5 py-2">
          <p className="truncate text-[12px] leading-[16px] text-ink-muted">
            You are all caught up
          </p>
          {/* One line, because the card clips at its edge now rather than
              wrapping (the nowrap inside truncate is what lets it collapse
              with the rail). The sentence measures 200px in a 201px box, so
              truncate rather than bare nowrap: if a fallback font ever runs it
              a pixel long it ends in an ellipsis instead of a sheared glyph. */}
          <p className="truncate text-[11px] leading-[14px] text-ink-faint">
            Corrections and class notes land here.
          </p>
        </div>
      </div>
    );
  }

  const top = items[0].id;
  const unread = items.filter((n) => n.isNew).length;

  // Two different disappearances, deliberately not the same motion.
  //
  // Dismissing is a decision, so it gets a short drop and shrink and a rise on
  // the way back, on the sidebar's long ease out. Collapsing the rail is not a
  // decision about this card at all, so it borrows nothing from here: the
  // .mp-nav-alerts rule in globals.css fades it in a tenth of a second and lets
  // the rail's own width animation do the rest, which is how kolejain.com does
  // it. See docs/KOLEJAIN_NOTIFICATION_MOTION.md.
  return (
    <AnimatePresence initial={false}>
      {dismissed === top ? null : (
    <motion.div
      key={top}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.075, 0.82, 0.165, 1] }}
      className="mb-4 px-2"
    >
      <section
        aria-label="Notifications"
        className="mp-nav-alerts shrink-0 overflow-hidden rounded-(--radius-card) border border-edge bg-sunken p-2"
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
          {unread > 0 ? (
            <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium leading-[14px] text-primary">
              New
            </span>
          ) : (
            <span className="shrink-0 text-[11px] font-medium leading-[14px] text-ink-muted">
              Notifications
            </span>
          )}
          <button
            type="button"
            onClick={() => dismiss(top)}
            aria-label="Dismiss notifications"
            className="ml-auto -me-1 inline-flex size-5 shrink-0 items-center justify-center rounded-(--radius-control) text-ink-faint transition-colors hover:bg-surface hover:text-ink"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </div>

        <ul className="mt-1 flex flex-col">
          {items.map((n) => {
            const Icon = ICONS[n.kind];
            return (
              <li key={n.id}>
                <Link
                  href={n.href}
                  // 3px is off the spacing scale on purpose: it is the last of
                  // the twenty percent, taken from the row rather than from
                  // the type, which is already at its floor.
                  className="mp-alert-row relative flex gap-2 rounded-(--radius-control) px-1.5 py-[3px]"
                >
                  <Icon aria-hidden className="mp-alert-icon mt-px size-3.5 shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="mp-alert-title block truncate text-[12px] leading-[16px] text-ink">
                      {n.title}
                    </span>
                    {/* Three lines, three weights of attention: what it is,
                        who did it, where and when. Flattening the last two
                        into one colour turned the row into a paragraph. */}
                    <span className="block truncate text-[11px] leading-[14px] text-ink-muted">
                      {n.detail}
                    </span>
                    <span className="block truncate text-[11px] leading-[14px] text-ink-faint">
                      {n.potTitle} · {n.atLabel}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="mp-alert-arrow size-3.5 shrink-0 self-center text-primary"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
