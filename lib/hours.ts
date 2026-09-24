import type { BusinessHours, DayOfWeek, Settings } from "@/types";

export type StatusKey = "open" | "closed" | "paused";

export interface BusinessStatus {
  key: StatusKey;
  label: string;
  canOrder: boolean;
  /** Hora de cierre del rango actual ("13:00"). */
  until?: string;
  /** Próxima apertura: "hoy a las 17:00", "mañana a las 07:30", "lunes a las 07:30". */
  next?: string | null;
}

export const toMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};

const WEEKDAYS: Record<string, DayOfWeek> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Día de la semana y minutos desde medianoche de `now` en la zona horaria del negocio. */
export function zonedClock(now: Date, timeZone?: string): { day: DayOfWeek; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = WEEKDAYS[get("weekday")];
    if (day === undefined) throw new Error("weekday");
    return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  } catch {
    return { day: now.getDay() as DayOfWeek, minutes: now.getHours() * 60 + now.getMinutes() };
  }
}

/** Hora "HH:MM" de `now` + `addMinutes` en la zona horaria dada. */
export function zonedTime(now: Date, timeZone?: string, addMinutes = 0): string {
  const { minutes } = zonedClock(new Date(now.getTime() + addMinutes * 60000), timeZone);
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}

export function businessStatus(
  biz: { hours: BusinessHours[]; settings: Pick<Settings, "manualState" | "timezone"> },
  now: Date = new Date(),
): BusinessStatus {
  const { day: today, minutes: cur } = zonedClock(now, biz.settings.timezone);
  const manual = biz.settings.manualState;

  const nextOpen = (): string | null => {
    for (let d = 0; d < 8; d++) {
      const h = biz.hours.find((x) => x.day === (today + d) % 7);
      if (!h || !h.active) continue;
      const r = h.ranges.find((r) => d > 0 || toMin(r[0]) > cur);
      if (r) return (d === 0 ? "hoy" : d === 1 ? "mañana" : h.label.toLowerCase()) + " a las " + r[0];
    }
    return null;
  };

  if (manual === "paused") return { key: "paused", label: "Pedidos en pausa", canOrder: false };
  if (manual === "closed") return { key: "closed", label: "Cerrado", canOrder: false, next: nextOpen() };
  if (manual === "open") return { key: "open", label: "Abierto", canOrder: true };

  const h = biz.hours.find((x) => x.day === today);
  const r = h?.active ? h.ranges.find((r) => cur >= toMin(r[0]) && cur < toMin(r[1])) : undefined;
  if (r) return { key: "open", label: "Abierto", canOrder: true, until: r[1] };
  return { key: "closed", label: "Cerrado", canOrder: false, next: nextOpen() };
}

export const STATUS_COLORS: Record<StatusKey, string> = { open: "#2E8B57", paused: "#D08A1E", closed: "#B3261E" };

/** "Abierto · hasta 13:00" / "Abierto ahora" / "Cerrado · abre hoy a las 17:00" / "Pedidos en pausa". */
export function statusText(st: BusinessStatus): string {
  if (st.key === "open") return "Abierto" + (st.until ? " · hasta " + st.until : " ahora");
  if (st.key === "paused") return "Pedidos en pausa";
  return "Cerrado" + (st.next ? " · abre " + st.next : "");
}
