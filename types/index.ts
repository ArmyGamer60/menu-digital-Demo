/* Modelo de datos del menú digital (ver README → "Modelo de datos"). */

export type Currency = "MXN" | "USD" | "EUR" | "COP";
export type ProductStatus = "published" | "draft" | "soldout" | "hidden" | "archived";
export type Badge = "nuevo" | "popular" | "especial" | "recomendado" | null;
export type CardStyle = "minimal" | "rounded" | "editorial" | "image-heavy" | "compact" | "premium";
export type Layout = "grid" | "list" | "large" | "compact";
export type FontPair = "editorial" | "moderna" | "clasica" | "urbana" | "suave";
export type ManualState = "auto" | "open" | "closed" | "paused";
export type OrderMode = "dinein" | "pickup";
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** "HH:MM" */
export type TimeString = string;

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  fontPair: FontPair;
  cardStyle: CardStyle;
  layout: Layout;
  heroEnabled: boolean;
  heroTitle: string;
  heroText: string;
  heroImage: string;
}

export interface Settings {
  dineIn: boolean;
  pickup: boolean;
  notesEnabled: boolean;
  scheduleEnabled: boolean;
  askGuests: boolean;
  /** Solo dígitos con código de país, p. ej. "526688124410". */
  whatsappNumber: string;
  greeting: string;
  closing: string;
  currency: Currency;
  taxEnabled: boolean;
  taxRate: number;
  timezone: string;
  manualState: ManualState;
}

export interface BusinessHours {
  day: DayOfWeek;
  label: string;
  active: boolean;
  ranges: [TimeString, TimeString][];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
  order: number;
  visible: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAt: number | null;
  image: string;
  sku?: string;
  tags: string[];
  badge: Badge;
  status: ProductStatus;
  featured: boolean;
  /** Orden = orden de visualización en el ProductSheet. */
  modifierGroupIds: string[];
  sold: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  kind: "variant" | "option" | "extra";
  type: "single" | "multiple";
  required: boolean;
  max?: number;
  options: ModifierOption[];
}

export interface Promotion {
  id: string;
  name: string;
  type: "bogo" | "percent" | "price";
  productId?: string;
  categoryId?: string;
  value: number;
  start: string;
  end: string;
  active: boolean;
  banner: string;
}

export interface OrderCustomer {
  name: string;
  phone?: string;
  table?: string | null;
  guests?: number | null;
  pickupTime?: string | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unit: number;
  mods: string[];
  notes?: string;
}

export interface Order {
  id: string;
  number: number;
  time: string;
  date: string;
  mode: OrderMode;
  customer: OrderCustomer;
  items: OrderItem[];
  notes: string;
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  status: OrderStatus;
  source: "whatsapp";
  /** Recién llegado desde el menú y aún no abierto en el panel. */
  isNew?: boolean;
}

/** Pedido aún no registrado: lo que se usa para generar el mensaje de WhatsApp. */
export type OrderDraft = Pick<Order, "number" | "mode" | "customer" | "items" | "notes" | "subtotal" | "discount" | "tax" | "total">;

/** groupId → optionIds */
export type Selections = Record<string, string[]>;

export interface CartLine {
  id: string;
  productId: string;
  categoryId: string;
  name: string;
  image: string;
  qty: number;
  sel: Selections;
  notes: string;
  unit: number;
  mods: string[];
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  maps: string;
  logoText: string;
  logoImage?: string;
  logoAlt?: string;
  favicon?: string;
  theme: Theme;
  settings: Settings;
  hours: BusinessHours[];
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  promotions: Promotion[];
  /** Fase 1: contador local. Fase 2: secuencia por negocio en BD. */
  orderCounter: number;
}

/** Subconjunto que necesita la lógica de precios. */
export type PricingContext = Pick<Business, "promotions" | "modifierGroups" | "settings">;
