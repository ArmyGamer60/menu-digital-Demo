import type { CartLine, ModifierGroup, PricingContext, Product, Promotion, Selections } from "@/types";
import { money } from "./money";

export function activePromotions(ctx: Pick<PricingContext, "promotions">): Promotion[] {
  // Fase 2: respetar también start/end.
  return ctx.promotions.filter((p) => p.active);
}

export function groupsFor(ctx: Pick<PricingContext, "modifierGroups">, product: Product): ModifierGroup[] {
  return product.modifierGroupIds
    .map((id) => ctx.modifierGroups.find((g) => g.id === id))
    .filter((g): g is ModifierGroup => Boolean(g));
}

/** Tiene variantes si alguno de sus grupos es kind 'variant' → "Desde $X". */
export function hasVariants(ctx: Pick<PricingContext, "modifierGroups">, product: Product): boolean {
  return groupsFor(ctx, product).some((g) => g.kind === "variant");
}

export function defaultSelections(ctx: Pick<PricingContext, "modifierGroups">, product: Product): Selections {
  const sel: Selections = {};
  for (const g of groupsFor(ctx, product)) {
    const def = g.options.filter((o) => o.isDefault).map((o) => o.id);
    if (def.length) sel[g.id] = def;
  }
  return sel;
}

export function missingRequired(
  ctx: Pick<PricingContext, "modifierGroups">,
  product: Product,
  sel: Selections,
): ModifierGroup[] {
  return groupsFor(ctx, product).filter((g) => g.required && !(sel[g.id] ?? []).length);
}

export function effectivePrice(
  ctx: Pick<PricingContext, "promotions">,
  product: Product,
): { price: number; compareAt: number | null } {
  const promo = activePromotions(ctx).find((p) => p.type === "price" && p.productId === product.id);
  if (promo) {
    const compareAt =
      product.compareAt && product.compareAt > promo.value
        ? product.compareAt
        : promo.value < product.price
          ? product.price
          : product.compareAt;
    return { price: promo.value, compareAt };
  }
  return { price: product.price, compareAt: product.compareAt };
}

export function lineUnitPrice(ctx: PricingContext, product: Product, sel: Selections): number {
  let unit = effectivePrice(ctx, product).price;
  for (const g of groupsFor(ctx, product)) {
    for (const oid of sel[g.id] ?? []) {
      const opt = g.options.find((x) => x.id === oid);
      if (opt) unit += opt.price;
    }
  }
  return unit;
}

/** Nombres de opciones elegidas ("Avena +$15"); omite opciones por defecto con precio 0. */
export function describeSelections(ctx: PricingContext, product: Product, sel: Selections): string[] {
  const out: string[] = [];
  for (const g of groupsFor(ctx, product)) {
    for (const oid of sel[g.id] ?? []) {
      const opt = g.options.find((x) => x.id === oid);
      if (opt && !(opt.isDefault && opt.price === 0)) {
        out.push(opt.name + (opt.price ? " +" + money(opt.price, ctx.settings.currency) : ""));
      }
    }
  }
  return out;
}

export interface AppliedPromo {
  name: string;
  amount: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  applied: AppliedPromo[];
  tax: number;
  total: number;
  count: number;
}

type TotalsLine = Pick<CartLine, "productId" | "categoryId" | "unit" | "qty">;

export function cartTotals(ctx: PricingContext, lines: TotalsLine[]): CartTotals {
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  let discount = 0;
  const applied: AppliedPromo[] = [];
  for (const p of activePromotions(ctx)) {
    if (p.type === "bogo") {
      // Por cada 2 unidades del producto, la más barata gratis.
      const units = lines
        .filter((l) => l.productId === p.productId)
        .flatMap((l) => Array<number>(l.qty).fill(l.unit))
        .sort((a, b) => a - b);
      const free = Math.floor(units.length / 2);
      const d = units.slice(0, free).reduce((s, u) => s + u, 0);
      if (d) {
        discount += d;
        applied.push({ name: p.name, amount: d });
      }
    }
    if (p.type === "percent") {
      const base = lines
        .filter(
          (l) => (p.categoryId && l.categoryId === p.categoryId) || (p.productId && l.productId === p.productId),
        )
        .reduce((s, l) => s + l.unit * l.qty, 0);
      const d = Math.round(base * p.value) / 100;
      if (d) {
        discount += d;
        applied.push({ name: p.name, amount: d });
      }
    }
  }
  const taxable = subtotal - discount;
  const tax = ctx.settings.taxEnabled ? Math.round(taxable * ctx.settings.taxRate) / 100 : 0;
  return { subtotal, discount, applied, tax, total: taxable + tax, count: lines.reduce((s, l) => s + l.qty, 0) };
}
