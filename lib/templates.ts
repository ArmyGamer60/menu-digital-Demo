/* Plantillas para dar de alta negocios nuevos. */
import { seedBusiness } from "@/data/seed";
import type { Business } from "@/types";

export type TemplateKey = "demo" | "blank";

export const TEMPLATES: { key: TemplateKey; label: string; help: string }[] = [
  { key: "blank", label: "En blanco", help: "Sin categorías ni productos; el cliente arma su menú." },
  { key: "demo", label: "Copia del demo", help: "Menú de cafetería de ejemplo (Molienda) listo para editar." },
];

export const DEMO_BUSINESS_ID = seedBusiness.id;

const initial = (name: string) => (name.trim()[0] ?? "M").toUpperCase();

export function businessFromTemplate(template: TemplateKey, id: string, name: string, slug: string): Business {
  const base = structuredClone(seedBusiness);
  const common = {
    id,
    name,
    slug,
    logoText: initial(name),
    logoImage: undefined,
    logoAlt: undefined,
    favicon: undefined,
    orderCounter: 0,
  } satisfies Partial<Business>;

  // Los datos de contacto nunca se copian: los pedidos irían al WhatsApp del demo.
  const contact = {
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    maps: "",
    settings: { ...base.settings, whatsappNumber: "", manualState: "auto" },
  } satisfies Partial<Business>;

  if (template === "demo") {
    return { ...base, ...common, ...contact, products: base.products.map((p) => ({ ...p, sold: 0 })) };
  }

  return {
    ...base,
    ...common,
    ...contact,
    tagline: "",
    description: "",
    theme: { ...base.theme, heroEnabled: false, heroTitle: "", heroText: "", heroImage: "" },
    categories: [],
    products: [],
    modifierGroups: [],
    promotions: [],
  };
}
