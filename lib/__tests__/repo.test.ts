import { beforeEach, describe, expect, it } from "vitest";
import { seedBusiness } from "@/data/seed";
import { resetDbForTests } from "@/lib/db";
import {
  addMembership,
  canAccessBusiness,
  createBusiness,
  createOrder,
  createUser,
  getBusinessRow,
  getBusinessRowByDomain,
  getBusinessRowBySlug,
  getUserForLogin,
  listBusinessSummaries,
  listBusinessSummariesForUser,
  listOrders,
  normalizeDomain,
  resetDemoBusiness,
  resolveSlugRedirect,
  saveBusiness,
  setBusinessStatus,
  setCustomDomain,
  updateOrder,
} from "@/lib/repo";
import type { OrderDraft } from "@/types";

// PGlite en memoria: cada test arranca con una base limpia (esquema + demo sembrado).
process.env.MD_DB = "memory";
beforeEach(() => resetDbForTests());

const draft: OrderDraft = {
  number: 25,
  mode: "pickup",
  customer: { name: "Ana", phone: "6681234567", pickupTime: "10:00" },
  items: [{ productId: "pr_latte", name: "Latte Caramelo", qty: 1, unit: 65, mods: [] }],
  notes: "",
  subtotal: 65,
  discount: 0,
  tax: 0,
  total: 65,
};

describe("repo (Postgres)", { timeout: 30_000 }, () => {
  it("siembra el demo en una base vacía", async () => {
    const row = await getBusinessRowBySlug("molienda");
    expect(row?.business.name).toBe("Molienda");
    expect(row?.business.orderCounter).toBe(seedBusiness.orderCounter);
    expect(row?.status).toBe("active");
    expect(await getBusinessRowBySlug("no-existe")).toBeNull();
    expect((await listOrders(seedBusiness.id)).map((o) => o.number)).toEqual([24, 23, 22, 21, 20, 19]);
  });

  it("guardar cambia el menú; el slug anterior redirige; no se puede robar un slug ocupado", async () => {
    const b = (await getBusinessRow(seedBusiness.id))!.business;
    await saveBusiness({ ...b, name: "Cafe Cremata", slug: "cremata", orderCounter: 999 });
    const row = await getBusinessRowBySlug("cremata");
    expect(row?.business.name).toBe("Cafe Cremata");
    expect(row?.business.orderCounter).toBe(seedBusiness.orderCounter); // el contador no se pisa desde el panel
    expect(await resolveSlugRedirect("molienda")).toBe("cremata");

    const other = await createBusiness({ name: "Otro", slug: "otro", template: "blank" });
    const r = await saveBusiness({ ...other, slug: "cremata" });
    expect(r.error).toMatch(/en uso/);
    expect(r.business.slug).toBe("otro");
    // El slug anterior queda reservado por la redirección.
    await expect(createBusiness({ name: "X", slug: "molienda", template: "blank" })).rejects.toThrow(/en uso/);
  });

  it("plantillas: en blanco sin productos; copia del demo con su menú", async () => {
    const blank = await createBusiness({ name: "Café Luna", slug: "cafe-luna", template: "blank" });
    const demo = await createBusiness({ name: "Taquería", slug: "taqueria", template: "demo" });
    expect(blank).toMatchObject({ slug: "cafe-luna", logoText: "C", orderCounter: 0, products: [] });
    expect(demo.products.length).toBe(seedBusiness.products.length);
    expect(demo.products.every((p) => p.sold === 0)).toBe(true);
    // Nunca se copia el contacto del demo (los pedidos irían a su WhatsApp).
    expect(demo).toMatchObject({ whatsapp: "", address: "", settings: { whatsappNumber: "" } });
    expect(demo.id).not.toBe(seedBusiness.id);
    expect(await listOrders(demo.id)).toEqual([]);
  });

  it("createOrder numera de forma atómica y solo en negocios activos", async () => {
    const o = await createOrder(seedBusiness.id, draft, new Date("2026-09-27T18:05:00Z"));
    // Hora y fecha en la zona del negocio (America/Mazatlan, GMT−7).
    expect(o).toMatchObject({ number: 25, id: "ord_25", status: "pending", isNew: true, time: "11:05", date: "2026-09-27" });
    const [a, b] = await Promise.all([createOrder(seedBusiness.id, draft), createOrder(seedBusiness.id, draft)]);
    expect(new Set([a.number, b.number])).toEqual(new Set([26, 27]));
    expect((await getBusinessRow(seedBusiness.id))?.business.orderCounter).toBe(27);

    await setBusinessStatus(seedBusiness.id, "suspended");
    await expect(createOrder(seedBusiness.id, draft)).rejects.toThrow();
  });

  it("updateOrder y restablecer demo", async () => {
    await updateOrder(seedBusiness.id, "ord_24", { status: "ready", isNew: false });
    expect((await listOrders(seedBusiness.id)).find((o) => o.id === "ord_24")?.status).toBe("ready");
    await resetDemoBusiness();
    expect((await listOrders(seedBusiness.id)).find((o) => o.id === "ord_24")?.status).toBe("pending");
  });

  it("usuarios y accesos: cada dueño solo ve sus negocios; el superadmin ve todos", async () => {
    const luna = await createBusiness({ name: "Café Luna", slug: "cafe-luna", template: "blank" });
    const ana = await createUser({ email: " Ana@Luna.mx ", name: "Ana", password: "clave-segura-1" });
    const root = await createUser({ email: "root@app.mx", name: "", password: "clave-segura-2", isSuperadmin: true });
    await addMembership(ana.id, luna.id);
    expect((await getUserForLogin("ana@luna.mx"))?.id).toBe(ana.id);
    await expect(createUser({ email: "ana@luna.mx", name: "", password: "x".repeat(8) })).rejects.toThrow(/Ya existe/);

    expect(await canAccessBusiness(ana, luna.id)).toBe(true);
    expect(await canAccessBusiness(ana, seedBusiness.id)).toBe(false);
    expect(await canAccessBusiness(root, seedBusiness.id)).toBe(true);
    expect((await listBusinessSummariesForUser(ana.id)).map((b) => b.slug)).toEqual(["cafe-luna"]);
    const all = await listBusinessSummaries();
    expect(all.map((b) => b.slug)).toEqual(["molienda", "cafe-luna"]);
    expect(all[1]?.owners.map((o) => o.email)).toEqual(["ana@luna.mx"]);
  });

  it("dominio propio: normaliza, resuelve con y sin www y no se duplica", async () => {
    expect(normalizeDomain("https://Menu.SuCafe.com:443/x?y")).toBe("menu.sucafe.com");
    await setCustomDomain(seedBusiness.id, "https://www.molienda.mx/");
    expect((await getBusinessRowByDomain("molienda.mx"))?.business.id).toBe(seedBusiness.id);
    expect((await getBusinessRowByDomain("WWW.molienda.mx"))?.business.id).toBe(seedBusiness.id);
    const other = await createBusiness({ name: "Otro", slug: "otro", template: "blank" });
    await expect(setCustomDomain(other.id, "www.molienda.mx")).rejects.toThrow(/asignado/);
    await expect(setCustomDomain(other.id, "no es dominio")).rejects.toThrow(/no válido/);
  });
});
