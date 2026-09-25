"use client";

import { logout } from "@/app/admin/actions";
import { useAdmin } from "../AdminProvider";
import { Card, CardTitle, PButton, StatusPill } from "../ui";

export function AccountPage() {
  const { user, business, toast } = useAdmin();
  const published = business.products.some((p) => p.status === "published");

  return (
    <>
      <h1 className="m-0 font-pdisplay text-[34px] leading-[1.15] font-normal tracking-[-.015em]">Cuenta</h1>
      <div className="mt-5 grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-4">
        <Card>
          <div className="flex items-center gap-3.5">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#E6DFD3] text-lg font-bold">{user.initials}</div>
            <div className="min-w-0">
              <div className="text-base font-bold">{user.firstName}</div>
              <div className="truncate text-p-muted">{user.email} · Cuenta propietaria</div>
            </div>
          </div>
          <div className="mt-[18px] flex justify-between border-t border-p-sep pt-3.5">
            <span className="text-p-muted">Plan</span>
            <b>Demo</b>
          </div>
          <form action={logout}>
            <PButton type="submit" size="md" className="mt-[18px]">
              Cerrar sesión
            </PButton>
          </form>
        </Card>

        <Card>
          <CardTitle>Negocios</CardTitle>
          <div className="mt-0.5 text-[13px] text-p-muted">Cada negocio tiene su menú, marca, horarios y WhatsApp.</div>
          <div className="mt-3.5 grid gap-2">
            <div className="flex items-center gap-3 rounded-[10px] border border-p-card p-3">
              <span className="flex size-9 flex-none items-center justify-center rounded-[9px] bg-p-accent font-pdisplay text-[17px] text-white">
                {business.logoText}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{business.name}</div>
                <div className="font-mono text-xs text-p-muted">/menu/{business.slug}</div>
              </div>
              <StatusPill bg={published ? "#E3F1E7" : "#EEE9E1"} fg={published ? "#1F6B3F" : "#5C554B"}>
                {published ? "Activo" : "Borrador"}
              </StatusPill>
            </div>
            <button
              type="button"
              onClick={() => toast("Crear negocio llegará con el backend multi-negocio")}
              className="h-11 rounded-[10px] border-[1.5px] border-dashed border-p-input bg-transparent font-semibold text-p-muted"
            >
              + Crear negocio
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
