"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE, authMode, checkPassword, createSession, isValidEmail, safeNext } from "@/lib/auth";

export interface LoginState {
  error: string | null;
  email: string;
}

const loginSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
  password: z.string().min(1),
});

/** Pausa ante credenciales incorrectas para frenar intentos por fuerza bruta. */
const FAIL_DELAY_MS = 800;

/** Login: correo válido + ADMIN_PASSWORD (en desarrollo sin ADMIN_PASSWORD, cualquier contraseña). */
export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  if (authMode() === "disabled") {
    return { error: "El panel está deshabilitado: falta configurar ADMIN_PASSWORD en el servidor.", email };
  }
  const parsed = loginSchema.safeParse({ email, password: form.get("password") ?? "" });
  if (!parsed.success || !(await checkPassword(parsed.data.password))) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return { error: "Revisa tu correo y contraseña.", email };
  }

  const token = await createSession(parsed.data.email);
  if (!token) return { error: "No se pudo iniciar sesión.", email };
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
