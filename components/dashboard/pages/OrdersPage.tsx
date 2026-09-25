"use client";

import { useState } from "react";
import { money, pad } from "@/lib/money";
import type { OrderStatus } from "@/types";
import { useAdmin } from "../AdminProvider";
import { OrderDrawer, OrderStatusPill, itemCount, orderModeLong, useOpenOrder } from "../OrderDrawer";
import { ORDER_STATUS, PageHeader, Seg } from "../ui";

const COLS = "grid-cols-[70px_70px_minmax(0,1.4fr)_minmax(0,1fr)_80px_100px_130px]";

export function OrdersPage() {
  const { business, orders } = useAdmin();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const openOrder = useOpenOrder(setOpenId);
  const m = (n: number) => money(n, business.settings.currency);
  const list = orders.filter((o) => filter === "all" || o.status === filter);

  const tabs: [OrderStatus | "all", string, number][] = [
    ["all", "Todos", orders.length],
    ...(Object.keys(ORDER_STATUS) as OrderStatus[]).map(
      (k) => [k, ORDER_STATUS[k].label, orders.filter((o) => o.status === k).length] as [OrderStatus, string, number],
    ),
  ];

  return (
    <>
      <PageHeader title="Pedidos" sub="Los pedidos llegan por WhatsApp. Este registro se guarda al enviar desde el menú." />
      <div className="no-scrollbar mt-5 flex flex-wrap gap-1.5 max-sm:-mx-4 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4" role="tablist" aria-label="Filtrar por estado">
        {tabs.map(([k, label, count]) => (
          <Seg key={k} role="tab" aria-selected={filter === k} active={filter === k} onClick={() => setFilter(k)}>
            {label} <span className="ml-1 opacity-60">{count}</span>
          </Seg>
        ))}
      </div>

      {/* Móvil: tarjetas */}
      <ul className="m-0 mt-3.5 grid list-none gap-2 p-0 sm:hidden" aria-label="Pedidos">
        {list.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => openOrder(o)}
              className="grid w-full gap-1.5 rounded-xl border border-p-card bg-white px-3.5 py-3 text-left"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <b>#{pad(o.number)}</b>
                  <span className="font-mono text-[12.5px] text-p-muted">{o.time}</span>
                  {o.isNew ? <span className="rounded-[10px] bg-p-accent px-[7px] py-0.5 text-[11px] font-bold text-white">Nuevo</span> : null}
                </span>
                <OrderStatusPill status={o.status} />
              </span>
              <span className="flex items-baseline justify-between gap-3">
                <b className="truncate font-semibold">{o.customer.name}</b>
                <span className="tabular font-semibold">{m(o.total)}</span>
              </span>
              <span className="text-[13px] text-p-muted">
                {orderModeLong(o)} · {itemCount(o)} {itemCount(o) === 1 ? "artículo" : "artículos"}
              </span>
            </button>
          </li>
        ))}
        {!list.length ? <li className="rounded-xl border border-p-card bg-white p-8 text-center text-p-muted">No hay pedidos con este estado.</li> : null}
      </ul>

      <div className="mt-3.5 overflow-x-auto rounded-[14px] border border-p-card bg-white max-sm:hidden">
        <div className="min-w-[760px]" role="table" aria-label="Pedidos">
          <div
            role="row"
            className={`grid ${COLS} gap-3 border-b border-p-card bg-p-row px-[18px] py-3 text-xs font-bold tracking-[.05em] text-p-muted uppercase`}
          >
            {["Pedido", "Hora", "Cliente", "Modalidad", "Artículos", "Total", "Estado"].map((h) => (
              <span key={h} role="columnheader">
                {h}
              </span>
            ))}
          </div>
          {list.map((o) => (
            <div
              key={o.id}
              role="row"
              tabIndex={0}
              onClick={() => openOrder(o)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openOrder(o))}
              className={`grid ${COLS} cursor-pointer items-center gap-3 border-b border-p-sep px-[18px] py-3.5 hover:bg-p-row focus-visible:bg-p-row focus-visible:outline-none`}
            >
              <span className="font-bold">#{pad(o.number)}</span>
              <span className="font-mono text-[12.5px] text-p-muted">{o.time}</span>
              <span className="truncate">
                <b className="font-semibold">{o.customer.name}</b>
                {o.isNew ? (
                  <span className="ml-2 rounded-[10px] bg-p-accent px-[7px] py-0.5 text-[11px] font-bold text-white">Nuevo</span>
                ) : null}
              </span>
              <span className="text-p-soft">{orderModeLong(o)}</span>
              <span>{itemCount(o)}</span>
              <span className="tabular font-semibold">{m(o.total)}</span>
              <span>
                <OrderStatusPill status={o.status} />
              </span>
            </div>
          ))}
          {!list.length ? <div className="p-12 text-center text-p-muted">No hay pedidos con este estado.</div> : null}
        </div>
      </div>

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
