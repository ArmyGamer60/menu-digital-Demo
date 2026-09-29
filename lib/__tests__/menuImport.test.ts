import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seedBusiness } from "@/data/seed";
import { applyMenuImport } from "@/lib/menuImport";
import { cartTotals, lineUnitPrice } from "@/lib/pricing";

const base = () => structuredClone(seedBusiness);

const minimal = {
  categories: [{ id: "cat_a", name: "Café" }],
  modifierGroups: [
    {
      id: "mg_t",
      name: "Tamaño",
      kind: "variant",
      type: "single",
      required: true,
      options: [
        { id: "o_s", name: "12 oz", price: 0, isDefault: true },
        { id: "o_b", name: "16 oz", price: 10 },
      ],
    },
  ],
  products: [{ id: "pr_a", categoryId: "cat_a", name: "Americano", price: 45, modifierGroupIds: ["mg_t"] }],
};

describe("importar menú", () => {
  it("reemplaza el catálogo con valores por defecto y conserva id, slug y contador", () => {
    const r = applyMenuImport(base(), { ...minimal, name: "Café Cremata", theme: { primary: "#C85A1E" } });
    if (!r.ok) throw new Error(r.error);
    expect(r.business).toMatchObject({ id: seedBusiness.id, slug: seedBusiness.slug, orderCounter: seedBusiness.orderCounter, name: "Café Cremata" });
    expect(r.business.theme.primary).toBe("#C85A1E");
    expect(r.business.theme.fontPair).toBe(seedBusiness.theme.fontPair); // tema parcial: se mezcla
    expect(r.business.products[0]).toMatchObject({ status: "published", tags: [], badge: null, compareAt: null, image: "" });
    expect(r.business.categories[0]).toMatchObject({ order: 0, visible: true });
    expect(r.business.promotions).toEqual([]);
  });

  it("rechaza referencias rotas, ids repetidos y formato inválido sin tocar nada", () => {
    const broken = structuredClone(minimal);
    broken.products[0]!.modifierGroupIds = ["mg_no"];
    expect(applyMenuImport(base(), broken)).toMatchObject({ ok: false, error: expect.stringMatching(/modificador que no existe/) });
    expect(applyMenuImport(base(), { ...minimal, products: [{ ...minimal.products[0], categoryId: "x" }] })).toMatchObject({ ok: false });
    expect(applyMenuImport(base(), { ...minimal, categories: [...minimal.categories, ...minimal.categories] })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/repetido/),
    });
    expect(applyMenuImport(base(), { categories: "no" })).toMatchObject({ ok: false });
  });

  // Archivo real de un cliente (no se versiona): si está presente, debe importar y cobrar bien.
  it.runIf(existsSync("imports/cafe-cremata.json"))("imports/cafe-cremata.json es válido", () => {
    const r = applyMenuImport(base(), JSON.parse(readFileSync("imports/cafe-cremata.json", "utf8")));
    if (!r.ok) throw new Error(r.error);
    const b = r.business;
    const p = (name: string) => b.products.find((x) => x.name === name)!;
    const big = (name: string) => b.modifierGroups.find((g) => g.id === p(name).modifierGroupIds[0])!.options[1]!;
    expect(b.products).toHaveLength(43);
    expect([p("Americano").price, p("Americano").price + big("Americano").price]).toEqual([45, 55]);
    expect([p("Frappé Lotus").price, p("Frappé Lotus").price + big("Frappé Lotus").price]).toEqual([95, 115]);
    expect([p("Matcha cloud").price, p("Matcha cloud").price + big("Matcha cloud").price]).toEqual([85, 110]);
    // Precio real calculado desde los modificadores: Latte 16 oz + leche de avena.
    const latte = p("Latte");
    const size = latte.modifierGroupIds[0]!;
    const unit = lineUnitPrice(b, latte, { [size]: [`${size}_b`], mg_extras: ["mg_extras_leche_de_avena"] });
    const totals = cartTotals(b, [{ productId: latte.id, categoryId: latte.categoryId, unit, qty: 2 }]);
    expect(totals.total).toBe(2 * (65 + 9));
  });
});
