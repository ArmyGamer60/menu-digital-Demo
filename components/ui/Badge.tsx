import type { CSSProperties } from "react";
import type { Badge as BadgeKind } from "@/types";
import { cn } from "@/lib/cn";

export type BadgeTone = Exclude<BadgeKind, null> | "agotado";

const TONES: Record<BadgeTone, { label: string; bg: string; fg: string }> = {
  popular: { label: "Popular", bg: "var(--brand)", fg: "var(--on-brand)" },
  nuevo: { label: "Nuevo", bg: "var(--brand2)", fg: "#fff" },
  especial: { label: "Especial", bg: "var(--accent)", fg: "#1b1408" },
  recomendado: { label: "Recomendado", bg: "var(--ink)", fg: "var(--bg)" },
  agotado: { label: "Agotado", bg: "#5b5650", fg: "#fff" },
};

export const badgeLabel = (tone: BadgeTone) => TONES[tone].label;

/** Badge de producto: 11px/700 uppercase, píldora (0 en premium). */
export function Badge({ tone, className, style }: { tone: BadgeTone; className?: string; style?: CSSProperties }) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex rounded-[var(--pill-r,20px)] px-[9px] py-1 text-[11px] leading-[1.2] font-bold tracking-[.04em] uppercase",
        className,
      )}
      style={{ background: t.bg, color: t.fg, ...style }}
    >
      {t.label}
    </span>
  );
}

/** Pill neutral con borde (tags del producto, "Opcional"). */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-[20px] border border-line-strong px-[9px] py-1 text-xs leading-[1.2] font-semibold", className)}>
      {children}
    </span>
  );
}
