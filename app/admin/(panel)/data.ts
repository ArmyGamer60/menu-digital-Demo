"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getBusinessRow,
  isDemoBusiness,
  listOrders,
  resetDemoBusiness,
  saveBusiness,
  updateOrder,
} from "@/lib/repo";
import { assertAccess, assertSuperadmin } from "@/lib/session";
import type { Business, Order } from "@/types";

/* Acciones del panel sobre el negocio activo. Todas comprueban que la sesión tenga acceso a ese negocio. */

const businessShape = z.looseObject({
  id: z.string().min(1).max(64),
  slug: z.string().max(80),
  name: z.string().max(120),
  theme: z.looseObject({}),
  settings: z.looseObject({}),
  hours: z.array(z.unknown()).max(7),
  categories: z.array(z.unknown()).max(200),
  products: z.array(z.unknown()).max(2000),
  modifierGroups: z.array(z.unknown()).max(500),
  promotions: z.array(z.unknown()).max(200),
});

async function revalidateMenu(businessId: string, ...slugs: (string | undefined)[]) {
  for (const s of slugs) if (s) revalidatePath(`/menu/${s}`);
  const row = await getBusinessRow(businessId);
  if (row?.customDomain) revalidatePath(`/sites/${row.customDomain}`);
}

export type SaveBusinessResult = { ok: true; slug: string; error?: string } | { ok: false; error: string };

export async function saveBusinessAction(business: Business): Promise<SaveBusinessResult> {
  try {
    if (!businessShape.safeParse(business).success) return { ok: false, error: "Datos no válidos." };
    await assertAccess(business.id);
    const r = await saveBusiness(business);
    await revalidateMenu(business.id, r.business.slug, r.previousSlug);
    return { ok: true, slug: r.business.slug, error: r.error };
  } catch (e) {
    console.error("saveBusiness", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

const orderPatch = z.object({
  status: z.enum(["pending", "preparing", "ready", "completed", "cancelled"]).optional(),
  isNew: z.boolean().optional(),
});

export async function updateOrderAction(businessId: string, orderId: string, patch: Partial<Order>): Promise<boolean> {
  const p = orderPatch.safeParse({ status: patch.status, isNew: patch.isNew });
  if (!p.success) return false;
  await assertAccess(businessId);
  return !!(await updateOrder(businessId, orderId, p.data));
}

export async function listOrdersAction(businessId: string): Promise<Order[]> {
  await assertAccess(businessId);
  return listOrders(businessId);
}

/** Solo el negocio demo y solo el superadmin. */
export async function resetDemoAction(businessId: string): Promise<{ business: Business; orders: Order[] } | null> {
  await assertSuperadmin();
  if (!isDemoBusiness(businessId)) return null;
  const before = await getBusinessRow(businessId);
  await resetDemoBusiness();
  const row = await getBusinessRow(businessId);
  if (!row) return null;
  await revalidateMenu(businessId, row.business.slug, before?.business.slug);
  return { business: row.business, orders: await listOrders(businessId) };
}
