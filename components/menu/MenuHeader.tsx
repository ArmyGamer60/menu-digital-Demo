"use client";

import { Handbag, Info, Search } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "@/components/ui";
import type { BusinessStatus } from "@/lib/hours";
import type { Business } from "@/types";
import { StatusDot } from "./StatusDot";

export function BusinessLogo({ business, size = 44, fontSize = 22 }: { business: Business; size?: number; fontSize?: number }) {
  return (
    <div
      className="flex flex-none items-center justify-center overflow-hidden rounded-full bg-brand font-display leading-none text-on-brand"
      style={{ width: size, height: size, fontSize }}
    >
      {business.logoImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo subido por el negocio (fase 2: Storage)
        <img src={business.logoImage} alt={business.logoAlt || business.name} className="size-full bg-white object-cover" />
      ) : (
        <span aria-hidden>{business.logoText}</span>
      )}
    </div>
  );
}

export interface MenuHeaderProps {
  business: Business;
  status: BusinessStatus | null;
  cartCount: number;
  searchOpen: boolean;
  search: string;
  onSearchChange: (q: string) => void;
  onToggleSearch: () => void;
  onOpenInfo: () => void;
  onOpenCart: () => void;
  /** Chips de categorías (móvil/tablet). */
  chips?: ReactNode;
}

export function MenuHeader({
  business,
  status,
  cartCount,
  searchOpen,
  search,
  onSearchChange,
  onToggleSearch,
  onOpenInfo,
  onOpenCart,
  chips,
}: MenuHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  return (
    <header data-menu-header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[var(--maxw)] items-center gap-3 px-[var(--gutter)] py-3">
        <BusinessLogo business={business} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="m-0 truncate font-display text-[21px] leading-[1.1] font-normal tracking-[-.01em]">
              {business.name}
            </h1>
            <div className="hidden text-[13px] whitespace-nowrap text-muted tab:block">{business.tagline}</div>
          </div>
          <div className="mt-[3px] flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
            <StatusDot status={status} />
          </div>
        </div>
        <IconButton aria-label="Buscar" aria-expanded={searchOpen} onClick={onToggleSearch}>
          <Search size={20} strokeWidth={1.8} />
        </IconButton>
        <IconButton aria-label="Información del negocio" onClick={onOpenInfo}>
          <Info size={20} strokeWidth={1.8} />
        </IconButton>
        <IconButton aria-label={`Carrito, ${cartCount} productos`} tone="ink" onClick={onOpenCart} className="desk:hidden">
          <Handbag size={20} strokeWidth={1.8} />
          {cartCount > 0 ? (
            <span className="absolute -top-[3px] -right-[3px] flex h-5 min-w-5 items-center justify-center rounded-[10px] border-2 border-bg bg-brand px-[5px] text-[11px] font-bold text-on-brand">
              {cartCount}
            </span>
          ) : null}
        </IconButton>
      </div>

      {searchOpen ? (
        <div className="mx-auto max-w-[var(--maxw)] animate-[rise_.18s_ease-out] px-[var(--gutter)] pb-3">
          <div className="flex h-[46px] items-center gap-2.5 rounded-[23px] border border-line bg-surface px-3.5">
            <Search size={18} strokeWidth={1.8} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar en el menú"
              aria-label="Buscar en el menú"
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {search ? (
              <button type="button" onClick={() => onSearchChange("")} className="border-0 bg-transparent text-[13px] font-semibold text-muted">
                Borrar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {chips}
    </header>
  );
}
