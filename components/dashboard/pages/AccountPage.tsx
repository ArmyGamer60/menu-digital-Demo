"use client";

import Link from "next/link";
import { useState } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/admin/(panel)/account";
import { logout, selectBusiness } from "@/app/admin/actions";
import { MIN_PASSWORD } from "@/lib/password";
import { useAdmin } from "../AdminProvider";
import { Card, CardTitle, PButton, PInput, PLabel, StatusPill } from "../ui";

export function AccountPage() {
  const { user, business, businesses, toast } = useAdmin();
  const [name, setName] = useState(user.name);
  const [pw, setPw] = useState({ current: "", next: "", repeat: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    if (name.trim() === user.name) return;
    const r = await updateProfileAction(name.trim());
    toast(r.error ?? "Nombre actualizado");
  };

  const savePassword = async () => {
    if (pw.next !== pw.repeat) return setPwError("Las contraseñas nuevas no coinciden.");
    if (pw.next.length < MIN_PASSWORD) return setPwError(`Usa al menos ${MIN_PASSWORD} caracteres.`);
    setBusy(true);
    const r = await changePasswordAction(pw.current, pw.next).catch(() => ({ error: "No se pudo cambiar la contraseña." }));
    setBusy(false);
    setPwError(r.error ?? null);
    if (!r.error) {
      setPw({ current: "", next: "", repeat: "" });
      toast("Contraseña actualizada");
    }
  };

  return (
    <>
      <h1 className="m-0 font-pdisplay text-[34px] leading-[1.15] font-normal tracking-[-.015em]">Cuenta</h1>
      <div className="mt-5 grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-4">
        <div className="grid gap-4">
          <Card>
            <div className="flex items-center gap-3.5">
              <div className="flex size-14 flex-none items-center justify-center rounded-full bg-[#E6DFD3] text-lg font-bold">{user.initials}</div>
              <div className="min-w-0">
                <div className="text-base font-bold">{user.name || user.firstName}</div>
                <div className="truncate text-p-muted">
                  {user.email} · {user.isSuperadmin ? "Administrador de la plataforma" : "Cuenta propietaria"}
                </div>
              </div>
            </div>
            <div className="mt-[18px] border-t border-p-sep pt-3.5">
              <PLabel htmlFor="acc-name">Nombre</PLabel>
              <PInput id="acc-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => void saveName()} placeholder="Tu nombre" />
            </div>
            <form action={logout}>
              <PButton type="submit" size="md" className="mt-[18px]">
                Cerrar sesión
              </PButton>
            </form>
          </Card>

          <Card>
            <CardTitle>Cambiar contraseña</CardTitle>
            <form
              className="mt-3 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void savePassword();
              }}
            >
              <div>
                <PLabel htmlFor="pw-cur">Contraseña actual</PLabel>
                <PInput
                  id="pw-cur"
                  type="password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                />
              </div>
              <div>
                <PLabel htmlFor="pw-new">Nueva contraseña</PLabel>
                <PInput id="pw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </div>
              <div>
                <PLabel htmlFor="pw-rep">Repite la nueva contraseña</PLabel>
                <PInput
                  id="pw-rep"
                  type="password"
                  autoComplete="new-password"
                  value={pw.repeat}
                  onChange={(e) => setPw({ ...pw, repeat: e.target.value })}
                />
              </div>
              {pwError ? (
                <div role="alert" className="text-[13px] font-semibold text-danger">
                  {pwError}
                </div>
              ) : null}
              <div>
                <PButton type="submit" variant="primary" size="md" disabled={busy || !pw.current || !pw.next}>
                  {busy ? "Guardando…" : "Actualizar contraseña"}
                </PButton>
              </div>
            </form>
          </Card>
        </div>

        <Card>
          <CardTitle>Negocios</CardTitle>
          <div className="mt-0.5 text-[13px] text-p-muted">Cada negocio tiene su menú, marca, horarios y WhatsApp.</div>
          <div className="mt-3.5 grid gap-2">
            {businesses.map((b) => {
              const on = b.id === business.id;
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-[10px] border border-p-card p-3">
                  <span className="flex size-9 flex-none items-center justify-center rounded-[9px] bg-p-accent font-pdisplay text-[17px] text-white">
                    {b.logoText}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{b.name}</div>
                    <div className="truncate font-mono text-xs text-p-muted">/menu/{b.slug}</div>
                  </div>
                  {on ? (
                    <StatusPill bg="#E3F1E7" fg="#1F6B3F">
                      Actual
                    </StatusPill>
                  ) : (
                    <form action={selectBusiness.bind(null, b.id, "/admin")}>
                      <PButton type="submit" size="sm">
                        Abrir
                      </PButton>
                    </form>
                  )}
                </div>
              );
            })}
            {user.isSuperadmin ? (
              <Link
                href="/admin/negocios"
                className="flex h-11 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-p-input font-semibold text-p-muted no-underline hover:!text-p-ink"
              >
                Administrar negocios
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}
