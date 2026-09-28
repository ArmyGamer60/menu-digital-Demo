/* Sesión del panel: cookie httpOnly `<id de usuario en base64url>.<expira>.<firma HMAC-SHA256>`.
   Web Crypto: funciona en el middleware (edge) y en Node. Los usuarios viven en la base de datos.

   Variables:
   - SESSION_SECRET   clave de firma (32+ caracteres aleatorios). Recomendada en producción.
   - ADMIN_PASSWORD   contraseña para crear la primera cuenta (superadmin) cuando aún no hay usuarios.
                      Si falta SESSION_SECRET también se usa para derivar la clave de firma.
   En producción sin ninguna de las dos el panel queda cerrado. En desarrollo hay una clave fija. */

export const SESSION_COOKIE = "md_session";
export const BUSINESS_COOKIE = "md_biz";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEV_SECRET = "menu-digital-dev-only-secret";

export const isValidEmail = (email: string) => EMAIL_RE.test(email);

export type AuthMode = "ready" | "dev" | "disabled";

/** "ready": producción configurada · "dev": desarrollo · "disabled": producción sin clave de firma. */
export function authMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  if (env.SESSION_SECRET || env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD) return env.NODE_ENV === "production" ? "ready" : "dev";
  return env.NODE_ENV === "production" ? "disabled" : "dev";
}

function signingSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const s = env.SESSION_SECRET || env.ADMIN_SESSION_SECRET || (env.ADMIN_PASSWORD ? `pw:${env.ADMIN_PASSWORD}` : "");
  if (s) return s;
  return env.NODE_ENV === "production" ? null : DEV_SECRET;
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

async function hmac(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

/** Comparación en tiempo constante (misma longitud tras HMAC). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Primera cuenta: ¿la contraseña coincide con ADMIN_PASSWORD? (en desarrollo sin ADMIN_PASSWORD, cualquiera). */
export async function checkBootstrapPassword(input: string, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return env.NODE_ENV !== "production" && input.length > 0;
  const key = signingSecret(env) ?? DEV_SECRET;
  return safeEqual(await hmac(key, `pw:${input}`), await hmac(key, `pw:${env.ADMIN_PASSWORD}`));
}

/** Valor de cookie para el usuario. null si el panel está deshabilitado. */
export async function createSession(userId: string, env: NodeJS.ProcessEnv = process.env, now = Date.now()): Promise<string | null> {
  const secret = signingSecret(env);
  if (!secret) return null;
  const payload = `${b64url(enc.encode(userId))}.${Math.floor(now / 1000) + SESSION_MAX_AGE}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

/** Devuelve el id de usuario si la cookie tiene firma válida y no ha expirado; si no, null. */
export async function verifySession(
  value: string | undefined | null,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<string | null> {
  const secret = signingSecret(env);
  if (!value || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [encId, exp, sig] = parts as [string, string, string];
  if (!safeEqual(sig, await hmac(secret, `${encId}.${exp}`))) return null;
  if (!(Number(exp) * 1000 > now)) return null;
  try {
    const id = fromB64url(encId);
    return /^[\w-]{3,64}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  /** "andrea@molienda.mx" → "Andrea". */
  firstName: string;
  initials: string;
  isSuperadmin: boolean;
}

export function sessionUser(u: { id: string; email: string; name: string; isSuperadmin: boolean }): SessionUser {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const source = u.name.trim() || (u.email.split("@")[0] ?? u.email);
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const first = cap(parts[0] ?? source);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
  return { id: u.id, email: u.email, name: u.name, firstName: first, initials: initials || "?", isSuperadmin: u.isSuperadmin };
}

/** Solo rutas internas del panel como destino post-login. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login") && !next.startsWith("/admin/salir")
    ? next
    : "/admin";
}
