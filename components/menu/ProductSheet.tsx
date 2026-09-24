"use client";

import Image from "next/image";
import { Check, Minus, Plus, X } from "lucide-react";
import { Badge, IconButton, Pill, Sheet, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BusinessStatus } from "@/lib/hours";
import { money } from "@/lib/money";
import { groupsFor, lineUnitPrice, missingRequired } from "@/lib/pricing";
import type { Business, ModifierGroup, ModifierOption, Selections } from "@/types";
import { closedCtaLabel, productView } from "./view";

export interface ProductSheetState {
  productId: string;
  sel: Selections;
  qty: number;
  notes: string;
  /** Línea del carrito que se está editando (reemplaza al guardar). */
  editLineId: string | null;
  showErr: boolean;
}

/** Aplica la regla de selección: single (toggle si no es obligatorio) / multiple (respeta max). */
export function pickOption(sel: Selections, g: ModifierGroup, o: ModifierOption): Selections {
  const cur = sel[g.id] ?? [];
  const next = { ...sel };
  if (g.type === "single") next[g.id] = cur[0] === o.id && !g.required ? [] : [o.id];
  else if (cur.includes(o.id)) next[g.id] = cur.filter((x) => x !== o.id);
  else if (!g.max || cur.length < g.max) next[g.id] = [...cur, o.id];
  return next;
}

export function ModifierGroupPicker({
  group,
  selected,
  showError,
  currency,
  onPick,
}: {
  group: ModifierGroup;
  selected: string[];
  showError: boolean;
  currency: Business["settings"]["currency"];
  onPick: (o: ModifierOption) => void;
}) {
  const err = showError && group.required && !selected.length;
  const multiple = group.type === "multiple";
  return (
    <div role="group" aria-labelledby={`g-${group.id}`} className="mt-[22px] border-t border-line pt-[18px]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div id={`g-${group.id}`} className="text-base font-bold">
            {group.name}
          </div>
          <div className="mt-0.5 text-[13px] text-muted">
            {multiple ? `Elige hasta ${group.max ?? group.options.length}` : "Elige 1"}
          </div>
        </div>
        <span
          className={cn(
            "flex-none rounded-[20px] px-2.5 py-1 text-[11.5px] leading-[1.2] font-bold",
            err ? "bg-danger text-white" : group.required ? "bg-ink text-bg" : "border border-line-strong text-muted",
          )}
        >
          {err ? "Requerido" : group.required ? "Obligatorio" : "Opcional"}
        </span>
      </div>
      {group.options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onPick(o)}
            className="flex min-h-[50px] w-full items-center gap-3 border-0 border-b border-line bg-transparent px-0.5 py-2 text-left"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-6 flex-none items-center justify-center border-2 transition-all duration-150",
                multiple ? "rounded-[7px]" : "rounded-full",
                on ? "border-brand" : "border-line-strong",
                on && multiple && "bg-brand text-on-brand",
              )}
            >
              {on ? multiple ? <Check size={15} strokeWidth={3} /> : <span className="size-3 rounded-full bg-brand" /> : null}
            </span>
            <span className="flex-1 text-[15px]">{o.name}</span>
            <span className="tabular text-sm text-muted">{o.price ? `+${money(o.price, currency)}` : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface ProductSheetProps {
  business: Business;
  state: ProductSheetState | null;
  status: BusinessStatus | null;
  onChange: (s: ProductSheetState) => void;
  onClose: () => void;
  onCommit: (s: ProductSheetState) => void;
}

export function ProductSheet({ business, state, status, onChange, onClose, onCommit }: ProductSheetProps) {
  const product = state ? business.products.find((p) => p.id === state.productId) : undefined;
  const open = Boolean(state && product);
  const canOrder = status?.canOrder ?? true;

  const body = (() => {
    if (!state || !product) return null;
    const v = productView(business, product, canOrder);
    const groups = groupsFor(business, product);
    const miss = missingRequired(business, product, state.sel);
    const unit = lineUnitPrice(business, product, state.sel);
    const blocked = v.soldOut || !canOrder;
    const ready = !miss.length;
    const m = (n: number) => money(n, business.settings.currency);
    const cta = v.soldOut
      ? "Agotado temporalmente"
      : !canOrder
        ? closedCtaLabel(status)
        : !ready
          ? `Elige ${miss[0]!.name.toLowerCase()}`
          : `${state.editLineId ? "Actualizar" : "Agregar al carrito"} — ${m(unit * state.qty)}`;

    const add = () => {
      if (blocked) return;
      if (!ready) return onChange({ ...state, showErr: true });
      onCommit(state);
    };

    return (
      <>
        <div className="relative h-[34%] flex-none bg-img-bg tab:h-auto tab:w-[46%]">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill sizes="(min-width: 700px) 440px, 100vw" className="object-cover" />
          ) : null}
          <IconButton aria-label="Cerrar" tone="white" onClick={onClose} className="absolute! top-3.5 right-3.5">
            <X size={18} strokeWidth={2} />
          </IconButton>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-[22px] pt-[22px] pb-2">
            {v.badge || product.tags.length ? (
              <div className="mb-2.5 flex flex-wrap gap-2">
                {v.badge ? <Badge tone={v.badge} /> : null}
                {product.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            ) : null}
            <h2 className="m-0 font-display text-[32px] leading-[1.02] font-normal tracking-[-.015em]">{product.name}</h2>
            <p className="mt-2.5 mb-0 text-[15px] leading-normal text-muted">{product.description}</p>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-xl font-bold">{v.priceLabel}</span>
              {v.compareLabel ? <span className="text-muted line-through">{v.compareLabel}</span> : null}
            </div>
            {v.soldOut ? (
              <div className="mt-4 rounded-xl bg-img-bg px-3.5 py-3 text-sm font-semibold">Agotado temporalmente. Vuelve más tarde.</div>
            ) : null}

            {groups.map((g) => (
              <ModifierGroupPicker
                key={g.id}
                group={g}
                selected={state.sel[g.id] ?? []}
                showError={state.showErr}
                currency={business.settings.currency}
                onPick={(o) => onChange({ ...state, sel: pickOption(state.sel, g, o) })}
              />
            ))}

            {business.settings.notesEnabled ? (
              <div className="mt-[22px] border-t border-line pt-[18px]">
                <label htmlFor="pd-notes" className="mb-2 block text-base font-bold">
                  Notas especiales
                </label>
                <Textarea
                  id="pd-notes"
                  rows={2}
                  value={state.notes}
                  onChange={(e) => onChange({ ...state, notes: e.target.value })}
                  placeholder="Ej. sin azúcar"
                  size="sm"
                />
              </div>
            ) : null}
            <div className="h-3" />
          </div>

          <div className="flex items-center gap-3 border-t border-line bg-surface px-[22px] pt-3.5 pb-[max(18px,env(safe-area-inset-bottom))]">
            <div className="flex h-[52px] flex-none items-center rounded-[26px] border border-line-strong">
              <button
                type="button"
                aria-label="Menos"
                onClick={() => onChange({ ...state, qty: Math.max(1, state.qty - 1) })}
                className="flex h-[50px] w-[46px] items-center justify-center border-0 bg-transparent"
              >
                <Minus size={16} strokeWidth={2.4} />
              </button>
              <span className="min-w-[22px] text-center text-base font-bold" aria-live="polite">
                {state.qty}
              </span>
              <button
                type="button"
                aria-label="Más"
                onClick={() => onChange({ ...state, qty: state.qty + 1 })}
                className="flex h-[50px] w-[46px] items-center justify-center border-0 bg-transparent"
              >
                <Plus size={16} strokeWidth={2.4} />
              </button>
            </div>
            <button
              type="button"
              onClick={add}
              aria-disabled={blocked}
              className={cn(
                "h-[52px] flex-1 rounded-[var(--cta-r)] border-0 px-4 text-[15.5px] font-bold transition-colors duration-200",
                blocked ? "cursor-not-allowed bg-line-strong text-muted" : ready ? "bg-brand text-on-brand" : "bg-ink text-bg",
              )}
            >
              {cta}
            </button>
          </div>
        </div>
      </>
    );
  })();

  return (
    <Sheet
      responsive
      open={open}
      onClose={onClose}
      label={product?.name ?? "Producto"}
      z={70}
      className="h-[95%] tab:h-[min(640px,100%)] tab:w-[min(920px,100%)] tab:flex-row"
    >
      {body}
    </Sheet>
  );
}
