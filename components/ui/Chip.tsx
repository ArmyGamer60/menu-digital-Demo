import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** "nav": chip de categoría (activo = fondo ink). "choice": opción seleccionable (activo = borde brand). */
  kind?: "nav" | "choice";
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, kind = "nav", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "flex-none text-sm font-semibold whitespace-nowrap transition-[background,color,border-color] duration-200",
        kind === "nav" &&
          cn(
            "h-10 rounded-[var(--pill-r,20px)] border px-4",
            active ? "border-ink bg-ink text-bg" : "border-line-strong bg-transparent text-ink",
          ),
        kind === "choice" &&
          cn(
            "h-11 rounded-[22px] border-[1.5px] px-4",
            active
              ? "border-brand bg-[color-mix(in_oklab,var(--brand)_10%,var(--surface))]"
              : "border-line-strong bg-surface",
          ),
        className,
      )}
      {...props}
    />
  );
});
