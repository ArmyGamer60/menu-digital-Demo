"use client";

import { money } from "@/lib/money";
import { pad } from "@/lib/money";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/types";
import { useAdmin } from "./AdminProvider";
import { ORDER_STATUS, PanelDrawer, Seg, StatusPill } from "./ui";

export const orderModeShort = (o: Order) => (o.mode === "dinein" ? `Mesa ${o.customer.table ?? "—"}` : "Recoger");
export const orderModeLong = (o: Order) =>
  o.mode === "dinein" ? `Comer aquí · Mesa ${o.customer.table ?? "—"}` : `Recoger · ${o.customer.pickupTime || "sin hora"}`;
export const itemCount = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0);

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return (
    <StatusPill bg={s.bg} fg={s.fg}>
      {s.label}
    </StatusPill>
  );
}

/** Abre el pedido y lo marca como visto (quita la pill "Nuevo"). */
export function useOpenOrder(setOpenId: (id: string) => void) {
  const { updateOrder } = useAdmin();
  return (o: Order) => {
    setOpenId(o.id);
    if (o.isNew) void updateOrder(o.id, { isNew: false });
  };
}

export function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { business, orders, updateOrder } = useAdmin();
  const o = orders.find((x) => x.id === orderId);
  const m = (n: number) => money(n, business.settings.currency);

  const info: [string, string][] = o
    ? [
        ["Cliente", o.customer.name],
        ...(o.customer.phone ? ([["Teléfono", o.customer.phone]] as [string, string][]) : []),
        ...(o.mode === "dinein"
          ? ([["Mesa", o.customer.table ?? "—"]] as [string, string][])
          : ([["Hora de recogida", o.customer.pickupTime || "—"]] as [string, string][])),
        ...(o.customer.guests ? ([["Personas", String(o.customer.guests)]] as [string, string][]) : []),
        ...(o.notes ? ([["Notas", o.notes]] as [string, string][]) : []),
      ]
    : [];

  return (
    <PanelDrawer open={!!o} title={o ? `Pedido #${pad(o.number)}` : ""} onClose={onClose}>
      {o ? (
        <>
          <div className="flex items-center justify-between">
            <OrderStatusPill status={o.status} />
            <span className="text-p-muted">
              {o.time} · {orderModeLong(o)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cambiar estado">
            {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((k) => (
              <Seg
                key={k}
                active={o.status === k}
                onClick={() => o.status !== k && void updateOrder(o.id, { status: k }, `Pedido #${pad(o.number)}: ${ORDER_STATUS[k].label}`)}
              >
                {ORDER_STATUS[k].label}
              </Seg>
            ))}
          </div>
          <div className="grid gap-1.5 rounded-xl border border-p-sep bg-p-row p-3.5">
            {info.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-p-muted">{k}</span>
                <b className="text-right font-semibold">{v}</b>
              </div>
            ))}
          </div>
          <div>
            {o.items.map((l, i) => (
              <div key={i} className="flex gap-3 border-b border-p-sep py-2.5">
                <b className="w-[26px]">{l.qty}×</b>
                <div className="flex-1">
                  <div className="font-semibold">{l.name}</div>
                  {l.mods.length ? <div className="text-[12.5px] text-p-muted">{l.mods.join(" · ")}</div> : null}
                  {l.notes ? <div className="text-[12.5px] text-p-muted italic">“{l.notes}”</div> : null}
                </div>
                <span className="tabular">{m(l.unit * l.qty)}</span>
              </div>
            ))}
            {o.discount ? (
              <div className="flex justify-between pt-3 text-p-muted">
                <span>Descuento</span>
                <span>−{m(o.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-3 text-[17px] font-bold">
              <span>Total</span>
              <span>{m(o.total)}</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 font-bold">Mensaje de WhatsApp</div>
            <pre className="m-0 rounded-xl bg-[#E4F3E6] p-3.5 font-mono text-xs leading-normal whitespace-pre-wrap text-[#10301A]">
              {generateWhatsAppMessage(o, business)}
            </pre>
          </div>
        </>
      ) : null}
    </PanelDrawer>
  );
}
