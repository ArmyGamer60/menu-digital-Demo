import { describe, expect, it } from "vitest";
import { seedBusiness } from "@/data/seed";
import type { Business, CartLine, Product, Promotion } from "@/types";
import {
  cartTotals,
  describeSelections,
  effectivePrice,
  lineUnitPrice,
  hasVariants,
  missingRequired,
  defaultSelections,
} from "@/lib/pricing";

const biz = (patch: Partial<Business> = {}): Business => ({ ...structuredClone(seedBusiness), ...patch });
const product = (id: string) => seedBusiness.products.find((p) => p.id === id) as Product;
const line = (productId: string, qty: number, unit: number, categoryId = product(productId).categoryId): CartLine => ({
  id: `${productId}-${unit}`,
  productId,
  categoryId,
  name: product(productId).name,
  image: "",
  qty,
  sel: {},
  notes: "",
  unit,
  mods: [],
});
const onlyPromo = (promo: Promotion) => biz({ promotions: [promo] });

describe("cartTotals — bogo (2x1)", () => {
  const bogo: Promotion = { id: "p", name: "2x1 en americanos", type: "bogo", productId: "pr_amer", value: 0, start: "", end: "", active: true, banner: "" };

  it("regala la unidad más barata por cada par, entre líneas distintas", () => {
    const t = cartTotals(onlyPromo(bogo), [line("pr_amer", 2, 65), line("pr_amer", 1, 45)]);
    expect(t.subtotal).toBe(175);
    expect(t.discount).toBe(45); // 3 unidades → 1 gratis, la de $45
    expect(t.applied).toEqual([{ name: "2x1 en americanos", amount: 45 }]);
    expect(t.total).toBe(130);
    expect(t.count).toBe(3);
  });

  it("con 4 unidades regala las 2 más baratas", () => {
    const t = cartTotals(onlyPromo(bogo), [line("pr_amer", 2, 65), line("pr_amer", 2, 45)]);
    expect(t.discount).toBe(90);
  });

  it("una sola unidad no aplica y no aparece en applied", () => {
    const t = cartTotals(onlyPromo(bogo), [line("pr_amer", 1, 45), line("pr_latte", 3, 65)]);
    expect(t.discount).toBe(0);
    expect(t.applied).toEqual([]);
  });

  it("ignora promociones inactivas", () => {
    const t = cartTotals(onlyPromo({ ...bogo, active: false }), [line("pr_amer", 2, 45)]);
    expect(t.discount).toBe(0);
  });
});

describe("cartTotals — percent", () => {
  const pct: Promotion = { id: "p", name: "15% en postres", type: "percent", categoryId: "cat_postres", value: 15, start: "", end: "", active: true, banner: "" };

  it("aplica el % solo a las líneas de la categoría", () => {
    const t = cartTotals(onlyPromo(pct), [line("pr_cheese", 2, 85), line("pr_latte", 1, 65)]);
    expect(t.subtotal).toBe(235);
    expect(t.discount).toBe(25.5); // 15% de 170
    expect(t.total).toBe(209.5);
  });

  it("también funciona por producto", () => {
    const t = cartTotals(onlyPromo({ ...pct, categoryId: undefined, productId: "pr_latte" }), [line("pr_latte", 2, 100)]);
    expect(t.discount).toBe(30);
  });

  it("calcula impuestos sobre (subtotal − descuento) si taxEnabled", () => {
    const b = onlyPromo(pct);
    b.settings = { ...b.settings, taxEnabled: true, taxRate: 16 };
    const t = cartTotals(b, [line("pr_cheese", 2, 100)]);
    expect(t.discount).toBe(30);
    expect(t.tax).toBe(27.2); // 16% de 170
    expect(t.total).toBeCloseTo(197.2);
  });
});

describe("price promo (precio promocional)", () => {
  it("usa promo.value y conserva el compareAt mayor del producto", () => {
    const ep = effectivePrice(seedBusiness, product("pr_burger"));
    expect(ep).toEqual({ price: 175, compareAt: 195 });
  });

  it("sin compareAt previo, el precio original pasa a compareAt", () => {
    const b = onlyPromo({ id: "p", name: "Latte a $50", type: "price", productId: "pr_latte", value: 50, start: "", end: "", active: true, banner: "" });
    expect(effectivePrice(b, product("pr_latte"))).toEqual({ price: 50, compareAt: 65 });
  });

  it("cartTotals no descuenta de nuevo: el precio ya viene en unit", () => {
    const b = onlyPromo({ id: "p", name: "Latte a $50", type: "price", productId: "pr_latte", value: 50, start: "", end: "", active: true, banner: "" });
    const unit = lineUnitPrice(b, product("pr_latte"), { mg_size: ["o_gr"] });
    expect(unit).toBe(70);
    const t = cartTotals(b, [line("pr_latte", 2, unit)]);
    expect(t).toMatchObject({ subtotal: 140, discount: 0, total: 140 });
  });

  it("sin promo devuelve price/compareAt del producto", () => {
    expect(effectivePrice(biz({ promotions: [] }), product("pr_burger"))).toEqual({ price: 175, compareAt: 195 });
    expect(effectivePrice(biz({ promotions: [] }), product("pr_latte"))).toEqual({ price: 65, compareAt: null });
  });
});

describe("selecciones", () => {
  const latte = product("pr_latte");

  it("lineUnitPrice suma opciones de todos los grupos", () => {
    expect(lineUnitPrice(seedBusiness, latte, { mg_size: ["o_gr"], mg_milk: ["o_ave"], mg_extras: ["o_shot", "o_can"] })).toBe(120);
  });

  it("describeSelections omite defaults con precio 0 y formatea el precio", () => {
    expect(
      describeSelections(seedBusiness, latte, { mg_size: ["o_gr"], mg_milk: ["o_ent"], mg_extras: ["o_can"], mg_sweet: ["o_sin"] }),
    ).toEqual(["Grande +$20", "Canela", "Sin azúcar"]);
  });

  it("defaults, variantes y obligatorios", () => {
    expect(defaultSelections(seedBusiness, latte)).toEqual({ mg_milk: ["o_ent"], mg_sweet: ["o_norm"] });
    expect(hasVariants(seedBusiness, latte)).toBe(true);
    expect(hasVariants(seedBusiness, product("pr_crois"))).toBe(false);
    expect(missingRequired(seedBusiness, latte, {}).map((g) => g.id)).toEqual(["mg_size"]);
    expect(missingRequired(seedBusiness, latte, { mg_size: ["o_ch"] })).toEqual([]);
  });
});
