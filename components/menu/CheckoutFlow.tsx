"use client";

import { Check, ChevronLeft, Handbag, MessageCircle, Minus, Plus, Utensils } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Chip, Field, IconButton, Input, Textarea, useScrollLock } from "@/components/ui";
import { validateCheckout, type CheckoutErrors, type CheckoutForm } from "@/lib/checkout";
import { cn } from "@/lib/cn";
import { zonedTime } from "@/lib/hours";
import { money as fmt, pad } from "@/lib/money";
import type { CartTotals } from "@/lib/pricing";
import { generateWhatsAppMessage, openWhatsApp, whatsappUrl } from "@/lib/whatsapp";
import type { Business, CartLine, OrderDraft, OrderMode } from "@/types";
import { BusinessLogo } from "./MenuHeader";

export type CheckoutStep = "mode" | "info" | "confirm" | "sent";

const STEP_TITLE: Record<CheckoutStep, string> = {
  mode: "Paso 1 de 3 · Modalidad",
  info: "Paso 2 de 3 · Tus datos",
  confirm: "Paso 3 de 3 · Confirmación",
  sent: "Pedido enviado",
};
const STEP_IDX: Record<CheckoutStep, number> = { mode: 0, info: 1, confirm: 2, sent: 3 };

const PICKUP_CHOICES: [CheckoutForm["pickupChoice"], string][] = [
  ["asap", "Lo antes posible"],
  ["30", "En 30 min"],
  ["60", "En 1 hora"],
  ["custom", "Elegir hora"],
];

export interface CheckoutFlowProps {
  business: Business;
  lines: CartLine[];
  totals: CartTotals;
  step: CheckoutStep | null;
  onStepChange: (step: CheckoutStep | null) => void;
  /** ?mesa=N del QR. */
  tableFromQr: string;
  /** Atrás desde "Modalidad" → reabre el carrito. */
  onBackToCart: () => void;
  /** Se llama al enviar: registrar pedido y vaciar carrito. */
  onSent: (draft: OrderDraft) => void;
}

const emptyForm: CheckoutForm = { name: "", phone: "", table: "", guests: 2, pickupChoice: "asap", pickupTime: "", notes: "" };

export function CheckoutFlow({ business, lines, totals, step, onStepChange, tableFromQr, onBackToCart, onSent }: CheckoutFlowProps) {
  const s = business.settings;
  const m = (n: number) => fmt(n, s.currency);
  const [mode, setMode] = useState<OrderMode | null>(null);
  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [sent, setSent] = useState<{ num: string; message: string; url: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollLock(step !== null);

  useEffect(() => {
    if (tableFromQr) setForm((f) => ({ ...f, table: tableFromQr }));
  }, [tableFromQr]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const modesOn = useMemo(
    () => (["dinein", "pickup"] as const).filter((k) => (k === "dinein" ? s.dineIn : s.pickup)),
    [s.dineIn, s.pickup],
  );
  // Solo una modalidad activa → preseleccionada. Con ?mesa= se sugiere "Comer aquí".
  const effectiveMode: OrderMode | null =
    mode && modesOn.includes(mode)
      ? mode
      : modesOn.length === 1
        ? modesOn[0]!
        : tableFromQr && modesOn.includes("dinein")
          ? "dinein"
          : null;
  const pickup = effectiveMode === "pickup";

  const pickupTimeValue = () => {
    const now = new Date();
    const add = (min: number) => zonedTime(now, s.timezone, min);
    if (form.pickupChoice === "asap") return `Lo antes posible (~${add(15)})`;
    if (form.pickupChoice === "30") return add(30);
    if (form.pickupChoice === "60") return add(60);
    return form.pickupTime || "Por confirmar";
  };

  const nextNumber = business.orderCounter + 1;

  const buildDraft = (): OrderDraft => ({
    number: nextNumber,
    mode: effectiveMode ?? "pickup",
    customer: {
      name: form.name.trim(),
      phone: pickup ? form.phone.trim() : "",
      table: pickup ? null : form.table.trim(),
      guests: !pickup && s.askGuests ? form.guests : null,
      pickupTime: pickup && s.scheduleEnabled ? pickupTimeValue() : null,
    },
    items: lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, unit: l.unit, mods: l.mods, notes: l.notes })),
    notes: s.notesEnabled ? form.notes.trim() : "",
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
  });

  const set = (k: keyof CheckoutForm) => (value: string) => {
    setForm((f) => ({ ...f, [k]: value }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const next = () => {
    if (step === "mode") {
      if (effectiveMode) {
        setMode(effectiveMode);
        onStepChange("info");
      }
      return;
    }
    if (step === "info" && effectiveMode) {
      const e = validateCheckout(effectiveMode, form);
      setErrors(e);
      if (!Object.keys(e).length) {
        setShowPreview(false);
        onStepChange("confirm");
      }
    }
  };

  const back = () => {
    if (step === "mode") {
      onStepChange(null);
      onBackToCart();
    } else if (step === "info") onStepChange("mode");
    else if (step === "confirm") onStepChange("info");
  };

  const send = () => {
    const draft = buildDraft();
    const message = generateWhatsAppMessage(draft, business);
    const url = whatsappUrl(s.whatsappNumber, message);
    openWhatsApp(message, s.whatsappNumber); // síncrono dentro del click (pop-up blockers)
    setSent({ num: pad(draft.number), message, url });
    onSent(draft);
    onStepChange("sent");
  };

  const finish = () => {
    onStepChange(null);
    setSent(null);
    setMode(null);
    setForm((f) => ({ ...f, notes: "" }));
    window.scrollTo({ top: 0 });
  };

  if (!step) return null;
  const idx = STEP_IDX[step];

  const confirmRows: [string, string][] =
    step === "confirm"
      ? [
          ["Modalidad", pickup ? "Recoger" : "Comer aquí"],
          ["Cliente", form.name.trim()],
          ...(pickup ? ([["Teléfono", form.phone.trim()]] as [string, string][]) : ([["Mesa", form.table.trim()]] as [string, string][])),
          ...(!pickup && s.askGuests ? ([["Personas", String(form.guests)]] as [string, string][]) : []),
          ...(pickup && s.scheduleEnabled ? ([["Recoger", pickupTimeValue()]] as [string, string][]) : []),
          ...(form.notes.trim() && s.notesEnabled ? ([["Notas", form.notes.trim()]] as [string, string][]) : []),
        ]
      : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={STEP_TITLE[step]}
      className="fixed inset-0 z-[80] flex animate-rise-fast flex-col bg-bg text-ink"
    >
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[620px] items-center gap-3 px-4 py-3">
          {step !== "sent" ? (
            <IconButton aria-label="Atrás" onClick={back}>
              <ChevronLeft size={18} strokeWidth={2} />
            </IconButton>
          ) : null}
          <div className="min-h-11 flex-1 content-center text-base font-bold">{STEP_TITLE[step]}</div>
          {step !== "sent" ? (
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn("h-2 rounded-[4px] transition-all duration-250", i === idx ? "w-[22px]" : "w-2", i <= idx ? "bg-brand" : "bg-line-strong")}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[620px] px-4 pt-6 pb-10">
          {step === "mode" ? (
            <ModeStep modes={modesOn} selected={effectiveMode} onPick={setMode} />
          ) : null}

          {step === "info" ? (
            <>
              <StepTitle>{pickup ? "Datos para recoger" : "Datos de tu mesa"}</StepTitle>
              <div className="mt-2 text-[15px] text-muted">
                {pickup ? "Te avisaremos por WhatsApp cuando esté listo." : "Llevaremos tu pedido a la mesa."}
              </div>
              <form
                noValidate
                className="mt-6 grid gap-[18px]"
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <Field label="Nombre" htmlFor="co-name" error={errors.name}>
                  <Input id="co-name" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="¿A nombre de quién?" autoComplete="name" invalid={!!errors.name} />
                </Field>

                {!pickup ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número de mesa" htmlFor="co-table" error={errors.table}>
                      <Input id="co-table" value={form.table} onChange={(e) => set("table")(e.target.value)} inputMode="numeric" placeholder="Ej. 7" invalid={!!errors.table} />
                    </Field>
                    {s.askGuests ? (
                      <Field label="Personas" hint="(opcional)">
                        <div className="flex h-[52px] items-center justify-between rounded-[14px] border border-line-strong bg-surface px-1">
                          <button type="button" aria-label="Menos personas" onClick={() => setForm((f) => ({ ...f, guests: Math.max(1, f.guests - 1) }))} className="flex size-11 items-center justify-center border-0 bg-transparent">
                            <Minus size={18} strokeWidth={2} />
                          </button>
                          <span className="font-bold" aria-live="polite">{form.guests}</span>
                          <button type="button" aria-label="Más personas" onClick={() => setForm((f) => ({ ...f, guests: Math.min(20, f.guests + 1) }))} className="flex size-11 items-center justify-center border-0 bg-transparent">
                            <Plus size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </Field>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <Field label="Teléfono" htmlFor="co-phone" error={errors.phone}>
                      <Input id="co-phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="10 dígitos" invalid={!!errors.phone} />
                    </Field>
                    {s.scheduleEnabled ? (
                      <div>
                        <div className="mb-2 block text-sm font-bold">Hora aproximada de recogida</div>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Hora aproximada de recogida">
                          {PICKUP_CHOICES.map(([k, label]) => (
                            <Chip key={k} kind="choice" active={form.pickupChoice === k} onClick={() => setForm((f) => ({ ...f, pickupChoice: k }))}>
                              {label}
                            </Chip>
                          ))}
                        </div>
                        {form.pickupChoice === "custom" ? (
                          <Input type="time" aria-label="Hora de recogida" value={form.pickupTime} onChange={(e) => set("pickupTime")(e.target.value)} className="mt-2.5 max-w-[200px]" />
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}

                {s.notesEnabled ? (
                  <Field label="Notas del pedido" hint="(opcional)" htmlFor="co-notes">
                    <Textarea id="co-notes" rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Alergias, cubiertos, algo que debamos saber" />
                  </Field>
                ) : null}
                <button type="submit" hidden />
              </form>
            </>
          ) : null}

          {step === "confirm" ? (
            <>
              <StepTitle>Revisa tu pedido</StepTitle>
              <div className="mt-5 overflow-hidden rounded-[18px] border border-line bg-surface">
                <div className="flex items-baseline justify-between border-b border-dashed border-line-strong px-5 py-[18px]">
                  <div className="text-xs font-bold tracking-[.1em] text-muted uppercase">Pedido</div>
                  <div className="font-display text-[26px]">#{pad(nextNumber)}</div>
                </div>
                <div className="px-5 py-1.5">
                  {lines.map((l) => (
                    <div key={l.id} className="flex gap-3 border-b border-line py-3">
                      <span className="min-w-[26px] font-bold">{l.qty}×</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{l.name}</div>
                        {l.mods.length ? <div className="text-[13px] text-muted">{l.mods.join(" · ")}</div> : null}
                        {l.notes ? <div className="text-[13px] text-muted italic">“{l.notes}”</div> : null}
                      </div>
                      <span className="tabular font-semibold">{m(l.unit * l.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 border-b border-dashed border-line-strong px-5 py-3.5 text-[14.5px]">
                  {confirmRows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-muted">{k}</span>
                      <span className="text-right font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-1.5 px-5 pt-3.5 pb-[18px] text-[14.5px]">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span>{m(totals.subtotal)}</span>
                  </div>
                  {totals.applied.map((a) => (
                    <div key={a.name} className="flex justify-between text-brand2">
                      <span>{a.name}</span>
                      <span>−{m(a.amount)}</span>
                    </div>
                  ))}
                  {totals.tax > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted">Impuestos ({s.taxRate}%)</span>
                      <span>{m(totals.tax)}</span>
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>{m(totals.total)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-expanded={showPreview}
                onClick={() => setShowPreview((v) => !v)}
                className="mt-3.5 border-0 bg-transparent px-0 py-2 text-sm font-semibold underline underline-offset-[3px]"
              >
                {showPreview ? "Ocultar mensaje" : "Ver el mensaje que se enviará"}
              </button>
              {showPreview ? (
                <pre className="mt-1.5 mb-0 animate-[rise_.2s] rounded-[14px] bg-[#E4F3E6] p-4 font-mono text-[12.5px] leading-normal whitespace-pre-wrap text-[#10301A]">
                  {generateWhatsAppMessage(buildDraft(), business)}
                </pre>
              ) : null}
            </>
          ) : null}

          {step === "sent" && sent ? <SentStep business={business} sent={sent} /> : null}
        </div>
      </div>

      <div className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[620px] px-4 pt-3.5 pb-[max(18px,env(safe-area-inset-bottom))]">
          {step === "mode" || step === "info" ? (
            <Button size="lg" block onClick={next} variant={step === "mode" && !effectiveMode ? "disabled" : "brand"} aria-disabled={step === "mode" && !effectiveMode}>
              {step === "mode" ? (effectiveMode ? "Continuar" : "Elige una opción") : "Revisar pedido"}
            </Button>
          ) : null}
          {step === "confirm" ? (
            <>
              <Button variant="whatsapp" size="xl" block onClick={send} className="rounded-[29px]">
                <MessageCircle size={20} strokeWidth={1.9} aria-hidden />
                Enviar pedido por WhatsApp
              </Button>
              <div className="mt-2.5 text-center text-[13px] text-muted">Tu pedido se enviará directamente al WhatsApp del negocio.</div>
            </>
          ) : null}
          {step === "sent" && sent ? (
            <div className="grid gap-2.5">
              <a
                href={sent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[54px] items-center justify-center rounded-[27px] bg-wa font-bold text-white no-underline hover:opacity-100"
              >
                Abrir WhatsApp otra vez
              </a>
              <button type="button" onClick={finish} className="h-[54px] rounded-[27px] border border-ink bg-transparent font-bold">
                Volver al menú
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h1 className="m-0 font-display text-[34px] leading-[1.02] font-normal tracking-[-.015em] text-balance">{children}</h1>;
}

function ModeStep({ modes, selected, onPick }: { modes: OrderMode[]; selected: OrderMode | null; onPick: (m: OrderMode) => void }) {
  return (
    <>
      <StepTitle>¿Cómo quieres recibir tu pedido?</StepTitle>
      <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Modalidad">
        {modes.map((k) => {
          const sel = selected === k;
          const dine = k === "dinein";
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onPick(k)}
              className={cn(
                "flex min-h-[112px] w-full items-center gap-4 rounded-[var(--mode-r)] border-2 px-5 py-[22px] transition-all duration-150",
                sel ? "border-brand bg-[color-mix(in_oklab,var(--brand)_8%,var(--surface))]" : "border-line-strong bg-surface",
              )}
            >
              <div
                className={cn(
                  "flex size-14 flex-none items-center justify-center rounded-2xl transition-all duration-150",
                  sel ? "bg-brand text-on-brand" : "bg-img-bg text-ink",
                )}
              >
                {dine ? <Utensils size={26} strokeWidth={1.7} /> : <Handbag size={26} strokeWidth={1.7} />}
              </div>
              <div className="flex-1 text-left">
                <div className="font-display text-2xl leading-[1.05]">{dine ? "Comer aquí" : "Recoger"}</div>
                <div className="mt-1 text-sm text-muted">{dine ? "Te llevamos el pedido a tu mesa." : "Pasa por él al mostrador cuando esté listo."}</div>
              </div>
              <span
                aria-hidden
                className={cn(
                  "flex size-[26px] flex-none items-center justify-center rounded-full border-2",
                  sel ? "border-brand bg-brand" : "border-line-strong bg-transparent",
                )}
              >
                {sel ? <span className="size-2.5 rounded-full bg-on-brand" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function SentStep({ business, sent }: { business: Business; sent: { num: string; message: string } }) {
  return (
    <>
      <div className="animate-[rise_.35s_ease-out] pt-3 text-center">
        <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-wa text-white">
          <Check size={32} strokeWidth={2.4} />
        </div>
        <h1 className="mt-[18px] mb-0 font-display text-[34px] leading-[1.05] font-normal">Pedido #{sent.num} listo</h1>
        <p className="mx-auto mt-2.5 mb-0 max-w-[380px] text-[15px] leading-normal text-muted">
          Abrimos WhatsApp con tu pedido. Solo presiona enviar para que {business.name} lo reciba.
        </p>
      </div>
      <div className="mt-[26px] overflow-hidden rounded-[18px] border border-line">
        <div className="flex items-center gap-2.5 bg-[#0F5A36] px-4 py-3 text-white">
          <BusinessLogo business={business} size={34} fontSize={16} />
          <div>
            <div className="text-[14.5px] font-bold">{business.name}</div>
            <div className="text-xs opacity-80">+{business.settings.whatsappNumber}</div>
          </div>
        </div>
        <div className="bg-[#ECE5DD] p-4">
          <div className="ml-auto max-w-[92%] rounded-[12px_2px_12px_12px] bg-[#D9FDD3] px-3 pt-2.5 pb-2 text-[13.5px] leading-[1.45] whitespace-pre-wrap text-[#111B21] shadow-[0_1px_1px_rgba(0,0,0,.08)]">
            {sent.message}
          </div>
        </div>
      </div>
    </>
  );
}
