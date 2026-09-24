"use client";

import { cn } from "@/lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Switch 38×22 (panel y ajustes). */
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[22px] w-[38px] flex-none rounded-full border-0 p-0 transition-colors duration-150 disabled:opacity-40",
        checked ? "bg-[var(--ink,#1B1916)]" : "bg-[#D6D1C8]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-transform duration-150",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}
