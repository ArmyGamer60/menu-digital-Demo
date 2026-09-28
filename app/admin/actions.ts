"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { BUSINESS_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, authMode, checkBootstrapPassword, createSession, isValidEmail, safeNext } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { canAccessBusiness, countUsers, createUser, getUserForLogin } from "@/lib/repo";
import { currentUser } from "@/lib/session";

export interface LoginState {
  error: string | null;
  email: string;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().refine(isValidEmail),
  password: z.string().min(1),
});

/** Pausa ante credenciales incorrectas para frenar intentos por fuerza bruta. */
const FAIL_DELAY_MS = 800;

const cookieOpts = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE } as const;

/** Login con correo y contraseña. Si aún no hay cuentas, la primera se crea como superadmin con ADMIN_PASSWORD. */
export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  if (authMode() === "disabled") {
    return { error: "El panel está deshabilitado: falta configurar SESSION_SECRET o ADMIN_PASSWORD en el servidor.", email };
  }
  const parsed = loginSchema.safeParse({ email, password: form.get("password") ?? "" });
  const fail = async (error = "Revisa tu correo y contraseña.") => {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return { error, email };
  };
  if (!parsed.success) return fail();

  let userId: string;
  try {
    if ((await countUsers()) === 0) {
      if (!(await checkBootstrapPassword(parsed.data.password))) return fail("Primera cuenta: usa la contraseña de ADMIN_PASSWORD.");
      const user = await createUser({ email: parsed.data.email, name: "", password: parsed.data.password, isSuperadmin: true });
      userId = user.id;
    } else {
      const user = await getUserForLogin(parsed.data.email);
      if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return fail();
      userId = user.id;
    }
  } catch (e) {
    console.error("login", e);
    return { error: "No se pudo conectar con la base de datos.", email };
  }

  const token = await createSession(userId);
  if (!token) return { error: "No se pudo iniciar sesión.", email };
  (await cookies()).set(SESSION_COOKIE, token, cookieOpts);
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  c.delete(BUSINESS_COOKIE);
  redirect("/admin/login");
}

/** Cambia el negocio activo del panel. */
export async function selectBusiness(businessId: string, to = "/admin"): Promise<void> {
  const user = await currentUser();
  if (!user || !(await canAccessBusiness(user, businessId))) redirect("/admin");
  (await cookies()).set(BUSINESS_COOKIE, businessId, { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  redirect(to.startsWith("/admin") ? to : "/admin");
}
