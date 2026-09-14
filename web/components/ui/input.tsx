import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { SmoothCaretInput } from "@/components/ui/smooth-caret";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full bg-surface border border-edge-strong rounded-(--radius-control) text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus-visible:outline-none transition-colors";

/**
 * Every single-line field in the product, so the drawn caret is the caret
 * everywhere: sign in, the class code, search, profile, all of it. Types that
 * have no text cursor to draw keep the plain element, because a checkbox with
 * a caret is a bug rather than a flourish.
 */
const NO_CARET = new Set(["checkbox", "radio", "file", "range", "color", "hidden", "submit", "button", "image", "reset"]);

export function Input({ className, ...rest }: ComponentProps<"input">) {
  const classes = cn(controlBase, "h-10 px-3.5 text-sm", className);
  if (rest.type && NO_CARET.has(rest.type)) {
    return <input className={classes} {...rest} />;
  }
  return <SmoothCaretInput className={classes} {...rest} />;
}

/**
 * `autoGrow` lets a short field take the height its content needs, with `rows`
 * as the floor and `max-h` as the ceiling. Without it a two-row box clips its
 * third line mid-glyph on a narrow screen, and `resize-none` leaves no handle
 * to recover it. Browsers without `field-sizing` fall back to plain `rows`.
 *
 * The caret here is the browser's own, coloured to match the drawn one, and
 * that is a decision rather than an omission (memory/decisions/033). A drawn
 * caret on a wrapping field has to guess which of two lines a caret at a soft
 * wrap belongs to, and the browser does not expose its answer, so it would sit
 * a whole line away from the real one about half the time someone pressed End.
 * A caret that is sometimes a line wrong is worse than one that never glides.
 */
export function TextArea({
  className,
  autoGrow,
  ...rest
}: ComponentProps<"textarea"> & { autoGrow?: boolean }) {
  return (
    <textarea
      className={cn(
        controlBase,
        "p-3.5 text-sm leading-relaxed resize-none caret-primary",
        autoGrow && "field-sizing-content max-h-64 overflow-y-auto",
        className,
      )}
      {...rest}
    />
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode;
};

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-ink"
      >
        {label}
      </label>
      {children({
        id,
        ...(error ? { "aria-invalid": true } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
