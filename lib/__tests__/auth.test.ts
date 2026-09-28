import { describe, expect, it } from "vitest";
import { authMode, checkBootstrapPassword, createSession, safeNext, sessionUser, verifySession } from "@/lib/auth";
import { generatePassword, hashPassword, verifyPassword } from "@/lib/password";

const env = (e: Record<string, string | undefined>) => e as NodeJS.ProcessEnv;
const PROD = env({ NODE_ENV: "production", ADMIN_PASSWORD: "s3creta" });
const PROD_SECRET = env({ NODE_ENV: "production", SESSION_SECRET: "x".repeat(40) });
const DEV = env({ NODE_ENV: "development" });
const PROD_NONE = env({ NODE_ENV: "production" });

describe("modo de autenticación", () => {
  it("producción sin clave queda cerrada; con SESSION_SECRET o ADMIN_PASSWORD, lista", () => {
    expect(authMode(PROD)).toBe("ready");
    expect(authMode(PROD_SECRET)).toBe("ready");
    expect(authMode(DEV)).toBe("dev");
    expect(authMode(PROD_NONE)).toBe("disabled");
  });

  it("primera cuenta: exige ADMIN_PASSWORD exacta (en desarrollo sin ella, cualquiera)", async () => {
    expect(await checkBootstrapPassword("s3creta", PROD)).toBe(true);
    expect(await checkBootstrapPassword("S3CRETA", PROD)).toBe(false);
    expect(await checkBootstrapPassword("lo-que-sea", PROD_SECRET)).toBe(false);
    expect(await checkBootstrapPassword("lo-que-sea", DEV)).toBe(true);
    expect(await checkBootstrapPassword("", DEV)).toBe(false);
  });
});

describe("contraseñas", () => {
  it("hash PBKDF2 con sal: verifica la correcta y rechaza otras", async () => {
    const h = await hashPassword("cafe-luna-2026");
    expect(h).toMatch(/^pbkdf2\$\d+\$/);
    expect(h).not.toBe(await hashPassword("cafe-luna-2026"));
    expect(await verifyPassword("cafe-luna-2026", h)).toBe(true);
    expect(await verifyPassword("cafe-luna-2027", h)).toBe(false);
    expect(await verifyPassword("x", "basura")).toBe(false);
  });

  it("genera contraseñas temporales sin caracteres ambiguos", () => {
    const p = generatePassword();
    expect(p).toHaveLength(12);
    expect(p).not.toMatch(/[0O1lI]/);
  });
});

describe("cookie de sesión firmada", () => {
  it("ida y vuelta con el id de usuario", async () => {
    const token = await createSession("usr_abc123", PROD);
    expect(await verifySession(token, PROD)).toBe("usr_abc123");
  });

  it("rechaza cookies falsificadas, alteradas, expiradas o de otra clave", async () => {
    const token = (await createSession("usr_abc123", PROD))!;
    const [, exp, sig] = token.split(".");
    const forged = Buffer.from("usr_admin").toString("base64url");
    expect(await verifySession(`${forged}.${exp}.${sig}`, PROD)).toBeNull();
    expect(await verifySession(`${token.split(".")[0]}.${Number(exp) + 999999}.${sig}`, PROD)).toBeNull();
    expect(await verifySession(token, env({ ...PROD, ADMIN_PASSWORD: "otra" }))).toBeNull();
    expect(await verifySession(token, PROD, Date.now() + 8 * 864e5)).toBeNull(); // > 7 días
    expect(await verifySession(token, PROD_NONE)).toBeNull();
    expect(await verifySession(undefined, PROD)).toBeNull();
  });

  it("sin configurar no emite sesión", async () => {
    expect(await createSession("usr_1", PROD_NONE)).toBeNull();
  });
});

describe("helpers", () => {
  it("deriva nombre e iniciales (nombre o, si falta, el correo)", () => {
    const u = (email: string, name = "") => sessionUser({ id: "usr_1", email, name, isSuperadmin: false });
    expect(u("andrea@molienda.mx")).toMatchObject({ firstName: "Andrea", initials: "AN" });
    expect(u("andrea.valdez@molienda.mx")).toMatchObject({ firstName: "Andrea", initials: "AV" });
    expect(u("x@y.mx", "Luis Félix")).toMatchObject({ firstName: "Luis", initials: "LF" });
  });

  it("solo redirige a rutas internas del panel", () => {
    expect(safeNext("/admin/products")).toBe("/admin/products");
    expect(safeNext("https://evil.com")).toBe("/admin");
    expect(safeNext("//evil.com/admin")).toBe("/admin");
    expect(safeNext("/admin/login")).toBe("/admin");
    expect(safeNext("/admin/salir")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
