"use server";

import { revalidatePath } from "next/cache";
import { MIN_PASSWORD, verifyPassword } from "@/lib/password";
import { getUserForLogin, updateUser } from "@/lib/repo";
import { currentUser } from "@/lib/session";

/* Acciones de la propia cuenta (nombre y contraseña). */

export async function updateProfileAction(name: string): Promise<{ error?: string }> {
  const user = await currentUser();
  if (!user) return { error: "Sesión expirada." };
  await updateUser(user.id, { name: name.slice(0, 80) });
  revalidatePath("/admin", "layout");
  return {};
}

export async function changePasswordAction(current: string, next: string): Promise<{ error?: string }> {
  const user = await currentUser();
  if (!user) return { error: "Sesión expirada." };
  if (next.length < MIN_PASSWORD) return { error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  const full = await getUserForLogin(user.email);
  if (!full || !(await verifyPassword(current, full.passwordHash))) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "La contraseña actual no es correcta." };
  }
  await updateUser(user.id, { password: next });
  return {};
}
