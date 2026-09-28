import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { afterAll, beforeAll, expect, it } from "vitest";

/* Mismo código que en producción (driver postgres.js por TCP) contra un Postgres local (PGlite + socket). */
let server: PGLiteSocketServer;
beforeAll(async () => {
  const pg = await PGlite.create();
  server = new PGLiteSocketServer({ db: pg, port: 54329, host: "127.0.0.1" });
  await server.start();
  process.env.DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:54329/postgres";
});
afterAll(async () => server.stop());

it("postgres.js: flujo completo", { timeout: 60_000 }, async () => {
  const repo = await import("@/lib/repo");
  const row = await repo.getBusinessRowBySlug("molienda");
  expect(row?.business.name).toBe("Molienda");
  const b = await repo.createBusiness({ name: "Café Luna", slug: "cafe-luna", template: "demo" });
  const saved = await repo.saveBusiness({ ...b, name: "Luna", slug: "luna" });
  expect(saved.business.slug).toBe("luna");
  expect(await repo.resolveSlugRedirect("cafe-luna")).toBe("luna");
  const o = await repo.createOrder(b.id, {
    number: 1,
    mode: "pickup",
    customer: { name: "A" },
    items: [{ productId: "x", name: "x", qty: 1, unit: 1, mods: [] }],
    notes: "",
    subtotal: 1,
    discount: 0,
    total: 1,
  });
  expect(o.number).toBe(1);
  await repo.updateOrder(b.id, o.id, { status: "ready", isNew: false });
  await repo.updateOrder(b.id, o.id, { isNew: false });
  expect((await repo.listOrders(b.id))[0]).toMatchObject({ status: "ready", isNew: false });
  const u = await repo.createUser({ email: "a@b.mx", name: "A", password: "12345678" });
  await repo.addMembership(u.id, b.id);
  const sums = await repo.listBusinessSummaries();
  expect(sums.find((s) => s.id === b.id)).toMatchObject({ ordersTotal: 1, ordersLast30: 1, owners: [{ email: "a@b.mx" }] });
  expect((await repo.listUsers()).find((x) => x.id === u.id)?.businessIds).toEqual([b.id]);
  await repo.setCustomDomain(b.id, "menu.luna.mx");
  expect((await repo.getBusinessRowByDomain("menu.luna.mx"))?.business.id).toBe(b.id);
  expect(await repo.nextOrderNumber(b.id)).toBe(2);
  await repo.resetDemoBusiness();
  await repo.deleteBusiness(b.id);
  expect(await repo.getBusinessRow(b.id)).toBeNull();
});
