/* Siembra el negocio demo (Molienda) en una base vacía para que /menu/molienda funcione desde el primer deploy. */
import { seedBusiness, seedOrders } from "@/data/seed";
import type { Business, Order } from "@/types";
import { json, type Db } from "./db";

/** Documento JSONB: el negocio sin lo que va en columnas propias (id, slug, contador). */
export function businessDoc(b: Business): Omit<Business, "id" | "slug" | "orderCounter"> {
  const doc: Partial<Business> = { ...b };
  delete doc.id;
  delete doc.slug;
  delete doc.orderCounter;
  return doc as Omit<Business, "id" | "slug" | "orderCounter">;
}

function demoRows(): { business: Business; orders: Order[] } {
  return { business: structuredClone(seedBusiness), orders: structuredClone(seedOrders) };
}

export async function insertDemo(d: Db): Promise<void> {
  const { business, orders } = demoRows();
  await d.query(
    `insert into businesses (id, slug, data, order_counter) values ($1, $2, $3::text::jsonb, $4)
     on conflict (id) do update set slug = excluded.slug, data = excluded.data, order_counter = excluded.order_counter, updated_at = now()`,
    [business.id, business.slug, json(businessDoc(business)), business.orderCounter],
  );
  await d.query(`delete from orders where business_id = $1`, [business.id]);
  for (const [i, o] of orders.entries()) {
    await d.query(
      `insert into orders (business_id, id, number, status, data, created_at)
       values ($1, $2, $3, $4, $5::text::jsonb, now() - make_interval(mins => $6))`,
      [business.id, o.id, o.number, o.status, json(o), (i + 1) * 15],
    );
  }
}

/** Solo si no hay ningún negocio (si borras el demo, no reaparece). */
export async function seedDemo(d: Db): Promise<void> {
  const [row] = await d.query<{ n: number }>(`select count(*)::int as n from businesses`);
  if ((row?.n ?? 0) === 0) await insertDemo(d);
}
