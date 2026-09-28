"use server";

import { z } from "zod";
import { createOrder, nextOrderNumber } from "@/lib/repo";
import type { OrderDraft } from "@/types";

/* Acciones públicas del menú (sin sesión): se validan y acotan todos los datos. */

const str = (max: number) => z.string().trim().max(max);
const money = z.number().finite().min(0).max(10_000_000);

const draftSchema = z.object({
  number: z.number().int().min(0).max(100_000_000),
  mode: z.enum(["dinein", "pickup"]),
  customer: z.object({
    name: str(80).min(1),
    phone: str(30).optional(),
    table: str(12).nullable().optional(),
    guests: z.number().int().min(1).max(500).nullable().optional(),
    pickupTime: str(60).nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: str(64),
        name: str(120),
        qty: z.number().int().min(1).max(999),
        unit: money,
        mods: z.array(str(120)).max(40),
        notes: str(300).optional(),
      }),
    )
    .min(1)
    .max(100),
  notes: str(500),
  subtotal: money,
  discount: money,
  tax: money.optional(),
  total: money,
});

const idSchema = z.string().regex(/^[\w-]{1,64}$/);

/** Número del próximo pedido (se pide al abrir el checkout para que no se repita entre clientes). */
export async function getNextOrderNumber(businessId: string): Promise<number | null> {
  if (!idSchema.safeParse(businessId).success) return null;
  return nextOrderNumber(businessId);
}

/** Registra el pedido enviado por WhatsApp. Devuelve el número definitivo. */
export async function submitOrder(businessId: string, draft: OrderDraft): Promise<{ number: number } | { error: string }> {
  const id = idSchema.safeParse(businessId);
  const parsed = draftSchema.safeParse(draft);
  if (!id.success || !parsed.success) return { error: "Pedido no válido." };
  try {
    const order = await createOrder(id.data, parsed.data);
    return { number: order.number };
  } catch {
    return { error: "No se pudo registrar el pedido." };
  }
}
