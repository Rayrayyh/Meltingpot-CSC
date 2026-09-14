"use client";

import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { SmoothCaretInput } from "@/components/ui/smooth-caret";
import { cn } from "@/lib/cn";
import { CLASS_CODE_LENGTH, normalizeClassCode } from "@/lib/class-code";

export { CLASS_CODE_LENGTH, normalizeClassCode };

/**
 * The six-character class code field. Auto-uppercases, strips separators,
 * and never clears itself on errors; the error is rendered below the field.
 *
 * It draws its own caret like every other field in the product. This is the
 * hardest place in the app to do that: the text is centered, so the caret sits
 * wherever the browser put a run that moves with every character typed, and it
 * is letter spaced by 0.35em, so a measurement that ignored the spacing would
 * drift further left with each one.
 */
export function ClassCodeInput({
  value,
  onValueChange,
  error,
  label = "Class code",
  size = "lg",
  className,
  ...rest
}: {
  value: string;
  onValueChange: (next: string) => void;
  error?: string | null;
  label?: string;
  size?: "md" | "lg";
} & Omit<ComponentProps<"input">, "value" | "onChange" | "size">) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <SmoothCaretInput
        id={id}
        value={value}
        onChange={(e) => onValueChange(normalizeClassCode(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ABC123"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        maxLength={CLASS_CODE_LENGTH}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "w-full bg-surface border rounded-(--radius-card) text-center font-mono font-semibold tracking-[0.35em] text-ink placeholder:text-ink-faint placeholder:tracking-[0.35em] focus:outline-none transition-colors",
          size === "lg" ? "h-16 text-2xl" : "h-12 text-lg",
          error && !focused ? "border-danger" : "border-edge-strong focus:border-primary",
        )}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger text-center">
          {error}
        </p>
      ) : null}
    </div>
  );
}
