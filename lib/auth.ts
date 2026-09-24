/* Sesión del panel (fase 1): contraseña única en la variable de entorno ADMIN_PASSWORD
   y cookie httpOnly firmada con HMAC-SHA256 (Web Crypto: funciona en middleware/edge y en Node).
   Fase 2: Supabase Auth.

   Variables:
   - ADMIN_PASSWORD        contraseña del panel (obligatoria en producción; sin ella el panel queda cerrado).
   - ADMIN_SESSION_SECRET  opcional; clave de firma. Si falta se deriva de ADMIN_PASSWORD
                           (cambiar la contraseña invalida todas las sesiones).
   En desarrollo, sin ADMIN_PASSWORD se acepta cualquier contraseña no vacía. */

export const SESSION_COOKIE = "md_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEV_SECRET = "menu-digital-dev-only-secret";

export const isValidEmail = (email: string) => EMAIL_RE.test(email);

export type AuthMode = "password" | "dev-any" | "disabled";

/** "password": ADMIN_PASSWORD configurada · "dev-any": desarrollo sin contraseña · "disabled": producción sin configurar. */
export function authMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  if (env.ADMIN_PASSWORD) return "password";
  return env.NODE_ENV === "production" ? "disabled" : "dev-any";
}

function signingSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const mode = authMode(env);
  if (mode === "disabled") return null;
  return env.ADMIN_SESSION_SECRET || (mode === "password" ? `pw:${env.ADMIN_PASSWORD}` : DEV_SECRET);
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

/** ¿La contraseña es válida para el modo actual? */
export async function checkPassword(input: string, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const mode = authMode(env);
  if (mode === "disabled") return false;
  if (mode === "dev-any") return input.length > 0;
  // Se comparan HMACs (misma longitud) para no filtrar la longitud ni el contenido por tiempo.
  const key = signingSecret(env)!;
  return safeEqual(await hmac(key, `pw:${input}`), await hmac(key, `pw:${env.ADMIN_PASSWORD}`));
}

/** Valor de cookie: `<correo en base64url>.<expira>.<firma>`. null si el panel está deshabilitado. */
export async function createSession(email: string, env: NodeJS.ProcessEnv = process.env, now = Date.now()): Promise<string | null> {
  const secret = signingSecret(env);
  if (!secret) return null;
  const payload = `${b64url(enc.encode(email.trim().toLowerCase()))}.${Math.floor(now / 1000) + SESSION_MAX_AGE}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

/** Devuelve el correo si la cookie tiene firma válida y no ha expirado; si no, null. */
export async function verifySession(
  value: string | undefined | null,
  env: NodeJS.ProcessEnv = process.env,
  now = Date.now(),
): Promise<string | null> {
  const secret = signingSecret(env);
  if (!value || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [encEmail, exp, sig] = parts as [string, string, string];
  if (!safeEqual(sig, await hmac(secret, `${encEmail}.${exp}`))) return null;
  if (!(Number(exp) * 1000 > now)) return null;
  try {
    const email = fromB64url(encEmail);
    return isValidEmail(email) ? email : null;
  } catch {
    return null;
  }
}

export interface SessionUser {
  email: string;
  /** "andrea@molienda.mx" → "Andrea". */
  firstName: string;
  initials: string;
}

export function sessionUser(email: string): SessionUser {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const first = cap(parts[0] ?? local);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
  return { email, firstName: first, initials: initials || "?" };
}

/** Solo rutas internas del panel como destino post-login. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login") ? next : "/admin";
}
