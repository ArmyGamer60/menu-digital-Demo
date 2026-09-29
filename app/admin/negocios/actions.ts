"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidEmail } from "@/lib/auth";
import { applyMenuImport } from "@/lib/menuImport";
import { MIN_PASSWORD, generatePassword } from "@/lib/password";
import {
  RepoError,
  addMembership,
  createBusiness,
  createUser,
  deleteBusiness,
  deleteUser,
  getBusinessRow,
  getUserForLogin,
  listUsers,
  removeMembership,
  saveBusiness,
  setBusinessStatus,
  setCustomDomain,
  updateUser,
  type BusinessStatusKey,
} from "@/lib/repo";
import { sanitizeSlug } from "@/lib/slug";
import { assertSuperadmin } from "@/lib/session";

/* Acciones de la plataforma: solo el superadmin. */

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Credenciales para entregar al cliente (la contraseña solo se muestra una vez). */
export interface Credentials {
  email: string;
  /** null si el usuario ya existía y conserva su contraseña. */
  password: string | null;
}

async function run<T extends object>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await assertSuperadmin();
    const r = await fn();
    revalidatePath("/admin", "layout");
    return { ok: true, ...r };
  } catch (e) {
    if (!(e instanceof RepoError)) console.error("negocios", e);
    return { ok: false, error: e instanceof Error ? e.message : "Algo salió mal." };
  }
}

async function revalidateMenu(businessId: string) {
  const row = await getBusinessRow(businessId);
  if (!row) return;
  revalidatePath(`/menu/${row.business.slug}`);
  if (row.customDomain) revalidatePath(`/sites/${row.customDomain}`);
}

/** Da acceso a un correo: si no tiene cuenta, la crea con contraseña temporal. */
async function grantAccess(businessId: string, emailRaw: string, name = "", password?: string): Promise<Credentials> {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) throw new RepoError("Correo no válido.");
  const existing = await getUserForLogin(email);
  if (existing) {
    await addMembership(existing.id, businessId);
    return { email, password: null };
  }
  const pw = password || generatePassword();
  if (pw.length < MIN_PASSWORD) throw new RepoError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
  const user = await createUser({ email, name, password: pw });
  await addMembership(user.id, businessId);
  return { email, password: pw };
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del negocio.").max(120),
  slug: z.string().trim().max(80),
  template: z.enum(["blank", "demo"]),
  ownerEmail: z.string().trim().max(200),
  ownerName: z.string().trim().max(80),
  ownerPassword: z.string().max(200),
});

export async function createBusinessAction(
  input: z.input<typeof createSchema>,
): Promise<ActionResult<{ businessId: string; slug: string; credentials: Credentials | null }>> {
  return run(async () => {
    const p = createSchema.safeParse(input);
    if (!p.success) throw new RepoError(p.error.issues[0]?.message ?? "Datos no válidos.");
    const { name, template, ownerEmail, ownerName, ownerPassword } = p.data;
    if (ownerEmail && !isValidEmail(ownerEmail)) throw new RepoError("El correo del dueño no es válido.");
    const slug = sanitizeSlug(p.data.slug || name);
    const business = await createBusiness({ name, slug, template });
    const credentials = ownerEmail ? await grantAccess(business.id, ownerEmail, ownerName, ownerPassword) : null;
    return { businessId: business.id, slug: business.slug, credentials };
  });
}

export async function setStatusAction(businessId: string, status: BusinessStatusKey) {
  return run(async () => {
    await setBusinessStatus(businessId, status === "suspended" ? "suspended" : "active");
    await revalidateMenu(businessId);
    return {};
  });
}

export async function setDomainAction(businessId: string, domain: string) {
  return run(async () => {
    const before = await getBusinessRow(businessId);
    await setCustomDomain(businessId, domain.trim() || null);
    if (before?.customDomain) revalidatePath(`/sites/${before.customDomain}`);
    await revalidateMenu(businessId);
    return {};
  });
}

export async function deleteBusinessAction(businessId: string) {
  return run(async () => {
    const row = await getBusinessRow(businessId);
    await deleteBusiness(businessId);
    if (row) revalidatePath(`/menu/${row.business.slug}`);
    return {};
  });
}

export async function addOwnerAction(businessId: string, email: string, name: string) {
  return run(async () => {
    if (!(await getBusinessRow(businessId))) throw new RepoError("Negocio no encontrado.");
    return { credentials: await grantAccess(businessId, email, name) };
  });
}

export async function removeOwnerAction(businessId: string, userId: string) {
  return run(async () => {
    await removeMembership(userId, businessId);
    // Cuenta sin negocios y sin rol de plataforma: se elimina para no dejar accesos huérfanos.
    const user = (await listUsers()).find((u) => u.id === userId);
    if (user && !user.isSuperadmin && user.businessIds.length === 0) await deleteUser(userId);
    return {};
  });
}

export async function resetPasswordAction(userId: string) {
  return run(async () => {
    const user = (await listUsers()).find((u) => u.id === userId);
    if (!user) throw new RepoError("Usuario no encontrado.");
    if (user.isSuperadmin) throw new RepoError("Cambia tu contraseña desde Cuenta.");
    const password = generatePassword();
    await updateUser(userId, { password });
    return { credentials: { email: user.email, password } satisfies Credentials };
  });
}

/** Reemplaza el catálogo del negocio con un menú en JSON (ver lib/menuImport.ts). */
export async function importMenuAction(businessId: string, jsonText: string) {
  return run(async () => {
    if (jsonText.length > 2_000_000) throw new RepoError("El archivo es demasiado grande.");
    const row = await getBusinessRow(businessId);
    if (!row) throw new RepoError("Negocio no encontrado.");
    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      throw new RepoError("El archivo no es un JSON válido.");
    }
    const r = applyMenuImport(row.business, raw);
    if (!r.ok) throw new RepoError(r.error);
    await saveBusiness(r.business);
    await revalidateMenu(businessId);
    return { summary: r.summary };
  });
}
