"use client";

import { X } from "lucide-react";
import { Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toMin } from "@/lib/hours";
import type { ManualState } from "@/types";
import { useAdmin } from "../AdminProvider";
import { IconBtn, PageHeader, PButton } from "../ui";

const MANUAL: { key: ManualState; label: string; desc: string; color: string }[] = [
  { key: "auto", label: "Automático", desc: "Según el horario semanal.", color: "#1F4E79" },
  { key: "open", label: "Abierto", desc: "Recibiendo pedidos.", color: "#2E8B57" },
  { key: "closed", label: "Cerrado", desc: "El menú muestra “Estamos cerrados”.", color: "#B3261E" },
  { key: "paused", label: "Pausar pedidos", desc: "Menú visible, sin pedidos.", color: "#D08A1E" },
];

const timeInput = "h-9 rounded-lg border border-p-input bg-white px-2.5 outline-none focus:border-p-ink";

export function HoursPage() {
  const { business, update } = useAdmin();
  const manual = business.settings.manualState;

  const setRange = (hi: number, ri: number, which: 0 | 1, value: string) =>
    update((d) => {
      const r = d.hours[hi]?.ranges[ri];
      if (r && value) r[which] = value;
    });

  return (
    <>
      <PageHeader title="Horarios" sub="El estado manual tiene prioridad sobre el horario semanal." />

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]" role="radiogroup" aria-label="Estado manual">
        {MANUAL.map((s) => {
          const on = manual === s.key;
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => !on && update((d) => void (d.settings.manualState = s.key), `Estado: ${s.label}`)}
              className={cn(
                "rounded-xl border-[1.5px] p-4 text-left",
                on ? "border-p-ink bg-white shadow-[0_4px_14px_rgba(0,0,0,.06)]" : "border-p-card bg-p-row",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                <b className="text-[15px]">{s.label}</b>
              </div>
              <div className="mt-1.5 text-[12.5px] text-p-muted">{s.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-[18px] max-w-[900px] rounded-[14px] border border-p-card bg-white">
        {business.hours.map((h, hi) => {
          const invalid = h.ranges.some((r) => toMin(r[1]) <= toMin(r[0]));
          return (
            <div key={h.day} className="flex flex-wrap items-start gap-4 border-b border-p-sep px-5 py-4 last:border-b-0">
              <div className="flex h-9 w-[170px] items-center gap-3">
                <Toggle
                  checked={h.active}
                  label={`${h.label} abierto`}
                  onChange={() => update((d) => void (d.hours[hi]!.active = !d.hours[hi]!.active), `${h.label}: ${h.active ? "cerrado" : "abierto"}`)}
                />
                <b className="font-bold">{h.label}</b>
              </div>
              <div className="grid min-w-[260px] flex-1 gap-2">
                {!h.active ? (
                  <div className="flex h-9 items-center text-p-muted">Cerrado</div>
                ) : (
                  h.ranges.map((r, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <input
                        type="time"
                        aria-label={`${h.label}, horario ${ri + 1}: desde`}
                        value={r[0]}
                        onChange={(e) => setRange(hi, ri, 0, e.target.value)}
                        className={timeInput}
                      />
                      <span className="text-p-muted">a</span>
                      <input
                        type="time"
                        aria-label={`${h.label}, horario ${ri + 1}: hasta`}
                        value={r[1]}
                        onChange={(e) => setRange(hi, ri, 1, e.target.value)}
                        className={cn(timeInput, toMin(r[1]) <= toMin(r[0]) && "border-danger")}
                      />
                      {h.ranges.length > 1 ? (
                        <IconBtn
                          aria-label={`Quitar horario ${ri + 1} de ${h.label}`}
                          danger
                          onClick={() => update((d) => void d.hours[hi]!.ranges.splice(ri, 1), "Horario eliminado")}
                        >
                          <X size={14} />
                        </IconBtn>
                      ) : null}
                    </div>
                  ))
                )}
                {h.active && invalid ? (
                  <div className="text-[12.5px] font-semibold text-danger">La hora de cierre debe ser posterior a la de apertura.</div>
                ) : null}
              </div>
              {h.active ? (
                <div className="flex gap-1.5">
                  <PButton
                    size="sm"
                    className="h-[34px]"
                    onClick={() =>
                      update((d) => {
                        const rs = d.hours[hi]!.ranges;
                        rs.push([rs[rs.length - 1]?.[1] ?? "17:00", "22:00"]);
                      }, "Horario agregado")
                    }
                  >
                    + Horario
                  </PButton>
                  {hi === 0 ? (
                    <PButton
                      size="sm"
                      className="h-[34px]"
                      onClick={() =>
                        update((d) => {
                          const src = d.hours[0]!;
                          d.hours.forEach((x, i) => {
                            if (i > 0) {
                              x.active = src.active;
                              x.ranges = structuredClone(src.ranges);
                            }
                          });
                        }, "Horario copiado a toda la semana")
                      }
                    >
                      Copiar a todos
                    </PButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
