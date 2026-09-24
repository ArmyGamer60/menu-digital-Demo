import type { Business, OrderDraft } from "@/types";
import { money, pad } from "./money";

/** Genera el texto del pedido con el formato exacto del README (negritas con * de WhatsApp). */
export function generateWhatsAppMessage(order: OrderDraft, business: Pick<Business, "name" | "settings">): string {
  const s = business.settings;
  const m = (n: number) => money(n, s.currency);
  const L: string[] = [];
  L.push(s.greeting || "Hola, quiero realizar el siguiente pedido:");
  L.push("");
  L.push("*" + business.name.toUpperCase() + "*");
  L.push("*PEDIDO #" + pad(order.number) + "*");
  L.push("");
  L.push("Modalidad: " + (order.mode === "dinein" ? "Comer aquí" : "Recoger"));
  L.push("Cliente: " + order.customer.name);
  if (order.customer.phone) L.push("Teléfono: " + order.customer.phone);
  if (order.mode === "dinein" && order.customer.table) L.push("Mesa: " + order.customer.table);
  if (order.mode === "dinein" && order.customer.guests) L.push("Personas: " + order.customer.guests);
  if (order.mode === "pickup" && order.customer.pickupTime) L.push("Hora de recogida: " + order.customer.pickupTime);
  L.push("");
  L.push("*PRODUCTOS*");
  for (const it of order.items) {
    L.push(it.qty + " × " + it.name + " — " + m(it.unit * it.qty));
    if (it.mods.length) L.push("   " + it.mods.join(", "));
    if (it.notes) L.push("   Nota: " + it.notes);
  }
  L.push("");
  L.push("Subtotal: " + m(order.subtotal));
  if (order.discount) L.push("Descuento: −" + m(order.discount));
  if (order.tax) L.push("Impuestos (" + s.taxRate + "%): " + m(order.tax));
  if (order.notes) {
    L.push("");
    L.push("Notas:");
    L.push(order.notes);
  }
  L.push("");
  L.push("*Total: " + m(order.total) + "*");
  if (s.closing) {
    L.push("");
    L.push(s.closing);
  }
  return L.join("\n");
}

export function whatsappUrl(phone: string, message: string): string {
  return "https://wa.me/" + String(phone).replace(/\D/g, "") + "?text=" + encodeURIComponent(message);
}

/** Abre wa.me con el mensaje. En móvil usa location.href (evita bloqueadores de pop-ups y abre la app);
    en escritorio abre una pestaña nueva para no perder el menú. Llamar de forma síncrona en el click. */
export function openWhatsApp(message: string, phone: string): string {
  const url = whatsappUrl(phone, message);
  if (typeof window === "undefined") return url;
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch) {
    window.location.href = url;
  } else {
    // Sin "noopener" en features: con él window.open devuelve null y no se puede detectar el bloqueo.
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
  }
  return url;
}
