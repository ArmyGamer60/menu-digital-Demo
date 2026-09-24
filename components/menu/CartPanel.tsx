"use client";

import Image from "next/image";
import { Handbag, Minus, Plus, X } from "lucide-react";
import { Button, Drawer, IconButton } from "@/components/ui";
import type { CartTotals } from "@/lib/pricing";
import type { CartLine } from "@/types";

export interface CartContentsProps {
  lines: CartLine[];
  totals: CartTotals;
  money: (n: number) => string;
  taxRate: number;
  canOrder: boolean;
  continueLabel: string;
  /** En desktop el carrito es fijo y no tiene botón cerrar ni "Explorar menú". */
  closable: boolean;
  onClose?: () => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onRemove: (line: CartLine) => void;
  onCheckout: () => void;
}

export function CartContents({
  lines,
  totals,
  money,
  taxRate,
  canOrder,
  continueLabel,
  closable,
  onClose,
  onInc,
  onDec,
  onEdit,
  onRemove,
  onCheckout,
}: CartContentsProps) {
  const count = totals.count;
  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 pt-[18px] pb-3.5">
        <div>
          <h2 className="m-0 font-display text-2xl leading-none font-normal">Tu pedido</h2>
          <div className="mt-1 text-[13px] text-muted">
            {count ? `${count} ${count === 1 ? "producto" : "productos"}` : "Sin productos"}
          </div>
        </div>
        {closable ? (
          <IconButton aria-label="Cerrar" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </IconButton>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-1.5">
        {!lines.length ? (
          <div className="px-2 py-14 text-center">
            <div className="mx-auto mb-4 flex size-[60px] items-center justify-center rounded-full bg-img-bg">
              <Handbag size={24} strokeWidth={1.8} aria-hidden />
            </div>
            <div className="font-display text-[22px] leading-[1.15] text-balance">Tu carrito está esperando algo delicioso.</div>
            <div className="mt-2 text-sm text-muted">Agrega productos del menú para empezar tu pedido.</div>
            {closable ? (
              <Button variant="outline" onClick={onClose} className="mt-5 rounded-[23px]">
                Explorar menú
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {lines.map((l) => (
              <li key={l.id} className="flex animate-rise-fast gap-3 border-b border-line py-3.5">
                <div className="relative size-[60px] flex-none overflow-hidden rounded-xl bg-img-bg">
                  {l.image ? <Image src={l.image} alt="" fill sizes="60px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div className="text-[15px] leading-[1.25] font-bold">{l.name}</div>
                    <div className="tabular text-[15px] font-bold whitespace-nowrap">{money(l.unit * l.qty)}</div>
                  </div>
                  {l.mods.length ? <div className="mt-0.5 text-[13px] leading-[1.4] text-muted">{l.mods.join(" · ")}</div> : null}
                  {l.notes ? <div className="mt-0.5 text-[13px] text-muted italic">“{l.notes}”</div> : null}
                  <div className="mt-0.5 text-[12.5px] text-muted">{money(l.unit)} c/u</div>
                  <div className="mt-2.5 flex items-center gap-3.5">
                    <div className="flex h-9 items-center rounded-[20px] border border-line-strong">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${l.name}`}
                        onClick={() => onDec(l.id)}
                        className="flex h-[34px] w-9 items-center justify-center border-0 bg-transparent"
                      >
                        <Minus size={14} strokeWidth={2.4} />
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold">{l.qty}</span>
                      <button
                        type="button"
                        aria-label={`Agregar uno de ${l.name}`}
                        onClick={() => onInc(l.id)}
                        className="flex h-[34px] w-9 items-center justify-center border-0 bg-transparent"
                      >
                        <Plus size={14} strokeWidth={2.4} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(l)}
                      className="border-0 bg-transparent px-0 py-1.5 text-[13px] font-semibold underline underline-offset-[3px]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(l)}
                      className="border-0 bg-transparent px-0 py-1.5 text-[13px] font-semibold text-muted"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lines.length ? (
        <div className="border-t border-line bg-surface px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="flex justify-between py-[3px] text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="tabular">{money(totals.subtotal)}</span>
          </div>
          {totals.applied.map((a) => (
            <div key={a.name} className="flex justify-between py-[3px] text-sm text-brand2">
              <span>{a.name}</span>
              <span>−{money(a.amount)}</span>
            </div>
          ))}
          {totals.tax > 0 ? (
            <div className="flex justify-between py-[3px] text-sm">
              <span className="text-muted">Impuestos ({taxRate}%)</span>
              <span>{money(totals.tax)}</span>
            </div>
          ) : null}
          <div className="flex justify-between pt-2.5 pb-3.5 text-[19px] font-bold">
            <span>Total</span>
            <span className="tabular">{money(totals.total)}</span>
          </div>
          <Button variant={canOrder ? "brand" : "disabled"} size="lg" block disabled={!canOrder} onClick={onCheckout}>
            {continueLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}

/** Carrito: sticky a la derecha en desktop; bottom sheet (móvil) / drawer 420px (tablet) al abrirlo. */
export function CartPanel({ open, ...props }: Omit<CartContentsProps, "closable"> & { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside
        aria-label="Tu pedido"
        className="fixed top-0 right-0 bottom-0 z-[35] hidden w-[380px] flex-col border-l border-line bg-surface desk:flex"
      >
        <CartContents {...props} closable={false} />
      </aside>
      <Drawer
        responsive
        open={open}
        onClose={props.onClose}
        label="Tu pedido"
        z={55}
        wrapperClassName="desk:hidden"
        backdrop="rgba(15,12,10,.45)"
        className="h-[88%] shadow-[0_-10px_40px_rgba(0,0,0,.2)] tab:h-full tab:w-[420px]"
      >
        <CartContents {...props} closable />
      </Drawer>
    </>
  );
}

/** Barra flotante "Ver pedido" (móvil/tablet). `bumpKey` reinicia la animación bump. */
export function CartBar({ count, total, bumpKey, onOpen }: { count: number; total: string; bumpKey: number; onOpen: () => void }) {
  return (
    <button
      key={bumpKey}
      type="button"
      onClick={onOpen}
      className="fixed inset-x-[var(--gutter)] bottom-[max(16px,env(safe-area-inset-bottom))] z-40 mx-auto flex h-[58px] max-w-[560px] animate-bump items-center gap-3 rounded-[29px] border-0 bg-brand px-2 text-base font-bold text-on-brand shadow-[0_10px_30px_rgba(0,0,0,.25)] desk:hidden"
    >
      <span className="flex h-[42px] min-w-[42px] items-center justify-center rounded-[21px] bg-black/18 text-[15px]">{count}</span>
      <span className="flex-1 text-left">Ver pedido</span>
      <span className="tabular pr-3.5">{total}</span>
    </button>
  );
}
