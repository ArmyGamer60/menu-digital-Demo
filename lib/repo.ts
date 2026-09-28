/* Capa de datos multi-negocio sobre Postgres (solo servidor).
   Negocios, usuarios, membresías y pedidos. El documento del menú se guarda en `businesses.data`. */
import type { Business, Order, OrderDraft } from "@/types";
import { db, json } from "./db";
import { zonedTime } from "./hours";
import { hashPassword } from "./password";
import { businessDoc, insertDemo } from "./seedDb";
import { sanitizeSlug } from "./slug";
import { DEMO_BUSINESS_ID, businessFromTemplate, type TemplateKey } from "./templates";

export type BusinessStatusKey = "active" | "suspended";

export interface BusinessRow {
  business: Business;
  status: BusinessStatusKey;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isSuperadmin: boolean;
  createdAt: string;
}

export class RepoError extends Error {}

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

/* ───────────── Negocios ───────────── */

interface BizDbRow {
  id: string;
  slug: string;
  custom_domain: string | null;
  status: string;
  data: Omit<Business, "id" | "slug" | "orderCounter">;
  order_counter: number;
  created_at: Date | string;
  updated_at: Date | string;
}

const BIZ_COLS = "id, slug, custom_domain, status, data, order_counter, created_at, updated_at";

function toRow(r: BizDbRow): BusinessRow {
  return {
    business: { ...r.data, id: r.id, slug: r.slug, orderCounter: r.order_counter } as Business,
    status: r.status === "suspended" ? "suspended" : "active",
    customDomain: r.custom_domain,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

async function one(where: string, param: unknown): Promise<BusinessRow | null> {
  const [r] = await (await db()).query<BizDbRow>(`select ${BIZ_COLS} from businesses where ${where} limit 1`, [param]);
  return r ? toRow(r) : null;
}

export const getBusinessRow = (id: string) => one("id = $1", id);
export const getBusinessRowBySlug = (slug: string) => one("slug = $1", slug.toLowerCase());

/** "https://Menu.SuCafe.com:443/x" → "menu.sucafe.com". */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export const isValidDomain = (d: string) => DOMAIN_RE.test(d);

/** Busca por dominio propio (acepta con y sin "www."). */
export async function getBusinessRowByDomain(host: string): Promise<BusinessRow | null> {
  const h = normalizeDomain(host);
  const alt = h.startsWith("www.") ? h.slice(4) : `www.${h}`;
  const [r] = await (await db()).query<BizDbRow>(`select ${BIZ_COLS} from businesses where custom_domain in ($1, $2) limit 1`, [h, alt]);
  return r ? toRow(r) : null;
}

/** Slug anterior → slug actual (los QR impresos siguen funcionando tras renombrar). */
export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  const [r] = await (await db()).query<{ slug: string }>(
    `select b.slug from slug_redirects r join businesses b on b.id = r.business_id where r.slug = $1`,
    [slug.toLowerCase()],
  );
  return r?.slug ?? null;
}

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  status: BusinessStatusKey;
  customDomain: string | null;
  createdAt: string;
  owners: { id: string; email: string; name: string }[];
  products: number;
  ordersTotal: number;
  ordersLast30: number;
}

interface SummaryDbRow {
  id: string;
  slug: string;
  status: string;
  custom_domain: string | null;
  created_at: Date | string;
  name: string | null;
  logo_text: string | null;
  products: number;
  orders_total: number;
  orders_30: number;
  owners: { id: string; email: string; name: string }[] | null;
}

async function summaries(where: string, params: unknown[]): Promise<BusinessSummary[]> {
  const rows = await (await db()).query<SummaryDbRow>(
    `select b.id, b.slug, b.status, b.custom_domain, b.created_at,
            b.data->>'name' as name, b.data->>'logoText' as logo_text,
            coalesce(jsonb_array_length(b.data->'products'), 0)::int as products,
            (select count(*)::int from orders o where o.business_id = b.id) as orders_total,
            (select count(*)::int from orders o where o.business_id = b.id and o.created_at > now() - interval '30 days') as orders_30,
            (select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'name', u.name) order by u.email), '[]'::jsonb)
               from memberships m join users u on u.id = m.user_id where m.business_id = b.id) as owners
     from businesses b ${where}
     order by b.created_at asc`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? r.slug,
    slug: r.slug,
    logoText: r.logo_text ?? "",
    status: r.status === "suspended" ? "suspended" : "active",
    customDomain: r.custom_domain,
    createdAt: iso(r.created_at),
    owners: r.owners ?? [],
    products: r.products,
    ordersTotal: r.orders_total,
    ordersLast30: r.orders_30,
  }));
}

export const listBusinessSummaries = () => summaries("", []);
export const listBusinessSummariesForUser = (userId: string) =>
  summaries("where b.id in (select business_id from memberships where user_id = $1)", [userId]);

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const d = await db();
  const [a] = await d.query(`select 1 from businesses where slug = $1 and id <> $2`, [slug, exceptId ?? ""]);
  if (a) return true;
  const [b] = await d.query(`select 1 from slug_redirects where slug = $1 and business_id <> $2`, [slug, exceptId ?? ""]);
  return !!b;
}

/** Slug libre a partir de un nombre: "Café Luna" → "cafe-luna", "cafe-luna-2"… */
export async function uniqueSlug(base: string): Promise<string> {
  const root = sanitizeSlug(base).replace(/^-+|-+$/g, "") || "negocio";
  for (let i = 1; i < 500; i++) {
    const s = i === 1 ? root : `${root}-${i}`;
    if (!(await isSlugTaken(s))) return s;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createBusiness(input: { name: string; slug: string; template: TemplateKey }): Promise<Business> {
  const slug = sanitizeSlug(input.slug).replace(/^-+|-+$/g, "");
  if (!slug) throw new RepoError("El slug no es válido.");
  if (await isSlugTaken(slug)) throw new RepoError(`El slug “${slug}” ya está en uso.`);
  const business = businessFromTemplate(input.template, newId("biz"), input.name.trim(), slug);
  await (await db()).query(`insert into businesses (id, slug, data, order_counter) values ($1, $2, $3::text::jsonb, $4)`, [
    business.id,
    slug,
    json(businessDoc(business)),
    business.orderCounter,
  ]);
  return business;
}

export interface SaveResult {
  business: Business;
  /** Mensaje si algo no se pudo aplicar (p. ej. slug ocupado: se conserva el anterior). */
  error?: string;
  previousSlug?: string;
}

/** Guarda el documento del menú. El id y el contador de pedidos no se pueden cambiar desde aquí. */
export async function saveBusiness(input: Business): Promise<SaveResult> {
  const current = await getBusinessRow(input.id);
  if (!current) throw new RepoError("Negocio no encontrado.");
  const prevSlug = current.business.slug;
  let slug = sanitizeSlug(input.slug).replace(/^-+|-+$/g, "") || prevSlug;
  let error: string | undefined;
  if (slug !== prevSlug && (await isSlugTaken(slug, input.id))) {
    error = `El slug “${slug}” ya está en uso.`;
    slug = prevSlug;
  }
  const d = await db();
  await d.query(`update businesses set slug = $2, data = $3::text::jsonb, updated_at = now() where id = $1`, [input.id, slug, json(businessDoc(input))]);
  if (slug !== prevSlug) {
    await d.query(
      `insert into slug_redirects (slug, business_id) values ($1, $2) on conflict (slug) do update set business_id = excluded.business_id`,
      [prevSlug, input.id],
    );
    await d.query(`delete from slug_redirects where slug = $1`, [slug]);
  }
  return { business: { ...input, slug, orderCounter: current.business.orderCounter }, error, previousSlug: slug !== prevSlug ? prevSlug : undefined };
}

export async function setBusinessStatus(id: string, status: BusinessStatusKey): Promise<void> {
  await (await db()).query(`update businesses set status = $2, updated_at = now() where id = $1`, [id, status]);
}

export async function setCustomDomain(id: string, domain: string | null): Promise<void> {
  const d = domain ? normalizeDomain(domain) : null;
  if (d && !isValidDomain(d)) throw new RepoError("Dominio no válido. Ej. menu.tunegocio.com");
  const conn = await db();
  if (d) {
    const [taken] = await conn.query(`select 1 from businesses where custom_domain = $1 and id <> $2`, [d, id]);
    if (taken) throw new RepoError("Ese dominio ya está asignado a otro negocio.");
  }
  await conn.query(`update businesses set custom_domain = $2, updated_at = now() where id = $1`, [id, d]);
}

export async function deleteBusiness(id: string): Promise<void> {
  await (await db()).query(`delete from businesses where id = $1`, [id]);
}

/** Solo el negocio demo: vuelve al seed original (menú y pedidos). */
export async function resetDemoBusiness(): Promise<void> {
  await insertDemo(await db());
}

export const isDemoBusiness = (id: string) => id === DEMO_BUSINESS_ID;

/* ───────────── Pedidos ───────────── */

interface OrderDbRow {
  data: Order;
  status: string;
}

export async function listOrders(businessId: string, limit = 300): Promise<Order[]> {
  const rows = await (await db()).query<OrderDbRow>(
    `select data, status from orders where business_id = $1 order by created_at desc, number desc limit $2`,
    [businessId, limit],
  );
  return rows.map((r) => ({ ...r.data, status: r.status as Order["status"] }));
}

/** Número que verá el cliente en su mensaje de WhatsApp. */
export async function nextOrderNumber(businessId: string): Promise<number | null> {
  const [r] = await (await db()).query<{ n: number }>(`select order_counter + 1 as n from businesses where id = $1`, [businessId]);
  return r?.n ?? null;
}

/** Registra el pedido enviado por WhatsApp. El número avanza de forma atómica. */
export async function createOrder(businessId: string, draft: OrderDraft, now: Date = new Date()): Promise<Order> {
  const d = await db();
  const [biz] = await d.query<{ n: number; tz: string | null }>(
    `update businesses set order_counter = greatest(order_counter + 1, $2)
     where id = $1 and status = 'active'
     returning order_counter as n, data->'settings'->>'timezone' as tz`,
    [businessId, draft.number],
  );
  if (!biz) throw new RepoError("Negocio no disponible.");
  const tz = biz.tz ?? undefined;
  const order: Order = {
    ...draft,
    id: "ord_" + biz.n,
    number: biz.n,
    time: zonedTime(now, tz),
    date: new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now),
    status: "pending",
    source: "whatsapp",
    isNew: true,
  };
  await d.query(
    `insert into orders (business_id, id, number, status, data) values ($1, $2, $3, $4, $5::text::jsonb)
     on conflict (business_id, id) do update set number = excluded.number, status = excluded.status, data = excluded.data`,
    [businessId, order.id, order.number, order.status, json(order)],
  );
  return order;
}

export async function updateOrder(businessId: string, orderId: string, patch: Partial<Pick<Order, "status" | "isNew">>): Promise<Order | null> {
  const [r] = await (await db()).query<OrderDbRow>(
    `update orders set data = data || $3::text::jsonb, status = coalesce($4, status)
     where business_id = $1 and id = $2 returning data, status`,
    [businessId, orderId, json(patch), patch.status ?? null],
  );
  return r ? { ...r.data, status: r.status as Order["status"] } : null;
}

/* ───────────── Usuarios ───────────── */

interface UserDbRow {
  id: string;
  email: string;
  name: string;
  is_superadmin: boolean;
  created_at: Date | string;
  password_hash?: string;
}

const toUser = (r: UserDbRow): User => ({ id: r.id, email: r.email, name: r.name, isSuperadmin: r.is_superadmin, createdAt: iso(r.created_at) });

export async function countUsers(): Promise<number> {
  const [r] = await (await db()).query<{ n: number }>(`select count(*)::int as n from users`);
  return r?.n ?? 0;
}

export async function getUserById(id: string): Promise<User | null> {
  const [r] = await (await db()).query<UserDbRow>(`select * from users where id = $1`, [id]);
  return r ? toUser(r) : null;
}

/** Usuario + hash (solo para el login). */
export async function getUserForLogin(email: string): Promise<(User & { passwordHash: string }) | null> {
  const [r] = await (await db()).query<UserDbRow>(`select * from users where email = $1`, [email.trim().toLowerCase()]);
  return r ? { ...toUser(r), passwordHash: r.password_hash ?? "" } : null;
}

export async function createUser(input: { email: string; name: string; password: string; isSuperadmin?: boolean }): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const d = await db();
  const [exists] = await d.query(`select 1 from users where email = $1`, [email]);
  if (exists) throw new RepoError("Ya existe una cuenta con ese correo.");
  const [r] = await d.query<UserDbRow>(
    `insert into users (id, email, name, password_hash, is_superadmin) values ($1, $2, $3, $4, $5) returning *`,
    [newId("usr"), email, input.name.trim(), await hashPassword(input.password), !!input.isSuperadmin],
  );
  return toUser(r!);
}

export async function updateUser(id: string, patch: { name?: string; password?: string }): Promise<void> {
  const d = await db();
  if (patch.name !== undefined) await d.query(`update users set name = $2 where id = $1`, [id, patch.name.trim()]);
  if (patch.password !== undefined) await d.query(`update users set password_hash = $2 where id = $1`, [id, await hashPassword(patch.password)]);
}

export async function deleteUser(id: string): Promise<void> {
  await (await db()).query(`delete from users where id = $1 and not is_superadmin`, [id]);
}

export async function listUsers(): Promise<(User & { businessIds: string[] })[]> {
  const rows = await (await db()).query<UserDbRow & { business_ids: string[] | null }>(
    `select u.*, (select coalesce(array_agg(m.business_id), '{}') from memberships m where m.user_id = u.id) as business_ids
     from users u order by u.is_superadmin desc, u.email`,
  );
  return rows.map((r) => ({ ...toUser(r), businessIds: r.business_ids ?? [] }));
}

export async function addMembership(userId: string, businessId: string): Promise<void> {
  await (await db()).query(`insert into memberships (user_id, business_id) values ($1, $2) on conflict do nothing`, [userId, businessId]);
}

export async function removeMembership(userId: string, businessId: string): Promise<void> {
  await (await db()).query(`delete from memberships where user_id = $1 and business_id = $2`, [userId, businessId]);
}

export async function canAccessBusiness(user: User, businessId: string): Promise<boolean> {
  if (user.isSuperadmin) return !!(await getBusinessRow(businessId));
  const [r] = await (await db()).query(`select 1 from memberships where user_id = $1 and business_id = $2`, [user.id, businessId]);
  return !!r;
}
