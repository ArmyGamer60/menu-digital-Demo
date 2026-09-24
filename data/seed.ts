/* Datos demo — portado de prototipo/data/demo.js (versión 3). */
import type { Business, FontPair, Order, OrderMode, OrderStatus, Product, ProductStatus, Badge } from "@/types";

export const SEED_VERSION = 3;

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=75&auto=format&fit=crop`;

export const FONT_PAIRS: Record<FontPair, { label: string; display: string; body: string }> = {
  editorial: { label: "Editorial", display: "Gloock", body: "Hanken Grotesk" },
  moderna: { label: "Moderna", display: "Bricolage Grotesque", body: "Hanken Grotesk" },
  clasica: { label: "Clásica", display: "Cormorant Garamond", body: "Karla" },
  urbana: { label: "Urbana", display: "Archivo Black", body: "Archivo" },
  suave: { label: "Suave", display: "Young Serif", body: "Figtree" },
};

export const PALETTES = [
  { name: "Terracota", primary: "#B4532A", secondary: "#2F4A3A", accent: "#E3A63B", background: "#F5EFE6", text: "#1F1B16" },
  { name: "Noche", primary: "#E0A458", secondary: "#8FB09A", accent: "#E86A4E", background: "#15130F", text: "#F3ECE0" },
  { name: "Pistache", primary: "#3F6B3A", secondary: "#B4532A", accent: "#D9C36A", background: "#F1F0E6", text: "#1C2119" },
  { name: "Mar", primary: "#1F4E79", secondary: "#C2553B", accent: "#F2B84B", background: "#F2F4F3", text: "#141A20" },
  { name: "Rosa", primary: "#C0395B", secondary: "#3A2A2F", accent: "#F4A261", background: "#FBF1EE", text: "#2A1A1F" },
] as const;

function p(
  id: string, categoryId: string, name: string, description: string, price: number, compareAt: number | null,
  photo: string, tags: string[], badge: Badge, status: ProductStatus, featured: boolean,
  modifierGroupIds: string[], sku: string, sold: number,
): Product {
  return { id, categoryId, name, description, price, compareAt, image: img(photo), tags, badge, status, featured, modifierGroupIds, sku, sold };
}

export const seedBusiness: Business = {
  id: "biz_001",
  name: "Molienda",
  slug: "molienda",
  tagline: "Café & Cocina",
  description: "Café de especialidad de Sinaloa, pan horneado cada mañana y cocina de temporada.",
  address: "Blvd. Rosales 412, Centro, Los Mochis, Sin.",
  phone: "668 812 4410",
  whatsapp: "526688124410",
  instagram: "@molienda.cafe",
  facebook: "facebook.com/molienda.cafe",
  maps: "https://maps.google.com/?q=Los+Mochis",
  logoText: "M",
  theme: {
    primary: PALETTES[0].primary,
    secondary: PALETTES[0].secondary,
    accent: PALETTES[0].accent,
    background: PALETTES[0].background,
    text: PALETTES[0].text,
    fontPair: "editorial",
    cardStyle: "editorial",
    layout: "grid",
    heroEnabled: true,
    heroTitle: "Temporada de otoño",
    heroText: "Chai de calabaza y pan de muerto desde $55.",
    heroImage: img("1447933601403-0c6688de566e"),
  },
  settings: {
    dineIn: true,
    pickup: true,
    notesEnabled: true,
    scheduleEnabled: true,
    askGuests: true,
    whatsappNumber: "526688124410",
    greeting: "Hola, quiero realizar el siguiente pedido:",
    closing: "Gracias, quedo pendiente de la confirmación.",
    currency: "MXN",
    taxEnabled: false,
    taxRate: 16,
    timezone: "America/Mazatlan",
    manualState: "open",
  },
  hours: [
    { day: 1, label: "Lunes", active: true, ranges: [["07:30", "13:00"], ["17:00", "22:30"]] },
    { day: 2, label: "Martes", active: true, ranges: [["07:30", "13:00"], ["17:00", "22:30"]] },
    { day: 3, label: "Miércoles", active: true, ranges: [["07:30", "13:00"], ["17:00", "22:30"]] },
    { day: 4, label: "Jueves", active: true, ranges: [["07:30", "13:00"], ["17:00", "22:30"]] },
    { day: 5, label: "Viernes", active: true, ranges: [["07:30", "23:00"]] },
    { day: 6, label: "Sábado", active: true, ranges: [["08:00", "23:00"]] },
    { day: 0, label: "Domingo", active: false, ranges: [["08:00", "14:00"]] },
  ],
  categories: [
    { id: "cat_cafe", name: "Café", description: "Espresso de origen Veracruz y Chiapas.", image: img("1509042239860-f550ce710b93"), visible: true, order: 1 },
    { id: "cat_frias", name: "Bebidas frías", description: "Para la tarde en Los Mochis.", image: img("1515823064-d6e0c04616a7"), visible: true, order: 2 },
    { id: "cat_desayunos", name: "Desayunos", description: "Hasta las 13:00.", image: img("1567620905732-2d1ec7ab7445"), visible: true, order: 3 },
    { id: "cat_comidas", name: "Comidas", description: "Cocina de temporada.", image: img("1512621776951-a57141f2eefd"), visible: true, order: 4 },
    { id: "cat_panaderia", name: "Panadería", description: "Horneado cada mañana.", image: img("1555507036-ab1f4038808a"), visible: true, order: 5 },
    { id: "cat_postres", name: "Postres", description: "Hechos en casa.", image: img("1571877227200-a0d98ea607e9"), visible: true, order: 6 },
    { id: "cat_temporada", name: "Temporada", description: "Muy pronto.", image: "", visible: true, order: 7 },
  ],
  modifierGroups: [
    { id: "mg_size", name: "Tamaño", description: "Chico 8oz · Mediano 12oz · Grande 16oz", kind: "variant", type: "single", required: true,
      options: [{ id: "o_ch", name: "Chico", price: 0 }, { id: "o_md", name: "Mediano", price: 10 }, { id: "o_gr", name: "Grande", price: 20 }] },
    { id: "mg_milk", name: "Leche", description: "", kind: "option", type: "single", required: false,
      options: [{ id: "o_ent", name: "Entera", price: 0, isDefault: true }, { id: "o_des", name: "Deslactosada", price: 10 }, { id: "o_alm", name: "Almendra", price: 15 }, { id: "o_ave", name: "Avena", price: 15 }] },
    { id: "mg_extras", name: "Extras", description: "Elige los que quieras", kind: "extra", type: "multiple", required: false, max: 4,
      options: [{ id: "o_shot", name: "Shot extra", price: 20 }, { id: "o_car", name: "Caramelo", price: 15 }, { id: "o_cre", name: "Crema batida", price: 15 }, { id: "o_can", name: "Canela", price: 0 }] },
    { id: "mg_sweet", name: "Endulzante", description: "", kind: "option", type: "single", required: false,
      options: [{ id: "o_norm", name: "Normal", price: 0, isDefault: true }, { id: "o_poco", name: "Poco dulce", price: 0 }, { id: "o_sin", name: "Sin azúcar", price: 0 }] },
    { id: "mg_cold", name: "Tamaño", description: "16oz · 20oz", kind: "variant", type: "single", required: true,
      options: [{ id: "o_c16", name: "Regular 16oz", price: 0 }, { id: "o_c20", name: "Grande 20oz", price: 15 }] },
    { id: "mg_salsa", name: "Salsa", description: "", kind: "option", type: "single", required: true,
      options: [{ id: "o_sv", name: "Verde", price: 0 }, { id: "o_sr", name: "Roja", price: 0 }, { id: "o_sd", name: "Divorciados", price: 0 }] },
    { id: "mg_protein", name: "Proteína", description: "", kind: "option", type: "single", required: false,
      options: [{ id: "o_np", name: "Sin proteína", price: 0, isDefault: true }, { id: "o_hu", name: "Huevo estrellado", price: 20 }, { id: "o_po", name: "Pollo", price: 35 }, { id: "o_ar", name: "Arrachera", price: 65 }] },
    { id: "mg_break", name: "Extras de desayuno", description: "", kind: "extra", type: "multiple", required: false, max: 3,
      options: [{ id: "o_agu", name: "Aguacate", price: 25 }, { id: "o_toc", name: "Tocino", price: 30 }, { id: "o_que", name: "Queso extra", price: 20 }] },
    { id: "mg_eggs", name: "Huevos", description: "", kind: "option", type: "single", required: true,
      options: [{ id: "o_est", name: "Estrellados", price: 0 }, { id: "o_rev", name: "Revueltos", price: 0 }, { id: "o_div", name: "Divorciados", price: 10 }] },
    { id: "mg_mode", name: "Acompañar", description: "", kind: "extra", type: "multiple", required: false, max: 2,
      options: [{ id: "o_hel", name: "Bola de helado de vainilla", price: 30 }, { id: "o_fr", name: "Frutos rojos", price: 20 }] },
  ],
  products: [
    p("pr_latte", "cat_cafe", "Latte Caramelo", "Espresso doble, leche vaporizada y caramelo de la casa.", 65, null, "1509042239860-f550ce710b93", ["Caliente", "Con leche"], "popular", "published", true, ["mg_size", "mg_milk", "mg_extras", "mg_sweet"], "CAF-001", 142),
    p("pr_capp", "cat_cafe", "Cappuccino", "Espresso, leche y espuma densa. Clásico.", 58, null, "1572442388796-11668a67e53d", ["Caliente"], null, "published", false, ["mg_size", "mg_milk", "mg_extras"], "CAF-002", 96),
    p("pr_amer", "cat_cafe", "Americano", "Espresso de Chiapas alargado con agua caliente.", 45, null, "1497935586351-b67a49e012bf", ["Caliente", "Vegano"], "especial", "published", false, ["mg_size", "mg_sweet"], "CAF-003", 88),
    p("pr_cold", "cat_cafe", "Cold Brew", "18 horas de extracción en frío. Notas de cacao.", 62, null, "1517701604599-bb29b565090c", ["Frío", "Vegano"], "nuevo", "published", false, ["mg_cold", "mg_milk", "mg_sweet"], "CAF-004", 54),
    p("pr_mocha", "cat_cafe", "Mocha Blanco", "Espresso con chocolate blanco y leche.", 70, null, "1541167760496-1628856ab772", ["Caliente", "Dulce"], null, "published", false, ["mg_size", "mg_milk", "mg_extras"], "CAF-005", 37),
    p("pr_espr", "cat_cafe", "Espresso doble", "Dos shots, sin más.", 40, null, "1510707577719-ae7c14805e3a", ["Caliente"], null, "draft", false, [], "CAF-006", 0),

    p("pr_matcha", "cat_frias", "Matcha Mango", "Matcha ceremonial sobre puré de mango y leche.", 75, null, "1515823064-d6e0c04616a7", ["Frío", "Sin cafeína"], "popular", "published", true, ["mg_cold", "mg_milk", "mg_sweet"], "FRI-001", 81),
    p("pr_limo", "cat_frias", "Limonada de frutos rojos", "Limón, frambuesa, zarzamora y agua mineral.", 55, null, "1497534446932-c925b458314e", ["Frío", "Vegano"], null, "published", false, ["mg_cold", "mg_sweet"], "FRI-002", 40),
    p("pr_chai", "cat_frias", "Chai helado", "Chai especiado en casa con leche y canela.", 68, null, "1461023058943-07fcbe16d735", ["Frío"], "recomendado", "published", false, ["mg_cold", "mg_milk"], "FRI-003", 33),
    p("pr_horch", "cat_frias", "Horchata de avena", "Receta de la abuela, sin lácteos.", 48, null, "1556679343-c7306c1976bc", ["Frío", "Vegano"], null, "soldout", false, ["mg_cold"], "FRI-004", 22),

    p("pr_hotc", "cat_desayunos", "Hot cakes de mantequilla", "Tres piezas con miel de maple y mantequilla batida.", 115, null, "1567620905732-2d1ec7ab7445", ["Dulce"], "popular", "published", true, ["mg_break", "mg_mode"], "DES-001", 77),
    p("pr_chila", "cat_desayunos", "Chilaquiles", "Totopo de maíz, crema, queso fresco y cebolla morada.", 135, null, "1565299585323-38d6b0865b47", ["Picante"], "recomendado", "published", false, ["mg_salsa", "mg_protein", "mg_break"], "DES-002", 91),
    p("pr_toast", "cat_desayunos", "Toast de aguacate", "Pan de masa madre, aguacate, rábano y semillas.", 125, null, "1541519227354-08fa5d50c44d", ["Vegetariano"], null, "published", false, ["mg_protein", "mg_break"], "DES-003", 58),
    p("pr_huevos", "cat_desayunos", "Huevos al gusto", "Dos huevos con frijoles y pan tostado.", 105, null, "1525351484163-7529414344d8", [], null, "published", false, ["mg_eggs", "mg_break"], "DES-004", 45),
    p("pr_panfr", "cat_desayunos", "Pan francés", "Brioche, frutos rojos y crema de mascarpone.", 120, null, "1484723091739-30a097e8f929", ["Dulce"], "nuevo", "published", false, ["mg_mode"], "DES-005", 19),

    p("pr_bowl", "cat_comidas", "Bowl mediterráneo", "Quinoa, garbanzo, pepino, hummus y tahini.", 145, null, "1512621776951-a57141f2eefd", ["Vegano"], null, "published", false, ["mg_protein"], "COM-001", 36),
    p("pr_burger", "cat_comidas", "Hamburguesa Molienda", "Res 180 g, queso gouda, cebolla caramelizada y papas.", 175, 195, "1568901346375-23c9450c58cd", [], "especial", "published", true, ["mg_break"], "COM-002", 64),
    p("pr_panini", "cat_comidas", "Panini caprese", "Jitomate, mozzarella, albahaca y pesto.", 130, null, "1528735602780-2552fd46c7af", ["Vegetariano"], null, "published", false, [], "COM-003", 27),
    p("pr_pasta", "cat_comidas", "Pasta pomodoro", "Spaghetti, salsa de jitomate asado y parmesano.", 150, null, "1621996346565-e3dbc646d9a9", ["Vegetariano"], null, "hidden", false, ["mg_protein"], "COM-004", 12),
    p("pr_cesar", "cat_comidas", "Ensalada César", "Lechuga orejona, aderezo de la casa y crotones.", 125, null, "1550304943-4f24f54ddde9", [], null, "published", false, ["mg_protein"], "COM-005", 21),

    p("pr_crois", "cat_panaderia", "Croissant de mantequilla", "Laminado a mano, 72 horas de fermentación.", 48, null, "1555507036-ab1f4038808a", ["Vegetariano"], "popular", "published", false, [], "PAN-001", 70),
    p("pr_croisj", "cat_panaderia", "Croissant de jamón", "Jamón de pierna, gruyère y bechamel.", 85, null, "1549903072-7e6e0bedb7fb", [], null, "published", false, [], "PAN-002", 52),
    p("pr_concha", "cat_panaderia", "Concha de vainilla", "Pan dulce de la casa.", 32, null, "1509440159596-0249088772ff", ["Dulce"], null, "published", false, [], "PAN-003", 44),
    p("pr_rol", "cat_panaderia", "Rol de canela", "Glaseado de queso crema.", 58, null, "1509365465985-25d11c17e812", ["Dulce"], "nuevo", "soldout", false, [], "PAN-004", 30),

    p("pr_cheese", "cat_postres", "Cheesecake de frutos rojos", "Estilo New York con coulis de zarzamora.", 85, null, "1533134242443-d4fd215305ad", ["Dulce"], "popular", "published", false, ["mg_mode"], "POS-001", 49),
    p("pr_panna", "cat_postres", "Panna cotta", "Vainilla de Papantla y maracuyá.", 75, null, "1563805042-7684c019e1cb", ["Sin gluten"], null, "published", false, [], "POS-002", 18),
    p("pr_brown", "cat_postres", "Brownie tibio", "Chocolate 70% con nuez.", 70, null, "1606313564200-e75d5e30476c", ["Dulce"], null, "published", false, ["mg_mode"], "POS-003", 41),
    p("pr_tira", "cat_postres", "Tiramisú", "Mascarpone, espresso Molienda y cacao.", 90, null, "1571877227200-a0d98ea607e9", [], "recomendado", "published", true, [], "POS-004", 38),
    p("pr_choco", "cat_postres", "Pastel de chocolate", "Rebanada, betún de ganache.", 80, null, "1578985545062-69928b1d9587", ["Dulce"], null, "archived", false, [], "POS-005", 9),
  ],
  promotions: [
    { id: "promo_1", name: "2x1 en americanos", type: "bogo", productId: "pr_amer", value: 0, start: "2026-09-01", end: "2026-10-31", active: true, banner: "Lunes a viernes, todo el día." },
    { id: "promo_2", name: "15% en postres después de las 18:00", type: "percent", categoryId: "cat_postres", value: 15, start: "2026-09-15", end: "2026-12-31", active: false, banner: "Termina el día con algo dulce." },
    { id: "promo_3", name: "Hamburguesa a $175", type: "price", productId: "pr_burger", value: 175, start: "2026-09-20", end: "2026-09-30", active: true, banner: "Precio especial de aniversario." },
  ],
  orderCounter: 24,
};

type SeedLine = [productId: string, qty: number, mods: string, unit: number];

function o(
  n: number, time: string, mode: OrderMode, name: string, phone: string, table: string | null,
  items: SeedLine[], status: OrderStatus, notes: string, pickupTime: string | null, guests?: number,
): Order {
  const lines = items.map(([productId, qty, mods, unit]) => ({
    productId,
    name: seedBusiness.products.find((x) => x.id === productId)?.name ?? productId,
    qty,
    unit,
    mods: mods ? mods.split(" · ") : [],
  }));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  return {
    id: "ord_" + n, number: n, time, date: "2026-09-23", mode,
    customer: { name, phone, table, guests: guests ?? null, pickupTime },
    items: lines, notes, subtotal, discount: 0, total: subtotal, status, source: "whatsapp",
  };
}

export const seedOrders: Order[] = [
  o(24, "10:32", "pickup", "Andrés Mendoza", "668 145 2231", null, [["pr_latte", 2, "Grande · Avena", 95], ["pr_croisj", 1, "", 85], ["pr_matcha", 1, "Regular 16oz", 75]], "pending", "Sin azúcar en el latte.", "10:50"),
  o(23, "10:28", "dinein", "Mariana López", "", "7", [["pr_chila", 2, "Verde · Pollo", 170], ["pr_amer", 2, "Mediano", 55]], "preparing", "", null, 3),
  o(22, "10:12", "dinein", "Luis Félix", "", "3", [["pr_hotc", 1, "Tocino", 145], ["pr_capp", 1, "Mediano · Almendra", 83]], "ready", "", null, 1),
  o(21, "09:54", "pickup", "Sofía Armenta", "668 201 9981", null, [["pr_cold", 3, "Grande 20oz", 77]], "completed", "", "10:05"),
  o(20, "09:31", "dinein", "Carlos Ruiz", "", "12", [["pr_toast", 2, "Huevo estrellado", 145], ["pr_latte", 2, "Mediano", 75]], "completed", "Una sin rábano.", null, 2),
  o(19, "09:02", "pickup", "Paola Inzunza", "668 330 1204", null, [["pr_crois", 4, "", 48], ["pr_amer", 2, "Grande", 65]], "completed", "", "09:15"),
];
