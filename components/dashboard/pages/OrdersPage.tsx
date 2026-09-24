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
      <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por estado">
        {tabs.map(([k, label, count]) => (
          <Seg key={k} role="tab" aria-selected={filter === k} active={filter === k} onClick={() => setFilter(k)}>
            {label} <span className="ml-1 opacity-60">{count}</span>
          </Seg>
        ))}
      </div>

      <div className="mt-3.5 overflow-x-auto rounded-[14px] border border-p-card bg-white">
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
