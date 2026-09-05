"use client";

import { getClientAuth } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CaretUpDown, GearSix, Info, SignOut, User } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { MENU_EASE } from "@/components/ui/select";

const MENU_WIDTH = 224;
const GAP = 8;

export function NavProfile({
  displayName,
  email,
  avatarSrc,
}: {
  displayName: string;
  email: string;
  avatarSrc?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ left: number; bottom: number; width: number } | null>(null);

  const place = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const collapsed = document.documentElement.getAttribute("data-nav") === "collapsed";
    setBox(
      collapsed
        ? { left: r.right + GAP, bottom: window.innerHeight - r.bottom, width: MENU_WIDTH }
        : { left: r.left, bottom: window.innerHeight - r.top + 4, width: r.width },
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const menu =
    open && box ? (
      <>
        <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
        <motion.div
          key="menu"
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.2, ease: MENU_EASE }}
          style={{ position: "fixed", left: box.left, bottom: box.bottom, width: box.width, transformOrigin: "bottom left" }}
          className="z-50 rounded-(--radius-card) border border-edge bg-surface py-1.5 shadow-(--shadow-raised)"
        >
          <MenuItem icon={<User className="size-4" />} label="My contributions" onClick={() => go("/me/contributions")} />
          <MenuItem icon={<GearSix className="size-4" />} label="Settings" onClick={() => go("/me/settings")} />
          <MenuItem icon={<Info className="size-4" />} label="About MeltingPot" onClick={() => go("/")} />
          <div className="my-1 border-t border-edge" />
          <MenuItem
            icon={<SignOut className="size-4" />}
            label="Log out"
            onClick={async () => {
              setOpen(false);
              await getClientAuth().signOut();
              router.push("/");
              router.refresh();
            }}
          />
        </motion.div>
      </>
    ) : null;

  return (
    <div className="relative border-t border-edge p-2">
      {/* Guarded on document rather than a mounted flag: setting state in an
          effect just to learn we are on the client trips the cascading render
          rule, and the portal has nothing to draw until the menu opens anyway. */}
      {typeof document === "undefined"
        ? null
        : createPortal(<AnimatePresence>{menu}</AnimatePresence>, document.body)}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        title={displayName}
        className="mp-nav-profile flex w-full items-center gap-2.5 rounded-(--radius-control) p-1.5 text-left transition-colors hover:bg-sunken"
      >
        <Avatar name={displayName} src={avatarSrc} />
        <span className="mp-nav-open-only min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{displayName}</span>
          <span className="block truncate text-[12px] text-ink-muted">{email}</span>
        </span>
        <CaretUpDown className="mp-nav-open-only size-4 shrink-0 text-ink-faint" aria-hidden />
      </button>
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 whitespace-nowrap px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      {icon}
      {label}
    </button>
  );
}
