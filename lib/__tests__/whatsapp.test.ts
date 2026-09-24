import { describe, expect, it } from "vitest";
import { seedBusiness } from "@/data/seed";
import { generateWhatsAppMessage, whatsappUrl } from "@/lib/whatsapp";
import type { OrderDraft } from "@/types";

const pickupOrder: OrderDraft = {
  number: 25,
  mode: "pickup",
  customer: { name: "Andrés Mendoza", phone: "668 145 2231", table: null, guests: null, pickupTime: "10:50" },
  items: [{ productId: "pr_latte", name: "Latte Caramelo", qty: 2, unit: 95, mods: ["Grande +$20", "Avena +$15"], notes: "sin azúcar" }],
  notes: "Sin azúcar en el latte.",
  subtotal: 300,
  discount: 45,
  tax: 41,
  total: 300,
};

describe("generateWhatsAppMessage", () => {
  it("coincide con el formato exacto del README (recoger, con todo)", () => {
    const business = { ...seedBusiness, settings: { ...seedBusiness.settings, taxEnabled: true, taxRate: 16 } };
    expect(generateWhatsAppMessage(pickupOrder, business)).toBe(
      [
        "Hola, quiero realizar el siguiente pedido:",
        "",
        "*MOLIENDA*",
        "*PEDIDO #025*",
        "",
        "Modalidad: Recoger",
        "Cliente: Andrés Mendoza",
        "Teléfono: 668 145 2231",
        "Hora de recogida: 10:50",
        "",
        "*PRODUCTOS*",
        "2 × Latte Caramelo — $190",
        "   Grande +$20, Avena +$15",
        "   Nota: sin azúcar",
        "",
        "Subtotal: $300",
        "Descuento: −$45",
        "Impuestos (16%): $41",
        "",
        "Notas:",
        "Sin azúcar en el latte.",
        "",
        "*Total: $300*",
        "",
        "Gracias, quedo pendiente de la confirmación.",
      ].join("\n"),
    );
  });

  it("comer aquí: mesa y personas, omite líneas vacías opcionales", () => {
    const order: OrderDraft = {
      number: 7,
      mode: "dinein",
      customer: { name: "Mariana", phone: "", table: "7", guests: 3, pickupTime: null },
      items: [
        { productId: "pr_crois", name: "Croissant de mantequilla", qty: 1, unit: 48, mods: [] },
        { productId: "pr_amer", name: "Americano", qty: 2, unit: 45, mods: [], notes: "" },
      ],
      notes: "",
      subtotal: 138,
      discount: 0,
      tax: 0,
      total: 138,
    };
    expect(generateWhatsAppMessage(order, seedBusiness)).toBe(
      [
        "Hola, quiero realizar el siguiente pedido:",
        "",
        "*MOLIENDA*",
        "*PEDIDO #007*",
        "",
        "Modalidad: Comer aquí",
        "Cliente: Mariana",
        "Mesa: 7",
        "Personas: 3",
        "",
        "*PRODUCTOS*",
        "1 × Croissant de mantequilla — $48",
        "2 × Americano — $90",
        "",
        "Subtotal: $138",
        "",
        "*Total: $138*",
        "",
        "Gracias, quedo pendiente de la confirmación.",
      ].join("\n"),
    );
  });

  it("no incluye mesa/personas en recoger ni hora de recogida en comer aquí", () => {
    const msg = generateWhatsAppMessage(
      { ...pickupOrder, mode: "dinein", customer: { name: "X", table: null, guests: null, pickupTime: "10:50" } },
      seedBusiness,
    );
    expect(msg).not.toContain("Hora de recogida");
    expect(msg).not.toContain("Mesa:");
  });

  it("sin mensaje de cierre termina en el total; saludo por defecto si está vacío", () => {
    const business = { ...seedBusiness, settings: { ...seedBusiness.settings, greeting: "", closing: "" } };
    const msg = generateWhatsAppMessage({ ...pickupOrder, discount: 0, tax: 0 }, business);
    expect(msg.startsWith("Hola, quiero realizar el siguiente pedido:\n")).toBe(true);
    expect(msg.endsWith("*Total: $300*")).toBe(true);
  });
});

describe("whatsappUrl", () => {
  it("limpia el número y codifica el mensaje", () => {
    expect(whatsappUrl("+52 668 812-4410", "Hola *A*\n2 × B")).toBe(
      "https://wa.me/526688124410?text=Hola%20*A*%0A2%20%C3%97%20B",
    );
  });
});
