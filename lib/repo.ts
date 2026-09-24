/* Capa de datos — Fase 1: seed estático + localStorage (como el prototipo).
   Fase 2: sustituir la implementación por Supabase manteniendo estas firmas async.
   Los datos se guardan por `business.id` para que cambiar el slug no los pierda. */
import type { Business, Order, OrderDraft } from "@/types";
import { SEED_VERSION, seedBusiness, seedOrders } from "@/data/seed";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const bizKey = (id: string) => `menu-digital.biz.${id}`;
const ordersKey = (id: string) => `menu-digital.orders.${id}`;

interface Stored<T> {
  version: number;
  data: T;
}

const hasStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function read<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored<T>;
    return s && s.version === SEED_VERSION ? s.data : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: SEED_VERSION, data } satisfies Stored<T>));
  } catch {
    /* cuota llena / modo privado: se ignora en fase 1 */
  }
}

const SEEDS: { business: Business; orders: Order[] }[] = [{ business: seedBusiness, orders: seedOrders }];

/** Negocio del panel en fase 1 (fase 2: el de la sesión / selector multi-negocio). */
export const DEFAULT_BUSINESS_ID = seedBusiness.id;

export async function getBusinessById(id: string): Promise<Business | null> {
  const stored = read<Business>(bizKey(id));
  if (stored) return stored;
  const seed = SEEDS.find((s) => s.business.id === id);
  return seed ? clone(seed.business) : null;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  for (const s of SEEDS) {
    const b = read<Business>(bizKey(s.business.id)) ?? s.business;
    if (b.slug === slug) return clone(b);
  }
  // Slug original del seed (el menú sigue respondiendo en la URL antigua tras renombrar).
  const seed = SEEDS.find((s) => s.business.slug === slug);
  return seed ? getBusinessById(seed.business.id) : null;
}

export async function listBusinessSlugs(): Promise<string[]> {
  return SEEDS.map((s) => s.business.slug);
}

export async function listBusinesses(): Promise<Business[]> {
  return Promise.all(SEEDS.map((s) => getBusinessById(s.business.id))).then((l) => l.filter((b): b is Business => !!b));
}

export async function saveBusiness(business: Business): Promise<Business> {
  write(bizKey(business.id), business);
  return business;
}

export async function listOrders(businessId: string): Promise<Order[]> {
  return read<Order[]>(ordersKey(businessId)) ?? clone(SEEDS.find((s) => s.business.id === businessId)?.orders ?? []);
}

/** Registra el pedido enviado por WhatsApp y avanza el contador del negocio. */
export async function createOrder(businessId: string, draft: OrderDraft, now: Date = new Date()): Promise<Order> {
  const business = await getBusinessById(businessId);
  if (!business) throw new Error(`Negocio no encontrado: ${businessId}`);
  const number = Math.max(draft.number, business.orderCounter + 1);
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const order: Order = {
    ...draft,
    id: "ord_" + number,
    number,
    time: hhmm,
    date: now.toISOString().slice(0, 10),
    status: "pending",
    source: "whatsapp",
    isNew: true,
  };
  const orders = await listOrders(businessId);
  write(ordersKey(businessId), [order, ...orders]);
  await saveBusiness({ ...business, orderCounter: number });
  return order;
}

export async function updateOrder(businessId: string, orderId: string, patch: Partial<Order>): Promise<Order | null> {
  const orders = await listOrders(businessId);
  const next = orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
  write(ordersKey(businessId), next);
  return next.find((o) => o.id === orderId) ?? null;
}

export async function resetDemo(businessId: string): Promise<{ business: Business | null; orders: Order[] }> {
  if (hasStorage()) {
    window.localStorage.removeItem(bizKey(businessId));
    window.localStorage.removeItem(ordersKey(businessId));
  }
  return { business: await getBusinessById(businessId), orders: await listOrders(businessId) };
}

/* Sincronía panel ↔ menú en fase 1: evento `storage` (otras pestañas e iframes del mismo origen). */
function subscribe<T>(key: string, fn: (v: T) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return;
    const v = read<T>(key);
    if (v) fn(v);
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export const subscribeBusiness = (businessId: string, fn: (b: Business) => void) => subscribe(bizKey(businessId), fn);
export const subscribeOrders = (businessId: string, fn: (o: Order[]) => void) => subscribe(ordersKey(businessId), fn);
