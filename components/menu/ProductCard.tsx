"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Badge } from "@/components/ui";
import type { CardStyle, Layout } from "@/types";
import type { ProductView } from "./view";

export interface ProductCardProps {
  view: ProductView;
  cardStyle: CardStyle;
  layout: Layout;
  onOpen: () => void;
  onQuick: () => void;
  /** Retardo de la animación de entrada para escalonar la grilla. */
  index?: number;
}

const activate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

const GRID_SIZES = "(min-width: 1100px) 260px, (min-width: 700px) 30vw, 50vw";

function Photo({ src, alt, sizes, zoom }: { src: string; alt: string; sizes: string; zoom?: boolean }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={zoom ? "object-cover transition-transform duration-500 group-hover:scale-105" : "object-cover"}
    />
  );
}

function Price({ view, className }: { view: ProductView; className?: string }) {
  return (
    <div className={className}>
      <span className="tabular text-[15px] font-bold">{view.priceLabel}</span>
      {view.compareLabel ? <span className="text-[13px] text-muted line-through">{view.compareLabel}</span> : null}
    </div>
  );
}

/** Tarjeta de producto: resuelve la variante según cardStyle × layout. */
export function ProductCard({ view, cardStyle, layout, onOpen, onQuick, index = 0 }: ProductCardProps) {
  const isRows = layout === "list" || layout === "compact";
  if (isRows) return <ProductRow view={view} onOpen={onOpen} />;
  if (cardStyle === "image-heavy") return <ProductOverlayCard view={view} onOpen={onOpen} index={index} />;
  return <ProductGridCard view={view} onOpen={onOpen} onQuick={onQuick} index={index} />;
}

function ProductGridCard({ view, onOpen, onQuick, index }: Omit<ProductCardProps, "cardStyle" | "layout">) {
  const { product: p } = view;
  const quick = (e: MouseEvent) => {
    e.stopPropagation();
    onQuick();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${p.name}, ${view.priceLabel}${view.soldOut ? ", agotado" : ""}`}
      onClick={onOpen}
      onKeyDown={activate(onOpen)}
      className="pcard group relative flex animate-rise cursor-pointer flex-col overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${Math.min(index ?? 0, 8) * 30}ms` }}
    >
      <div className="pcard-img relative overflow-hidden bg-img-bg">
        <Photo src={p.image} alt={p.name} sizes={GRID_SIZES} zoom />
        {view.badge ? <Badge tone={view.badge} className="absolute top-2.5 left-2.5 z-[2]" /> : null}
        {view.soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(20,18,15,.55)] p-3 text-center text-[13.5px] font-bold text-white">
            Agotado temporalmente
          </div>
        ) : null}
        {view.canQuick ? (
          <button
            type="button"
            aria-label={`Agregar ${p.name}`}
            onClick={quick}
            onKeyDown={(e) => e.stopPropagation()}
            className="absolute right-2.5 bottom-2.5 flex size-10 items-center justify-center rounded-full border-0 bg-bg text-ink shadow-[0_4px_14px_rgba(0,0,0,.18)] transition-transform duration-150 active:scale-90"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>
        ) : null}
      </div>
      <div className="pcard-body flex flex-1 flex-col gap-1">
        <div className="pcard-title leading-[1.12] text-pretty">{p.name}</div>
        <div className="pdesc line-clamp-2 text-[13px] leading-[1.4] text-muted">{p.description}</div>
        <Price view={view} className="mt-auto flex items-baseline gap-2 pt-1.5" />
      </div>
    </div>
  );
}

function ProductOverlayCard({ view, onOpen, index }: Pick<ProductCardProps, "view" | "onOpen" | "index">) {
  const { product: p } = view;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${p.name}, ${view.priceLabel}${view.soldOut ? ", agotado" : ""}`}
      onClick={onOpen}
      onKeyDown={activate(onOpen)}
      className="group relative aspect-[3/4] animate-rise cursor-pointer overflow-hidden rounded-[var(--c-radius)] bg-ink"
      style={{ animationDelay: `${Math.min(index ?? 0, 8) * 30}ms` }}
    >
      <Photo src={p.image} alt={p.name} sizes={GRID_SIZES} zoom />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,.82)_100%)]" />
      {view.badge ? <Badge tone={view.badge} className="absolute top-2.5 left-2.5 z-[2]" /> : null}
      <div className="pointer-events-none absolute right-3.5 bottom-3.5 left-3.5 text-white">
        <div className="font-display text-xl leading-[1.05]">{p.name}</div>
        <div className="pdesc mt-1 line-clamp-2 text-[12.5px] opacity-85">{p.description}</div>
        <div className="mt-2 font-bold">
          {view.priceLabel} {view.soldOut ? <span className="font-medium opacity-80">· Agotado</span> : null}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ view, onOpen }: Pick<ProductCardProps, "view" | "onOpen">) {
  const { product: p } = view;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${p.name}, ${view.priceLabel}${view.soldOut ? ", agotado" : ""}`}
      onClick={onOpen}
      onKeyDown={activate(onOpen)}
      className="prow flex animate-[rise_.3s_ease-out_both] cursor-pointer items-center gap-3.5 transition-colors hover:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="prow-title leading-[1.15]">{p.name}</div>
          {view.badge ? <Badge tone={view.badge} /> : null}
        </div>
        <div className="pdesc mt-1 line-clamp-2 text-[13px] leading-[1.4] text-muted">{p.description}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15px] font-bold">{view.priceLabel}</span>
          {view.compareLabel ? <span className="text-[13px] text-muted line-through">{view.compareLabel}</span> : null}
          {view.soldOut ? <span className="text-[12.5px] font-semibold text-muted">Agotado temporalmente</span> : null}
        </div>
      </div>
      <div className="prow-thumb relative flex-none overflow-hidden bg-img-bg">
        <Photo src={p.image} alt={p.name} sizes="112px" />
        {view.soldOut ? <div className="absolute inset-0 bg-[rgba(20,18,15,.5)]" /> : null}
      </div>
    </div>
  );
}

/** Carrusel de destacados con scroll-snap (tarjetas 230/260px, 4/5). */
export function FeaturedStrip({ items, onOpen }: { items: ProductView[]; onOpen: (v: ProductView) => void }) {
  return (
    <div className="no-scrollbar mx-[calc(var(--gutter)*-1)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] [scroll-padding-inline:var(--gutter)]">
      {items.map((v) => (
        <div
          key={v.product.id}
          role="button"
          tabIndex={0}
          aria-label={`${v.product.name}, ${v.priceLabel}`}
          onClick={() => onOpen(v)}
          onKeyDown={activate(() => onOpen(v))}
          className="group relative aspect-[4/5] w-[var(--strip-w)] flex-none cursor-pointer snap-start overflow-hidden rounded-[var(--strip-r)] bg-ink"
        >
          <Photo src={v.product.image} alt={v.product.name} sizes="260px" zoom />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05)_35%,rgba(0,0,0,.78)_100%)]" />
          {v.badge ? <Badge tone={v.badge} className="absolute top-2.5 left-2.5 z-[2]" /> : null}
          <div className="pointer-events-none absolute right-4 bottom-4 left-4 text-white">
            <div className="font-display text-[23px] leading-[1.05] tracking-[-.01em]">{v.product.name}</div>
            <div className="mt-1.5 flex items-baseline gap-2 text-[15px] font-bold">
              <span>{v.priceLabel}</span>
              {v.compareLabel ? <span className="text-[13px] font-medium line-through opacity-75">{v.compareLabel}</span> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
