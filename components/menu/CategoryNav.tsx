"use client";

import { forwardRef } from "react";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface NavItem {
  id: string;
  name: string;
  count: number;
}

/** Chips horizontales sticky (móvil/tablet). El chip activo se centra desde el padre. */
export const CategoryChips = forwardRef<
  HTMLDivElement,
  { items: NavItem[]; activeId: string | null; onSelect: (id: string) => void }
>(function CategoryChips({ items, activeId, onSelect }, ref) {
  return (
    <nav
      ref={ref}
      aria-label="Categorías"
      className="no-scrollbar mx-auto flex max-w-[var(--maxw)] gap-2 overflow-x-auto scroll-smooth px-[var(--gutter)] pb-3 desk:hidden"
    >
      {items.map((n) => (
        <Chip key={n.id} data-chip={n.id} active={n.id === activeId} onClick={() => onSelect(n.id)}>
          {n.name}
        </Chip>
      ))}
    </nav>
  );
});

/** Sidebar de categorías sticky (desktop ≥ 1100px). */
export function CategorySidebar({
  items,
  activeId,
  onSelect,
}: {
  items: NavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Categorías" className="sticky top-24 hidden w-[200px] flex-none flex-col gap-0.5 pt-7 desk:flex">
      <div className="px-3 pb-2.5 text-xs font-bold tracking-[.08em] text-muted uppercase">Menú</div>
      {items.map((n) => {
        const active = n.id === activeId;
        return (
          <button
            key={n.id}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(n.id)}
            className={cn(
              "flex h-[42px] w-full items-center justify-between rounded-[10px] border-0 px-3 text-left text-[15px]",
              active ? "bg-hover font-bold shadow-[inset_3px_0_0_var(--brand)]" : "bg-transparent font-medium",
            )}
          >
            <span>{n.name}</span>
            <span className="text-xs font-medium text-muted">{n.count || ""}</span>
          </button>
        );
      })}
    </nav>
  );
}
