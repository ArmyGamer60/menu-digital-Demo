"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE, encodeSession, isValidEmail, safeNext } from "@/lib/auth";

export interface LoginState {
  error: string | null;
  email: string;
}

const loginSchema = z.object({
  email: z.string().trim().refine(isValidEmail),
  password: z.string().min(1),
});

/** Login mock: cualquier correo válido + contraseña no vacía. */
export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: form.get("password") ?? "" });
  if (!parsed.success) return { error: "Revisa tu correo y contraseña.", email };

  (await cookies()).set(SESSION_COOKIE, encodeSession(parsed.data.email), {
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
