"use client";

import { useState } from "react";
import { Select, Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/money";
import { sanitizeSlug } from "@/lib/slug";
import { generateWhatsAppMessage } from "@/lib/whatsapp";
import type { Business, Currency, Settings } from "@/types";
import { useAdmin } from "../AdminProvider";
import { Card, Help, PInput, PLabel, PTextarea, PButton } from "../ui";

type Tab = "negocio" | "pedidos" | "whatsapp" | "regional";
const TABS: [Tab, string][] = [
  ["negocio", "Negocio"],
  ["pedidos", "Pedidos"],
  ["whatsapp", "WhatsApp"],
  ["regional", "Moneda e impuestos"],
];

type BizField = keyof Pick<Business, "name" | "slug" | "description" | "address" | "phone" | "whatsapp" | "instagram" | "facebook" | "maps">;
const BIZ_FIELDS: { k: BizField; label: string; ph?: string; wide?: boolean }[] = [
  { k: "name", label: "Nombre del negocio" },
  { k: "slug", label: "Slug", ph: "molienda" },
  { k: "description", label: "Descripción", wide: true },
  { k: "address", label: "Dirección", wide: true },
  { k: "phone", label: "Teléfono", ph: "668 000 0000" },
  { k: "whatsapp", label: "WhatsApp", ph: "52 + 10 dígitos" },
  { k: "instagram", label: "Instagram", ph: "@usuario" },
  { k: "facebook", label: "Facebook", ph: "facebook.com/…" },
  { k: "maps", label: "Google Maps", ph: "https://maps.google.com/…", wide: true },
];

type OrderToggle = keyof Pick<Settings, "dineIn" | "pickup" | "notesEnabled" | "scheduleEnabled" | "askGuests">;
const ORDER_TOGGLES: [OrderToggle, string, string][] = [
  ["dineIn", "Comer aquí", "El cliente indica su nombre y número de mesa."],
  ["pickup", "Recoger", "El cliente indica nombre, teléfono y hora aproximada."],
  ["notesEnabled", "Notas especiales", "Permite notas por producto y por pedido."],
  ["scheduleEnabled", "Selección de horario", "Hora aproximada de recogida."],
  ["askGuests", "Número de personas", "Pregunta cuántas personas en “Comer aquí”."],
];

const TIMEZONES: [string, string][] = [
  ["America/Mazatlan", "Mazatlán (GMT−7)"],
  ["America/Mexico_City", "Ciudad de México (GMT−6)"],
  ["America/Tijuana", "Tijuana (GMT−8)"],
  ["America/Bogota", "Bogotá (GMT−5)"],
  ["Europe/Madrid", "Madrid (GMT+1)"],
];

export function SettingsPage() {
  const { business, orders, update, toast, confirm, reset } = useAdmin();
  const [tab, setTab] = useState<Tab>("negocio");
  const s = business.settings;
  const setS = <K extends keyof Settings>(k: K, v: Settings[K], msg?: string) => update((d) => void (d.settings[k] = v), msg);

  const sample = orders[0];

  return (
    <>
      <h1 className="m-0 font-pdisplay text-[34px] leading-[1.15] font-normal tracking-[-.015em]">Configuración</h1>
      <div className="no-scrollbar mt-[18px] flex gap-1 overflow-x-auto overflow-y-hidden border-b border-p-card" role="tablist">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px h-10 border-0 border-b-2 bg-transparent px-3.5 whitespace-nowrap max-sm:px-2.5",
              tab === k ? "border-p-ink font-bold text-p-ink" : "border-transparent font-medium text-p-muted",
            )}
          >
            {k === "regional" ? (
              <>
                Moneda<span className="max-sm:hidden"> e impuestos</span>
              </>
            ) : (
              label
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 max-w-[880px]" role="tabpanel">
        {tab === "negocio" ? (
          <Card className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
            {BIZ_FIELDS.map((f) => (
              <div key={f.k} className={f.wide ? "col-span-full" : undefined}>
                <PLabel htmlFor={`biz-${f.k}`}>{f.label}</PLabel>
                <PInput
                  id={`biz-${f.k}`}
                  value={business[f.k]}
                  placeholder={f.ph}
                  mono={f.k === "slug"}
                  onChange={(e) => {
                    const v = f.k === "slug" ? sanitizeSlug(e.target.value) : e.target.value;
                    update((d) => void (d[f.k] = v));
                  }}
                  onBlur={f.k === "slug" && !business.slug.replace(/-/g, "") ? () => update((d) => void (d.slug = "mi-negocio"), "Slug restablecido") : undefined}
                />
                {f.k === "slug" ? (
                  <Help>
                    URL pública:{" "}
                    <a href={`/menu/${business.slug}`} target="_blank" rel="noopener noreferrer">
                      menu.app/menu/{business.slug}
                    </a>
                  </Help>
                ) : null}
              </div>
            ))}
          </Card>
        ) : null}

        {tab === "pedidos" ? (
          <div className="rounded-[14px] border border-p-card bg-white">
            {ORDER_TOGGLES.map(([k, label, desc]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-p-sep px-5 py-4 last:border-b-0">
                <div>
                  <div className="font-bold">{label}</div>
                  <div className="mt-0.5 text-[13px] text-p-muted">{desc}</div>
                </div>
                <Toggle
                  checked={s[k]}
                  label={label}
                  onChange={() => {
                    if ((k === "dineIn" && s.dineIn && !s.pickup) || (k === "pickup" && s.pickup && !s.dineIn)) {
                      return toast("Debe haber al menos una modalidad activa");
                    }
                    setS(k, !s[k], `${label} ${s[k] ? "desactivado" : "activado"}`);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "whatsapp" ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-4">
            <Card className="grid gap-3.5">
              <div>
                <PLabel htmlFor="wa-num">Número de WhatsApp</PLabel>
                <PInput
                  id="wa-num"
                  mono
                  inputMode="numeric"
                  value={s.whatsappNumber}
                  placeholder="52 + 10 dígitos"
                  invalid={s.whatsappNumber.length > 0 && s.whatsappNumber.length < 11}
                  onChange={(e) => setS("whatsappNumber", e.target.value.replace(/\D/g, ""))}
                  className="text-sm"
                />
                <Help>Con código de país, sin espacios. Ej. 526688124410</Help>
              </div>
              <div>
                <PLabel htmlFor="wa-greet">Mensaje inicial</PLabel>
                <PTextarea id="wa-greet" rows={2} value={s.greeting} onChange={(e) => setS("greeting", e.target.value)} />
              </div>
              <div>
                <PLabel htmlFor="wa-close">Mensaje de cierre</PLabel>
                <PTextarea id="wa-close" rows={2} value={s.closing} onChange={(e) => setS("closing", e.target.value)} />
              </div>
              <div className="text-[12.5px] leading-normal text-p-muted">
                La plantilla incluye automáticamente: negocio, número de pedido, modalidad, cliente, teléfono, mesa u hora, productos,
                variantes, extras, notas, subtotal, descuento y total.
              </div>
            </Card>
            <div>
              <div className="mb-2 font-bold">Vista previa{sample ? ` · Pedido #${pad(sample.number)}` : ""}</div>
              <div className="overflow-hidden rounded-[14px] border border-p-card">
                <div className="bg-[#0F5A36] px-3.5 py-2.5 text-[13.5px] font-bold text-white">
                  {business.name} · +{s.whatsappNumber}
                </div>
                <div className="bg-[#ECE5DD] p-3.5">
                  <div className="ml-auto max-w-[94%] rounded-[12px_2px_12px_12px] bg-[#D9FDD3] px-3 py-2.5 text-[13px] leading-[1.45] whitespace-pre-wrap text-[#111B21]">
                    {sample ? generateWhatsAppMessage(sample, business) : "Aún no hay pedidos para previsualizar."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "regional" ? (
          <Card className="grid gap-[18px]">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
              <div>
                <PLabel htmlFor="rg-cur">Moneda</PLabel>
                <Select id="rg-cur" className="w-full" value={s.currency} onChange={(e) => setS("currency", e.target.value as Currency, "Moneda actualizada")}>
                  <option value="MXN">MXN — Peso mexicano</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="COP">COP — Peso colombiano</option>
                </Select>
              </div>
              <div>
                <PLabel htmlFor="rg-tz">Zona horaria</PLabel>
                <Select id="rg-tz" className="w-full" value={s.timezone} onChange={(e) => setS("timezone", e.target.value, "Zona horaria actualizada")}>
                  {TIMEZONES.some(([v]) => v === s.timezone) ? null : <option value={s.timezone}>{s.timezone}</option>}
                  {TIMEZONES.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-p-sep pt-4">
              <div>
                <div className="font-bold">Agregar impuestos al total</div>
                <div className="text-[13px] text-p-muted">Desactívalo si tus precios ya incluyen IVA.</div>
              </div>
              <div className="flex items-center gap-2.5">
                {s.taxEnabled ? (
                  <div className="flex h-9 items-center gap-1 rounded-lg border border-p-input px-2.5 focus-within:border-p-ink">
                    <input
                      aria-label="Tasa de impuestos"
                      inputMode="decimal"
                      value={s.taxRate}
                      onChange={(e) => setS("taxRate", Math.min(100, Math.max(0, Number(e.target.value.replace(",", ".")) || 0)))}
                      className="w-9 border-0 text-right outline-none"
                    />
                    <span className="text-p-muted">%</span>
                  </div>
                ) : null}
                <Toggle
                  checked={s.taxEnabled}
                  label="Agregar impuestos al total"
                  onChange={(v) => setS("taxEnabled", v, v ? "Impuestos activados" : "Impuestos desactivados")}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-p-sep pt-4">
              <div>
                <div className="font-bold">Restablecer datos demo</div>
                <div className="text-[13px] text-p-muted">Vuelve al menú, horarios y apariencia originales.</div>
              </div>
              <PButton
                variant="danger"
                size="md"
                className="h-9 rounded-lg"
                onClick={async () => {
                  const ok = await confirm({
                    title: "¿Restablecer datos demo?",
                    text: "Se perderán los cambios hechos en menú, horarios, apariencia y pedidos.",
                    label: "Restablecer",
                  });
                  if (ok) await reset();
                }}
              >
                Restablecer
              </PButton>
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
