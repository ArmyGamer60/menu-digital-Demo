"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Toggle } from "@/components/ui";
import { FONT_PAIRS, PALETTES } from "@/data/seed";
import { cn } from "@/lib/cn";
import { fontPairFamilies } from "@/lib/theme";
import type { Business, CardStyle, FontPair, Layout, Theme } from "@/types";
import { useAdmin } from "../AdminProvider";
import { Card, CardTitle, PInput, PLabel, PageHeader, Thumb } from "../ui";

const MAX_UPLOAD = 400_000;
type BrandSlot = "logoImage" | "logoAlt" | "favicon";
const SLOTS: [BrandSlot, string][] = [
  ["logoImage", "Logo"],
  ["logoAlt", "Logo alternativo"],
  ["favicon", "Favicon"],
];
const COLOR_FIELDS: [keyof Pick<Theme, "primary" | "secondary" | "accent" | "background" | "text">, string][] = [
  ["primary", "Color principal"],
  ["secondary", "Color secundario"],
  ["accent", "Color de acento"],
  ["background", "Color de fondo"],
  ["text", "Color de texto"],
];
const CARDS: [CardStyle, string][] = [
  ["minimal", "Minimal"],
  ["rounded", "Rounded"],
  ["editorial", "Editorial"],
  ["image-heavy", "Image-heavy"],
  ["compact", "Compact"],
  ["premium", "Premium"],
];
const LAYOUTS: [Layout, string, number, number][] = [
  ["grid", "Grid", 2, 4],
  ["list", "Lista", 1, 3],
  ["large", "Cards grandes", 1, 2],
  ["compact", "Compactas", 1, 5],
];
const HEX_RE = /^#[0-9a-f]{6}$/i;

const tile = (on: boolean) => cn("cursor-pointer rounded-[10px] border-[1.5px] p-2.5 text-left", on ? "border-p-ink bg-p-row" : "border-p-card bg-white");

function CardThumb({ k }: { k: CardStyle }) {
  const surface = k === "rounded" || k === "compact" || k === "premium";
  const radius = { minimal: 6, rounded: 12, editorial: 1, "image-heavy": 8, compact: 6, premium: 0 }[k];
  return (
    <span
      className="block overflow-hidden"
      style={{
        background: surface ? "#fff" : "transparent",
        border: k === "premium" || k === "compact" ? "1px solid #D6D1C8" : "none",
        borderRadius: radius,
        boxShadow: k === "rounded" ? "0 3px 10px rgba(0,0,0,.08)" : "none",
      }}
    >
      <span
        className="block bg-[linear-gradient(135deg,#C9A58A,#8E5B3E)]"
        style={{ height: k === "image-heavy" ? 64 : k === "compact" ? 30 : 44, borderRadius: k === "minimal" ? 5 : 0 }}
      />
      <span className="mx-1.5 mt-1.5 block h-[5px] w-[70%] rounded-[3px] bg-p-ink" />
      <span className="mx-1.5 mt-1 mb-1.5 block h-1 w-[40%] rounded-sm bg-[#B8B1A6]" />
    </span>
  );
}

/** Vista previa en vivo: iframe del menú real. Se actualiza solo vía evento `storage` al guardar. */
function LivePreview({ business }: { business: Business }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const src = `/menu/${business.slug}`;
  const scale = w / 1280;

  return (
    <div className="min-w-0 min-[1150px]:sticky min-[1150px]:top-0">
      <div className="mb-2.5 flex items-center justify-between">
        <b>Vista previa en vivo</b>
        <div className="flex rounded-[9px] bg-[#EAE6DF] p-[3px]" role="tablist" aria-label="Dispositivo">
          {(["mobile", "desktop"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={cn("h-7 rounded-[7px] border-0 px-3 text-[12.5px] font-semibold", mode === k ? "bg-white" : "bg-transparent")}
            >
              {k === "mobile" ? "Móvil" : "Desktop"}
            </button>
          ))}
        </div>
      </div>
      <div ref={boxRef}>
        {mode === "mobile" ? (
          <div className="mx-auto h-[760px] w-full max-w-[390px] overflow-hidden rounded-[36px] border-[10px] border-p-side bg-white shadow-[0_20px_50px_rgba(0,0,0,.15)]">
            <iframe src={src} title="Vista previa del menú (móvil)" className="block size-full border-0" />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-p-card bg-white" style={{ height: Math.max(w, 320) * 0.75 }}>
            <iframe
              src={src}
              title="Vista previa del menú (desktop)"
              className="absolute top-0 left-0 border-0"
              style={{ width: 1280, height: 960, transform: `scale(${scale})`, transformOrigin: "0 0" }}
            />
          </div>
        )}
      </div>
      <a href={src} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-block text-[13px] font-semibold">
        Abrir en una pestaña nueva
      </a>
    </div>
  );
}

export function AppearancePage() {
  const { business, update, toast } = useAdmin();
  const t = business.theme;
  const setTheme = <K extends keyof Theme>(k: K, v: Theme[K], msg?: string) => update((d) => void (d.theme[k] = v), msg);
  const setBiz = (k: "logoText" | "name" | "tagline", v: string) => update((d) => void (d[k] = v));

  const onFile = (slot: BrandSlot, label: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Sube un archivo de imagen");
    if (f.size > MAX_UPLOAD) return toast("Usa una imagen menor a 400 KB");
    const r = new FileReader();
    r.onload = () => update((d) => void (d[slot] = String(r.result)), `${label} actualizado`);
    r.readAsDataURL(f);
  };

  return (
    <>
      <PageHeader title="Apariencia" sub="Los cambios se guardan y se ven al instante en el menú público." />

      <div className="mt-5 grid items-start gap-5 min-[1150px]:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 gap-4">
          <Card>
            <CardTitle className="mb-3.5">Branding</CardTitle>
            <div className="grid grid-cols-3 gap-2.5">
              {SLOTS.map(([k, label]) => {
                const src = business[k];
                return (
                  <div key={k} className="relative">
                    <label className="flex aspect-[2.2] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-[1.5px] border-dashed border-p-input p-2 text-center text-[12.5px] text-p-muted hover:border-p-ink focus-within:border-p-ink">
                      {src ? (
                        <Thumb src={src} className="h-[55%] w-[70%] bg-transparent bg-contain bg-no-repeat" />
                      ) : (
                        <Plus size={20} strokeWidth={1.6} aria-hidden />
                      )}
                      <span className="font-semibold text-p-soft">{label}</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={onFile(k, label)} />
                    </label>
                    {src ? (
                      <button
                        type="button"
                        aria-label={`Quitar ${label.toLowerCase()}`}
                        onClick={() => update((d) => void delete d[k], `${label} eliminado`)}
                        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border border-p-card bg-white"
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-3.5 grid grid-cols-[90px_minmax(0,1fr)] gap-3">
              <div>
                <PLabel htmlFor="ap-mono">Monograma</PLabel>
                <PInput
                  id="ap-mono"
                  maxLength={2}
                  value={business.logoText}
                  onChange={(e) => setBiz("logoText", e.target.value)}
                  className="text-center font-pdisplay text-lg"
                />
              </div>
              <div>
                <PLabel htmlFor="ap-name">Nombre</PLabel>
                <PInput id="ap-name" value={business.name} onChange={(e) => setBiz("name", e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <PLabel htmlFor="ap-tag">Subtítulo</PLabel>
              <PInput id="ap-tag" value={business.tagline} onChange={(e) => setBiz("tagline", e.target.value)} />
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Colores</CardTitle>
            <div className="mb-4 flex flex-wrap gap-2">
              {PALETTES.map((p) => {
                const on = t.primary === p.primary && t.background === p.background;
                return (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    aria-pressed={on}
                    onClick={() =>
                      update(
                        (d) =>
                          void Object.assign(d.theme, { primary: p.primary, secondary: p.secondary, accent: p.accent, background: p.background, text: p.text }),
                        `Paleta ${p.name}`,
                      )
                    }
                    className={cn(tile(on), "w-24")}
                  >
                    <span className="flex h-[22px] overflow-hidden rounded-md">
                      {[p.background, p.primary, p.secondary, p.accent].map((c) => (
                        <span key={c} className="flex-1" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="mt-1.5 block text-xs font-semibold">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-2.5">
              {COLOR_FIELDS.map(([k, label]) => (
                <ColorField key={k} label={label} value={t[k]} onChange={(v) => setTheme(k, v)} />
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Tipografía</CardTitle>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {(Object.keys(FONT_PAIRS) as FontPair[]).map((k) => (
                <button key={k} type="button" aria-pressed={t.fontPair === k} onClick={() => setTheme("fontPair", k, `Tipografía ${FONT_PAIRS[k].label}`)} className={tile(t.fontPair === k)}>
                  <span className="block text-[30px] leading-none" style={{ fontFamily: fontPairFamilies(k).display }}>
                    Aa
                  </span>
                  <span className="mt-1 block text-[12.5px] font-bold">{FONT_PAIRS[k].label}</span>
                  <span className="block text-[11px] text-p-muted">
                    {FONT_PAIRS[k].display} + {FONT_PAIRS[k].body}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Estilo de tarjetas</CardTitle>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {CARDS.map(([k, label]) => (
                <button key={k} type="button" aria-pressed={t.cardStyle === k} onClick={() => setTheme("cardStyle", k, `Tarjetas: ${label}`)} className={tile(t.cardStyle === k)}>
                  <CardThumb k={k} />
                  <span className="mt-2 block text-[12.5px] font-bold">{label}</span>
                </button>
              ))}
            </div>
            <CardTitle className="mt-5 mb-3">Layout</CardTitle>
            <div className="grid grid-cols-4 gap-2">
              {LAYOUTS.map(([k, label, cols, n]) => (
                <button key={k} type="button" aria-pressed={t.layout === k} onClick={() => setTheme("layout", k, `Layout: ${label}`)} className={tile(t.layout === k)}>
                  <span className="grid h-11 content-start gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
                    {Array.from({ length: n }, (_, i) => (
                      <span key={i} className="block rounded-[2px] bg-[#C9BFB2]" style={{ height: k === "compact" ? 6 : k === "list" ? 12 : 20 }} />
                    ))}
                  </span>
                  <span className="mt-2 block text-[12.5px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hero</CardTitle>
                <div className="text-[12.5px] text-p-muted">Banner principal del menú.</div>
              </div>
              <Toggle
                checked={t.heroEnabled}
                label="Mostrar hero"
                onChange={(v) => setTheme("heroEnabled", v, v ? "Hero activado" : "Hero desactivado")}
              />
            </div>
            {t.heroEnabled ? (
              <div className="mt-3.5 grid gap-2.5">
                <PInput aria-label="Título del hero" value={t.heroTitle} onChange={(e) => setTheme("heroTitle", e.target.value)} placeholder="Título" />
                <PInput aria-label="Mensaje del hero" value={t.heroText} onChange={(e) => setTheme("heroText", e.target.value)} placeholder="Mensaje" />
                <PInput
                  aria-label="Imagen del hero (URL)"
                  value={t.heroImage}
                  onChange={(e) => setTheme("heroImage", e.target.value)}
                  placeholder="URL de imagen"
                  className="text-[12.5px]"
                />
              </div>
            ) : null}
          </Card>
        </div>

        <LivePreview business={business} />
      </div>
    </>
  );
}

/** Selector de color + hex. El hex se guarda solo cuando es válido (#RRGGBB). */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const id = `color-${label.replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        aria-label={label}
        value={HEX_RE.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="size-10 cursor-pointer rounded-[9px] border border-p-input bg-white p-0"
      />
      <label htmlFor={id} className="flex-1 font-semibold">
        {label}
      </label>
      <PInput
        id={id}
        mono
        value={text}
        invalid={!HEX_RE.test(text)}
        onChange={(e) => {
          const v = e.target.value.trim();
          setText(v);
          if (HEX_RE.test(v)) onChange(v.toUpperCase());
        }}
        className="h-9 w-[100px] rounded-lg px-2.5 text-[12.5px]"
      />
    </div>
  );
}
