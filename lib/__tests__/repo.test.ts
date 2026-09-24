import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedBusiness } from "@/data/seed";
import {
  createOrder,
  getBusinessById,
  getBusinessBySlug,
  listOrders,
  resetDemo,
  saveBusiness,
  updateOrder,
} from "@/lib/repo";
import type { OrderDraft } from "@/types";

// localStorage en memoria (el entorno de Vitest es node).
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
});

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

describe("repo (fase 1: localStorage)", () => {
  it("sin datos guardados devuelve el seed", async () => {
    expect((await getBusinessBySlug("molienda"))?.name).toBe("Molienda");
    expect(await getBusinessBySlug("no-existe")).toBeNull();
  });

  it("los cambios del panel se leen en el menú; un slug renombrado sigue resolviendo", async () => {
    const b = (await getBusinessById(seedBusiness.id))!;
    await saveBusiness({ ...b, name: "Cafe Cremata", slug: "cremata" });
    expect((await getBusinessBySlug("cremata"))?.name).toBe("Cafe Cremata");
    expect((await getBusinessBySlug("molienda"))?.name).toBe("Cafe Cremata"); // URL original
  });

  it("createOrder numera, marca como nuevo y avanza el contador", async () => {
    const o = await createOrder(seedBusiness.id, draft);
    expect(o).toMatchObject({ number: 25, id: "ord_25", status: "pending", isNew: true, source: "whatsapp" });
    expect((await listOrders(seedBusiness.id))[0]?.id).toBe("ord_25");
    expect((await getBusinessById(seedBusiness.id))?.orderCounter).toBe(25);
    expect((await createOrder(seedBusiness.id, draft)).number).toBe(26);
  });

  it("updateOrder y resetDemo", async () => {
    await updateOrder(seedBusiness.id, "ord_24", { status: "ready", isNew: false });
    expect((await listOrders(seedBusiness.id)).find((o) => o.id === "ord_24")?.status).toBe("ready");
    const r = await resetDemo(seedBusiness.id);
    expect(r.orders.find((o) => o.id === "ord_24")?.status).toBe("pending");
  });
});
