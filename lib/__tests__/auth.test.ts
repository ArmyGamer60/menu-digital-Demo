import { describe, expect, it } from "vitest";
import { authMode, checkPassword, createSession, safeNext, sessionUser, verifySession } from "@/lib/auth";

const env = (e: Record<string, string | undefined>) => e as NodeJS.ProcessEnv;
const PROD = env({ NODE_ENV: "production", ADMIN_PASSWORD: "s3creta" });
const DEV = env({ NODE_ENV: "development" });
const PROD_NO_PW = env({ NODE_ENV: "production" });

describe("modo de autenticación", () => {
  it("producción sin ADMIN_PASSWORD queda cerrado; desarrollo acepta cualquiera", async () => {
    expect(authMode(PROD)).toBe("password");
    expect(authMode(DEV)).toBe("dev-any");
    expect(authMode(PROD_NO_PW)).toBe("disabled");
    expect(await checkPassword("lo-que-sea", PROD_NO_PW)).toBe(false);
    expect(await checkPassword("lo-que-sea", DEV)).toBe(true);
    expect(await checkPassword("", DEV)).toBe(false);
  });

  it("valida ADMIN_PASSWORD exacta", async () => {
    expect(await checkPassword("s3creta", PROD)).toBe(true);
    expect(await checkPassword("s3cret", PROD)).toBe(false);
    expect(await checkPassword("S3CRETA", PROD)).toBe(false);
  });
});

describe("cookie de sesión firmada", () => {
  it("ida y vuelta", async () => {
    const token = await createSession(" Andrea@Molienda.mx ", PROD);
    expect(await verifySession(token, PROD)).toBe("andrea@molienda.mx");
  });

  it("rechaza cookies falsificadas, alteradas, expiradas o de otra contraseña", async () => {
    const token = (await createSession("andrea@molienda.mx", PROD))!;
    expect(await verifySession("andrea%40molienda.mx", PROD)).toBeNull(); // formato antiguo (sin firma)
    const [, exp, sig] = token.split(".");
    const forgedEmail = Buffer.from("hacker@evil.com").toString("base64url");
    expect(await verifySession(`${forgedEmail}.${exp}.${sig}`, PROD)).toBeNull(); // otro correo con firma vieja
    expect(await verifySession(`${token.split(".")[0]}.${Number(exp) + 999999}.${sig}`, PROD)).toBeNull(); // expiración alterada
    expect(await verifySession(token, env({ ...PROD, ADMIN_PASSWORD: "otra" }))).toBeNull();
    expect(await verifySession(token, PROD, Date.now() + 8 * 864e5)).toBeNull(); // > 7 días
    expect(await verifySession(token, PROD_NO_PW)).toBeNull();
    expect(await verifySession(undefined, PROD)).toBeNull();
  });

  it("sin configurar no emite sesión", async () => {
    expect(await createSession("a@b.co", PROD_NO_PW)).toBeNull();
  });
});

describe("helpers", () => {
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
