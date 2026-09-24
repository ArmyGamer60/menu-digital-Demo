import { describe, expect, it } from "vitest";
import { encodeSession, parseSession, safeNext, sessionUser } from "@/lib/auth";

describe("sesión mock", () => {
  it("codifica y valida el correo", () => {
    expect(parseSession(encodeSession(" Andrea@Molienda.mx "))).toBe("andrea@molienda.mx");
    expect(parseSession("no-es-correo")).toBeNull();
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession("%E0%A4%A")).toBeNull(); // URI inválida
  });

  it("deriva nombre e iniciales", () => {
    expect(sessionUser("andrea@molienda.mx")).toMatchObject({ firstName: "Andrea", initials: "AN" });
    expect(sessionUser("andrea.valdez@molienda.mx")).toMatchObject({ firstName: "Andrea", initials: "AV" });
  });

  it("solo redirige a rutas internas del panel", () => {
    expect(safeNext("/admin/products")).toBe("/admin/products");
    expect(safeNext("https://evil.com")).toBe("/admin");
    expect(safeNext("//evil.com/admin")).toBe("/admin");
    expect(safeNext("/admin/login")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
