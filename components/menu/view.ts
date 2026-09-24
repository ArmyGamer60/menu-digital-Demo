import type { BadgeTone } from "@/components/ui";
import { money } from "@/lib/money";
import { effectivePrice, groupsFor, hasVariants } from "@/lib/pricing";
import type { BusinessStatus } from "@/lib/hours";
import type { Business, Category, Product } from "@/types";

export type DemoState = "closed" | "paused" | "empty" | "error" | "loading" | null;

export interface ProductView {
  product: Product;
  priceLabel: string;
  compareLabel: string | null;
  soldOut: boolean;
  badge: BadgeTone | null;
  /** Se muestra el botón "+" (no agotado y el negocio acepta pedidos). */
  canQuick: boolean;
  /** Tiene grupos obligatorios → "+" abre el sheet en lugar de agregar directo. */
  hasRequired: boolean;
}

export interface MenuSection {
  id: string;
  name: string;
  description: string;
  kind: "strip" | "products" | "empty";
  items: ProductView[];
}

export function productView(business: Business, product: Product, canOrder: boolean): ProductView {
  const ep = effectivePrice(business, product);
  const m = (n: number) => money(n, business.settings.currency);
  const soldOut = product.status === "soldout";
  return {
    product,
    priceLabel: (hasVariants(business, product) ? "Desde " : "") + m(ep.price),
    compareLabel: ep.compareAt ? m(ep.compareAt) : null,
    soldOut,
    badge: soldOut ? "agotado" : product.badge,
    canQuick: !soldOut && canOrder,
    hasRequired: groupsFor(business, product).some((g) => g.required),
  };
}

/** Productos visibles en el menú público: publicados o agotados, en una categoría visible. */
export function visibleProducts(business: Business): Product[] {
  const cats = new Set(business.categories.filter((c) => c.visible).map((c) => c.id));
  return business.products.filter((p) => (p.status === "published" || p.status === "soldout") && cats.has(p.categoryId));
}

export function visibleCategories(business: Business): Category[] {
  return business.categories.filter((c) => c.visible).sort((a, b) => a.order - b.order);
}

export function buildSections(business: Business, products: Product[], canOrder: boolean): MenuSection[] {
  const view = (p: Product) => productView(business, p, canOrder);
  const sections: MenuSection[] = [];
  const featured = products.filter((p) => p.featured && p.status === "published");
  if (featured.length) {
    sections.push({ id: "destacados", name: "Destacados", description: "", kind: "strip", items: featured.map(view) });
  }
  for (const c of visibleCategories(business)) {
    const items = products.filter((p) => p.categoryId === c.id).map(view);
    sections.push({ id: c.id, name: c.name, description: c.description, kind: items.length ? "products" : "empty", items });
  }
  return sections;
}

export function searchProducts(business: Business, products: Product[], query: string, canOrder: boolean): ProductView[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products
    .filter((p) => `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(q))
    .map((p) => productView(business, p, canOrder));
}

export const countLabel = (n: number) => (n ? `${n} ${n === 1 ? "producto" : "productos"}` : "");

/** Estado efectivo con overrides de demo (?demo=closed|paused). */
export function applyDemoStatus(status: BusinessStatus | null, demo: DemoState): BusinessStatus | null {
  if (demo === "closed") return { key: "closed", label: "Cerrado", canOrder: false, next: "hoy a las 17:00" };
  if (demo === "paused") return { key: "paused", label: "Pedidos en pausa", canOrder: false };
  return status;
}

export function closedCtaLabel(status: BusinessStatus | null): string {
  return status?.key === "paused" ? "Pedidos en pausa" : "Estamos cerrados";
}
