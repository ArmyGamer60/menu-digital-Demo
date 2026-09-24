import { describe, expect, it } from "vitest";
import { seedBusiness } from "@/data/seed";
import { businessStatus, statusText } from "@/lib/hours";
import type { ManualState } from "@/types";

// America/Mazatlan = UTC−7 (sin horario de verano). 2026-09-23 es miércoles.
const at = (isoUtc: string) => new Date(isoUtc);
const biz = (manualState: ManualState, timezone = "America/Mazatlan") => ({
  hours: seedBusiness.hours,
  settings: { manualState, timezone },
});

describe("businessStatus", () => {
  it("auto: abierto dentro de un rango, con hora de cierre", () => {
    const st = businessStatus(biz("auto"), at("2026-09-23T17:00:00Z")); // mié 10:00
    expect(st).toMatchObject({ key: "open", canOrder: true, until: "13:00" });
    expect(statusText(st)).toBe("Abierto · hasta 13:00");
  });

  it("auto: el fin del rango es exclusivo", () => {
    const st = businessStatus(biz("auto"), at("2026-09-23T20:00:00Z")); // mié 13:00
    expect(st.key).toBe("closed");
  });

  it("auto: cerrado entre rangos → abre hoy más tarde", () => {
    const st = businessStatus(biz("auto"), at("2026-09-23T21:00:00Z")); // mié 14:00
    expect(st).toMatchObject({ key: "closed", canOrder: false, next: "hoy a las 17:00" });
    expect(statusText(st)).toBe("Cerrado · abre hoy a las 17:00");
  });

  it("auto: después del último rango → mañana", () => {
    const st = businessStatus(biz("auto"), at("2026-09-24T06:00:00Z")); // mié 23:00
    expect(st.next).toBe("mañana a las 07:30");
  });

  it("auto: salta días inactivos (domingo) → lunes", () => {
    const st = businessStatus(biz("auto"), at("2026-09-27T06:30:00Z")); // sáb 23:30
    expect(st.next).toBe("lunes a las 07:30");
  });

  it("usa la zona horaria del negocio, no la del servidor", () => {
    // 17:00Z es 10:00 en Mazatlán (abierto) pero 02:00 del jueves en Tokio (cerrado).
    expect(businessStatus(biz("auto"), at("2026-09-23T17:00:00Z")).key).toBe("open");
    expect(businessStatus(biz("auto", "Asia/Tokyo"), at("2026-09-23T17:00:00Z"))).toMatchObject({
      key: "closed",
      next: "hoy a las 07:30",
    });
  });

  it("manualState manda sobre el horario", () => {
    const night = at("2026-09-24T06:00:00Z"); // fuera de horario
    expect(businessStatus(biz("open"), night)).toMatchObject({ key: "open", canOrder: true });
    expect(statusText(businessStatus(biz("open"), night))).toBe("Abierto ahora");

    const paused = businessStatus(biz("paused"), at("2026-09-23T17:00:00Z"));
    expect(paused).toMatchObject({ key: "paused", canOrder: false });
    expect(statusText(paused)).toBe("Pedidos en pausa");

    const closed = businessStatus(biz("closed"), at("2026-09-23T17:00:00Z")); // mié 10:00
    expect(closed).toMatchObject({ key: "closed", canOrder: false, next: "hoy a las 17:00" });
  });

  it("sin días activos no hay próxima apertura", () => {
    const st = businessStatus(
      { hours: seedBusiness.hours.map((h) => ({ ...h, active: false })), settings: { manualState: "auto", timezone: "America/Mazatlan" } },
      at("2026-09-23T17:00:00Z"),
    );
    expect(st).toMatchObject({ key: "closed", next: null });
    expect(statusText(st)).toBe("Cerrado");
  });
});
