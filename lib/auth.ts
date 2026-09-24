/* Sesión mock del panel (fase 1): cookie httpOnly con el correo.
   Fase 2: Supabase Auth (el middleware validará la sesión real). Edge-safe: sin APIs de Node. */

export const SESSION_COOKIE = "md_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_RE.test(email);

export function encodeSession(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase());
}

/** Devuelve el correo de la sesión o null si la cookie no es válida. */
export function parseSession(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const email = decodeURIComponent(value);
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
