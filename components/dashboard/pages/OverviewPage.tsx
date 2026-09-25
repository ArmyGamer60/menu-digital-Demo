"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNow } from "@/components/menu/hooks";
import { businessStatus, STATUS_COLORS, zonedClock } from "@/lib/hours";
import { money, pad } from "@/lib/money";
import { useAdmin } from "../AdminProvider";
import { OrderDrawer, OrderStatusPill, orderModeShort, useOpenOrder } from "../OrderDrawer";
import { Card, CardTitle, PageHeader, PButton, Thumb } from "../ui";

const greeting = (h: number) => (h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");

export function OverviewPage() {
  const { business, orders, user } = useAdmin();
  const router = useRouter();
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  const openOrder = useOpenOrder(setOpenId);
  const m = (n: number) => money(n, business.settings.currency);

  const active = orders.filter((o) => o.status !== "cancelled");
  const sales = active.reduce((s, o) => s + o.total, 0);
  const pendingOrPrep = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const dine = orders.filter((o) => o.mode === "dinein").length;
  const pick = orders.length - dine;
  const top = [...business.products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxSold = top[0]?.sold || 1;

  const st = now ? businessStatus(business, now) : null;
  const dot = st ? STATUS_COLORS[st.key] : "transparent";
  const todayDay = now ? zonedClock(now, business.settings.timezone).day : null;
  const th = business.hours.find((h) => h.day === todayDay);
  const todayHours = th && th.active ? th.ranges.map((r) => `${r[0]}–${r[1]}`).join(" · ") : "Cerrado";
  const firstOpen = business.hours.find((h) => h.day === todayDay)?.ranges[0]?.[0];

  const kpis = [
    { label: "Pedidos de hoy", value: String(orders.length), sub: firstOpen ? `Desde las ${firstOpen}` : "Registrados" },
    { label: "Pendientes", value: String(pendingOrPrep), sub: "Pendientes o en preparación" },
    { label: "Ventas estimadas", value: m(sales), sub: "Según pedidos enviados" },
    { label: "Ticket promedio", value: m(active.length ? Math.round(sales / active.length) : 0), sub: `${active.length} pedidos` },
  ];

  return (
    <>
      <PageHeader
        eyebrow={now ? now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }) : " "}
        title={`${now ? greeting(now.getHours()) : "Hola"}, ${user.firstName}`}
        actions={
          <>
            <PButton size="md" onClick={() => router.push("/admin/orders")}>
              Ver pedidos
            </PButton>
            <PButton size="md" variant="primary" onClick={() => router.push("/admin/products/new")}>
              Nuevo producto
            </PButton>
          </>
        }
      />

      <div className="mt-[22px] grid grid-cols-2 gap-3.5 max-sm:gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {kpis.map((k) => (
          <Card key={k.label} pad={18} className="animate-[rise_.3s_ease-out_both]">
            <div className="text-[13px] font-semibold text-p-muted">{k.label}</div>
            <div className="mt-2 font-pdisplay text-[34px] leading-[1.15] tracking-[-.01em]">{k.value}</div>
            <div className="mt-1 text-[12.5px] text-p-muted">{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-3.5">
        <Card pad={20}>
          <div className="flex items-center justify-between">
            <CardTitle>Actividad reciente</CardTitle>
            <Link href="/admin/orders" className="font-semibold text-p-muted no-underline">
              Todos
            </Link>
          </div>
          <div className="mt-2.5">
            {orders.length ? (
              orders.slice(0, 6).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => openOrder(o)}
                  className="flex w-full items-center gap-3 border-0 border-b border-p-sep bg-transparent py-[11px] text-left"
                >
                  <span className="w-[42px] font-mono text-[12.5px] text-p-muted max-sm:hidden">{o.time}</span>
                  <span className="w-12 font-bold">#{pad(o.number)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {o.customer.name} <span className="text-p-muted">· {orderModeShort(o)}</span>
                  </span>
                  <span className="tabular font-semibold">{m(o.total)}</span>
                  <OrderStatusPill status={o.status} />
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-p-muted">Aún no hay pedidos.</div>
            )}
          </div>
        </Card>

        <div className="grid content-start gap-3.5">
          <div className="rounded-[14px] bg-p-side p-5 text-[#F3EEE6]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-p-side-muted">Horario actual</div>
              <Link href="/admin/hours" className="font-semibold text-[#F3EEE6] underline underline-offset-[3px]">
                Cambiar
              </Link>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="size-2 flex-none rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px ${dot}33` }} />
              <span className="font-pdisplay text-[30px] leading-[1.2] tracking-[.02em]">
                {st ? (st.key === "open" ? "ABIERTO" : st.key === "paused" ? "EN PAUSA" : "CERRADO") : " "}
              </span>
            </div>
            <div className="mt-1.5 text-[13.5px] text-p-side-text">Hoy: {todayHours}</div>
          </div>

          <Card pad={20}>
            <CardTitle>Pedidos por modalidad</CardTitle>
            <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-[5px] bg-[#EEE9E1]" aria-hidden>
              <div className="bg-p-accent" style={{ width: `${orders.length ? (dine / orders.length) * 100 : 50}%` }} />
              <div className="flex-1 bg-[#2F4A3A]" />
            </div>
            <div className="mt-3 flex justify-between text-[13.5px]">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px] bg-p-accent" />
                Comer aquí <b>{dine}</b>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px] bg-[#2F4A3A]" />
                Recoger <b>{pick}</b>
              </span>
            </div>
          </Card>
        </div>
      </div>

      <Card pad={20} className="mt-3.5">
        <CardTitle>Productos más pedidos</CardTitle>
        <div className="mt-3.5 grid gap-3">
          {top.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-[18px] font-bold text-p-muted">{i + 1}</span>
              <Thumb src={p.image} className="size-10 rounded-[9px]" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between font-semibold">
                  <Link href={`/admin/products/${p.id}`} className="truncate no-underline">
                    {p.name}
                  </Link>
                  <span className="font-medium text-p-muted">{p.sold} vendidos</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-[3px] bg-p-sep">
                  <div className="h-full rounded-[3px] bg-p-ink" style={{ width: `${(p.sold / maxSold) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
