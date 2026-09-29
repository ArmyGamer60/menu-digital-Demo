/* Importar un menú completo (JSON) a un negocio existente.
   El archivo reemplaza catálogo (categorías, productos, modificadores, promociones) y, si vienen,
   actualiza datos del negocio, tema, configuración y horarios. Nunca cambia id, slug ni contador de pedidos. */
import { z } from "zod";
import type { Business } from "@/types";

const id = z.string().regex(/^[\w-]{1,64}$/, "id inválido (solo letras, números, _ y -)");
const money = z.number().finite().min(0).max(1_000_000);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);

const categorySchema = z.object({
  id,
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  image: z.string().max(2000).optional(),
  icon: z.string().max(40).optional(),
  order: z.number().int().optional(),
  visible: z.boolean().default(true),
});

const productSchema = z.object({
  id,
  categoryId: id,
  name: z.string().min(1).max(120),
  description: z.string().max(400).default(""),
  price: money,
  compareAt: money.nullable().default(null),
  image: z.string().max(2000).default(""),
  sku: z.string().max(40).optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  badge: z.enum(["nuevo", "popular", "especial", "recomendado"]).nullable().default(null),
  status: z.enum(["published", "draft", "soldout", "hidden", "archived"]).default("published"),
  featured: z.boolean().default(false),
  modifierGroupIds: z.array(id).max(20).default([]),
  sold: z.number().int().min(0).default(0),
});

const groupSchema = z.object({
  id,
  name: z.string().min(1).max(80),
  description: z.string().max(200).default(""),
  kind: z.enum(["variant", "option", "extra"]),
  type: z.enum(["single", "multiple"]),
  required: z.boolean().default(false),
  max: z.number().int().min(1).max(50).optional(),
  options: z
    .array(z.object({ id, name: z.string().min(1).max(80), price: money.default(0), isDefault: z.boolean().optional() }))
    .min(1)
    .max(60),
});

const promotionSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  type: z.enum(["bogo", "percent", "price"]),
  productId: id.optional(),
  categoryId: id.optional(),
  value: money.default(0),
  start: z.string().max(10).default(""),
  end: z.string().max(10).default(""),
  active: z.boolean().default(true),
  banner: z.string().max(200).default(""),
});

const text = (max: number) => z.string().max(max).optional();

export const menuImportSchema = z.object({
  name: text(120),
  tagline: text(120),
  description: text(400),
  address: text(200),
  phone: text(40),
  whatsapp: text(40),
  instagram: text(80),
  facebook: text(200),
  maps: text(500),
  logoText: text(2),
  theme: z
    .object({
      primary: hex,
      secondary: hex,
      accent: hex,
      background: hex,
      text: hex,
      fontPair: z.enum(["editorial", "moderna", "clasica", "urbana", "suave"]),
      cardStyle: z.enum(["minimal", "rounded", "editorial", "image-heavy", "compact", "premium"]),
      layout: z.enum(["grid", "list", "large", "compact"]),
      heroEnabled: z.boolean(),
      heroTitle: z.string().max(120),
      heroText: z.string().max(200),
      heroImage: z.string().max(2000),
    })
    .partial()
    .optional(),
  settings: z
    .object({
      dineIn: z.boolean(),
      pickup: z.boolean(),
      notesEnabled: z.boolean(),
      scheduleEnabled: z.boolean(),
      askGuests: z.boolean(),
      whatsappNumber: z.string().regex(/^\d{0,15}$/),
      greeting: z.string().max(300),
      closing: z.string().max(300),
      currency: z.enum(["MXN", "USD", "EUR", "COP"]),
      taxEnabled: z.boolean(),
      taxRate: z.number().min(0).max(100),
      timezone: z.string().max(60),
    })
    .partial()
    .optional(),
  hours: z
    .array(
      z.object({
        day: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
        label: z.string().max(20),
        active: z.boolean(),
        ranges: z.array(z.tuple([time, time])).max(4),
      }),
    )
    .length(7)
    .optional(),
  categories: z.array(categorySchema).max(200),
  products: z.array(productSchema).max(2000),
  modifierGroups: z.array(groupSchema).max(500).default([]),
  promotions: z.array(promotionSchema).max(200).default([]),
});

export type MenuImport = z.infer<typeof menuImportSchema>;

export type ImportResult = { ok: true; business: Business; summary: string } | { ok: false; error: string };

function dupes(ids: string[]): string[] {
  const seen = new Set<string>();
  return [...new Set(ids.filter((x) => (seen.has(x) ? true : (seen.add(x), false))))];
}

/** Valida el JSON y devuelve el negocio con el menú importado (sin guardar). */
export function applyMenuImport(business: Business, raw: unknown): ImportResult {
  const parsed = menuImportSchema.safeParse(raw);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { ok: false, error: `Archivo no válido en “${i?.path.join(".") || "raíz"}”: ${i?.message ?? "formato incorrecto"}` };
  }
  const d = parsed.data;

  const catIds = new Set(d.categories.map((c) => c.id));
  const groupIds = new Set(d.modifierGroups.map((g) => g.id));
  const productIds = new Set(d.products.map((p) => p.id));
  for (const [label, list] of [
    ["categorías", d.categories.map((c) => c.id)],
    ["productos", d.products.map((p) => p.id)],
    ["modificadores", d.modifierGroups.map((g) => g.id)],
  ] as const) {
    const repeated = dupes([...list]);
    if (repeated.length) return { ok: false, error: `Hay ${label} con id repetido: ${repeated.join(", ")}` };
  }
  for (const p of d.products) {
    if (!catIds.has(p.categoryId)) return { ok: false, error: `“${p.name}” usa una categoría que no existe (${p.categoryId}).` };
    const missing = p.modifierGroupIds.find((g) => !groupIds.has(g));
    if (missing) return { ok: false, error: `“${p.name}” usa un modificador que no existe (${missing}).` };
  }
  for (const pr of d.promotions) {
    if (pr.productId && !productIds.has(pr.productId)) return { ok: false, error: `La promoción “${pr.name}” apunta a un producto que no existe.` };
    if (pr.categoryId && !catIds.has(pr.categoryId)) return { ok: false, error: `La promoción “${pr.name}” apunta a una categoría que no existe.` };
  }

  const next: Business = {
    ...business,
    name: d.name ?? business.name,
    tagline: d.tagline ?? business.tagline,
    description: d.description ?? business.description,
    address: d.address ?? business.address,
    phone: d.phone ?? business.phone,
    whatsapp: d.whatsapp ?? business.whatsapp,
    instagram: d.instagram ?? business.instagram,
    facebook: d.facebook ?? business.facebook,
    maps: d.maps ?? business.maps,
    logoText: d.logoText ?? business.logoText,
    theme: { ...business.theme, ...d.theme },
    settings: { ...business.settings, ...d.settings },
    hours: d.hours ?? business.hours,
    categories: d.categories.map((c, i) => ({ ...c, order: c.order ?? i })),
    products: d.products,
    modifierGroups: d.modifierGroups,
    promotions: d.promotions,
  };
  const summary = `${d.categories.length} categorías, ${d.products.length} productos, ${d.modifierGroups.length} grupos de modificadores`;
  return { ok: true, business: next, summary };
}
