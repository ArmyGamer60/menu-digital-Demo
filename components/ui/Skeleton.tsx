import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Bloque de carga con pulse 1.2s. */
export function Skeleton({ className, delay = 0, style }: { className?: string; delay?: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse-soft bg-[var(--line,rgba(0,0,0,.08))]", className)}
      style={{ animationDelay: delay ? `${delay}s` : undefined, ...style }}
    />
  );
}
