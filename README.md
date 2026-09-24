# Handoff: Menú digital + pedidos por WhatsApp (menu.app)

## Overview
Plataforma multi-negocio para restaurantes, cafeterías, bares, panaderías, food trucks y dark kitchens. Cada negocio tiene:
- Un **menú público** mobile-first en `/menu/[slug]` donde el cliente explora, personaliza productos, arma su carrito y envía el pedido **por WhatsApp** (sin pagos, sin tracking, sin delivery).
- Un **panel de administración** desktop-first para gestionar menú, categorías, modificadores, promociones, horarios, apariencia (theming por negocio) y configuración.

Flujo final deliberadamente simple: **Carrito → Modalidad → Datos → Confirmación → mensaje generado → `wa.me`**.

Negocio demo: **Molienda — Café & Cocina** (Los Mochis, Sinaloa). 7 categorías, 29 productos, 10 grupos de modificadores, 3 promociones, 6 pedidos.

## About the Design Files
Los archivos de `prototipo/` son **referencias de diseño hechas en HTML**: prototipos funcionales que muestran el aspecto y comportamiento esperados, **no código de producción**. La tarea es **recrearlos** en un proyecto nuevo con **Next.js (App Router) + TypeScript + Tailwind CSS**, desplegado en **Vercel** (ver "Stack recomendado").

La excepción es `prototipo/data/demo.js`: su lógica (precios, promociones, horarios, generación del mensaje de WhatsApp) y sus datos demo están pensados para portarse **casi literalmente** a TypeScript.

Para ver el prototipo: abrir los `.dc.html` en un navegador con un servidor local (`npx serve prototipo`), ya que cargan `support.js` y `data/demo.js`. En el menú hay un control "Tweaks" con `viewport` (390/768/1440), `demoState` (real/closed/paused/empty/error), `mesa`, `cardStyle`, `layout`.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado, estados e interacciones son finales. Recrear pixel-perfect. Las fotos son placeholders de Unsplash.

---

## Stack recomendado

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Nativo en Vercel, SSR/ISR para el menú público (SEO, velocidad desde QR) |
| Estilos | Tailwind CSS v4 + CSS variables para el Theme del negocio | El theming por negocio se resuelve con `--brand`, `--bg`, etc. en el `<body>` del menú |
| UI admin | Componentes propios (o shadcn/ui re-estilizado con la paleta del panel) | Evitar look Bootstrap |
| Estado cliente | Zustand con `persist` (carrito en localStorage) | Carrito sobrevive a recargas |
| Datos | **Fase 1:** seed estático (`/data/seed.ts`). **Fase 2:** Supabase (Postgres + Auth + Storage) | Supabase se integra con Vercel en un clic |
| Validación | Zod (formularios checkout y admin) | |
| Drag & drop | `@dnd-kit/sortable` | Orden de categorías y opciones |
| Fuentes | `next/font/google` | Gloock, Hanken Grotesk, JetBrains Mono + pares alternativos |
| Imágenes | `next/image` + Supabase Storage (fase 2) | Añadir `images.unsplash.com` a `remotePatterns` para el seed |

### Fases
1. **Fase 1 — Front completo con datos seed** (desplegable en Vercel ya): menú público funcional + WhatsApp, panel navegable con estado en memoria/localStorage (igual que el prototipo).
2. **Fase 2 — Persistencia real:** Supabase (tablas del modelo de datos), Auth para `/admin`, Storage para imágenes/logos, RLS por `business_id`. El menú público lee de la BD con ISR (`revalidate` al guardar en admin).
3. **Fase 3 (futuro):** pedidos registrados en BD al enviar (ya modelado como `Order` con `source: 'whatsapp'`), multi-negocio con selector, dominios personalizados.

---

## Estructura de carpetas sugerida

```
/app
  /menu/[slug]/page.tsx            Menú público (server component, carga Business completo)
  /menu/[slug]/checkout/...        (opcional; el prototipo usa overlay a pantalla completa)
  /admin/login/page.tsx
  /admin/(panel)/layout.tsx        Sidebar + header con breadcrumbs y estado
  /admin/(panel)/page.tsx          Overview
  /admin/(panel)/orders/page.tsx
  /admin/(panel)/products/page.tsx
  /admin/(panel)/products/new/page.tsx
  /admin/(panel)/products/[id]/page.tsx
  /admin/(panel)/categories/page.tsx
  /admin/(panel)/modifiers/page.tsx
  /admin/(panel)/promotions/page.tsx
  /admin/(panel)/hours/page.tsx
  /admin/(panel)/appearance/page.tsx
  /admin/(panel)/settings/page.tsx
  /admin/(panel)/account/page.tsx
/components
  /ui          Button, Input, Textarea, Select, Toggle, Badge, Chip, Sheet, Modal, Drawer, Toast, ConfirmDialog, Skeleton, EmptyState
  /menu        MenuHeader, CategoryChips, CategorySidebar, Hero, PromoStrip, FeaturedStrip,
               ProductCard (variantes cardStyle × layout), ProductSheet, ModifierGroupPicker,
               CartPanel (sheet/drawer/sticky), CartBar, CheckoutFlow (ModeStep, InfoStep, ConfirmStep, SentStep),
               BusinessInfoSheet, StatusBanner
  /dashboard   Sidebar, Breadcrumbs, KpiCard, DataTable, StatusBadge, ProductEditor, CategoryRow,
               ModifierGroupCard, ModifierGroupDrawer, PromotionCard, PromotionDrawer, HoursEditor,
               ThemeEditor, LivePreview, OrderDrawer
/lib
  whatsapp.ts   generateWhatsAppMessage(order, business) / whatsappUrl / openWhatsApp
  pricing.ts    effectivePrice, lineUnitPrice, describeSelections, cartTotals
  hours.ts      businessStatus(business, now, timezone)
  money.ts      money(n, currency)
  theme.ts      themeToCssVars(theme) → Record<string,string>
/stores
  cart.ts       Zustand: lines[], add/update/remove/inc/dec, persist por slug
/data
  seed.ts       Portado de prototipo/data/demo.js
/types
  index.ts      Business, Theme, Settings, BusinessHours, Category, Product, ModifierGroup, ModifierOption, Promotion, Order, OrderItem, CartLine
```

---

## Modelo de datos (TypeScript)

```ts
type Currency = 'MXN' | 'USD' | 'EUR' | 'COP';
type ProductStatus = 'published' | 'draft' | 'soldout' | 'hidden' | 'archived';
type Badge = 'nuevo' | 'popular' | 'especial' | 'recomendado' | null;
type CardStyle = 'minimal' | 'rounded' | 'editorial' | 'image-heavy' | 'compact' | 'premium';
type Layout = 'grid' | 'list' | 'large' | 'compact';
type FontPair = 'editorial' | 'moderna' | 'clasica' | 'urbana' | 'suave';
type ManualState = 'auto' | 'open' | 'closed' | 'paused';

interface Business { id; name; slug; tagline; description; address; phone; whatsapp; instagram; facebook; maps;
  logoText: string; logoImage?: string; logoAlt?: string; favicon?: string;
  theme: Theme; settings: Settings; hours: BusinessHours[]; categories: Category[]; products: Product[];
  modifierGroups: ModifierGroup[]; promotions: Promotion[]; }
interface Theme { primary; secondary; accent; background; text: string; fontPair: FontPair; cardStyle: CardStyle; layout: Layout;
  heroEnabled: boolean; heroTitle: string; heroText: string; heroImage: string; }
interface Settings { dineIn; pickup; notesEnabled; scheduleEnabled; askGuests: boolean; whatsappNumber: string; // "526688124410"
  greeting: string; closing: string; currency: Currency; taxEnabled: boolean; taxRate: number; timezone: string; manualState: ManualState; }
interface BusinessHours { day: 0|1|2|3|4|5|6; label: string; active: boolean; ranges: [string, string][]; } // "HH:MM"
interface Category { id; name; description: string; image?: string; icon?: string; order: number; visible: boolean; }
interface Product { id; categoryId; name; description: string; price: number; compareAt: number | null; image: string; sku?: string;
  tags: string[]; badge: Badge; status: ProductStatus; featured: boolean; modifierGroupIds: string[]; sold: number; }
interface ModifierGroup { id; name; description: string; kind: 'variant'|'option'|'extra'; type: 'single'|'multiple';
  required: boolean; max?: number; options: ModifierOption[]; }
interface ModifierOption { id; name: string; price: number; isDefault?: boolean; }
interface Promotion { id; name; type: 'bogo'|'percent'|'price'; productId?: string; categoryId?: string; value: number;
  start: string; end: string; active: boolean; banner: string; }
interface Order { id; number: number; time: string; date: string; mode: 'dinein'|'pickup';
  customer: { name: string; phone?: string; table?: string|null; guests?: number|null; pickupTime?: string|null };
  items: OrderItem[]; notes: string; subtotal; discount; tax?; total: number;
  status: 'pending'|'preparing'|'ready'|'completed'|'cancelled'; source: 'whatsapp'; }
interface OrderItem { productId: string; name: string; qty: number; unit: number; mods: string[]; notes?: string; }
interface CartLine { id; productId; categoryId; name; image: string; qty: number;
  sel: Record<string /*groupId*/, string[] /*optionIds*/>; notes: string; unit: number; mods: string[]; }
```

Relaciones: Business 1—1 Theme/Settings, 1—7 BusinessHours, 1—N Category, Category 1—N Product, Product N—M ModifierGroup (por `modifierGroupIds`, orden = orden de visualización), ModifierGroup 1—N ModifierOption, Business 1—N Promotion/Order, Order 1—N OrderItem.

**Variantes, opciones y extras son todos `ModifierGroup`**, diferenciados por `kind`. Un producto "tiene variantes" si alguno de sus grupos es `kind: 'variant'` → su precio en tarjeta se muestra como "Desde $X".

### Esquema SQL (fase 2, Supabase)
Tablas: `businesses` (incluye `theme jsonb`, `settings jsonb`, `owner_id uuid`), `business_hours`, `categories`, `products`, `modifier_groups`, `modifier_options`, `product_modifier_groups (product_id, group_id, position)`, `promotions`, `orders`, `order_items`. Todas con `business_id` y RLS: lectura pública de lo publicado; escritura solo `owner_id = auth.uid()`.

---

## Lógica de negocio (portar de `prototipo/data/demo.js`)

- **`effectivePrice(product)`**: si hay promo activa `type:'price'` para el producto → precio = `promo.value`, `compareAt` = precio original. Si no, `price`/`compareAt` del producto.
- **`lineUnitPrice(product, sel)`** = precio efectivo + suma de `option.price` de todas las opciones seleccionadas.
- **`describeSelections`**: lista de nombres de opciones elegidas (omite opciones `isDefault` con precio 0), formateadas `"Avena +$15"`.
- **`cartTotals(lines)`**:
  - `subtotal` = Σ unit × qty.
  - Promo `bogo`: por cada 2 unidades del producto, la más barata gratis (ordenar unidades asc, gratis = floor(n/2)).
  - Promo `percent`: `value`% sobre líneas de la categoría/producto.
  - `tax` = si `taxEnabled`, (subtotal − descuento) × taxRate/100. `total` = subtotal − descuento + tax.
- **`businessStatus(now)`**: `manualState` manda (`paused` → no pedidos, `closed` → cerrado con próximo horario, `open` → abierto). En `auto`, abierto si `now` cae en algún rango del día; si no, calcula el próximo inicio ("hoy a las 17:00", "mañana a las 07:30", "lunes a las …"). **Usar `settings.timezone`** (el prototipo usa hora local del navegador; en producción usar `Intl`/`date-fns-tz`).
- **Número de pedido**: `orderCounter + 1`, formateado a 3 dígitos (`#025`). Fase 1: contador local; fase 2: secuencia por negocio en BD.
- **Agregar al carrito**: si ya existe una línea con mismo producto + misma selección + misma nota, se suma cantidad. Editar una línea reabre el ProductSheet con su selección y reemplaza la línea.

### WhatsApp
```ts
generateWhatsAppMessage(order, business): string
```
Formato exacto (negritas con `*` de WhatsApp):
```
{settings.greeting}

*MOLIENDA*
*PEDIDO #025*

Modalidad: Recoger | Comer aquí
Cliente: Andrés Mendoza
Teléfono: 668 145 2231            (si hay)
Mesa: 7                            (solo comer aquí)
Personas: 3                        (solo comer aquí y askGuests)
Hora de recogida: 10:50            (solo recoger y scheduleEnabled)

*PRODUCTOS*
2 × Latte Caramelo — $190
   Grande +$20, Avena +$15
   Nota: sin azúcar

Subtotal: $300
Descuento: −$45                    (si > 0)
Impuestos (16%): $41               (si taxEnabled)

Notas:                             (si hay nota general)
Sin azúcar en el latte.

*Total: $300*

{settings.closing}
```
```ts
whatsappUrl(phone, msg) = `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`
openWhatsApp(msg, phone) → window.location.href = url  // en móvil preferir location.href sobre window.open (popup blockers)
```
Al enviar: guardar el pedido (fase 1: localStorage; fase 2: `POST /api/orders`), vaciar carrito, mostrar pantalla "Pedido #025 listo" con burbuja de WhatsApp y botones "Abrir WhatsApp otra vez" / "Volver al menú".

---

## Screens / Views — Menú público (`/menu/[slug]`)

### Breakpoints
- **Móvil < 700 px**: chips de categorías horizontales sticky, grid 2 columnas, ProductSheet como bottom sheet (top 5%, radio 24px arriba), carrito como bottom sheet (88% alto), barra flotante de carrito.
- **Tablet 700–1099 px**: chips, grid 3 col, ProductSheet como modal centrado de 2 columnas, carrito como drawer derecho de 420px.
- **Desktop ≥ 1100 px**: sidebar de categorías sticky (200px, top 96px) + grid 3 col + carrito sticky a la derecha (380px, siempre visible). Contenedor max 1240px, gutter 36px.
- Gutters: 16 / 28 / 36 px. Hero alto 230 / 300 px, título hero 32 / 46 px, título de sección 28 / 34 px.
- Mesa por QR: `?mesa=7` precarga el campo mesa.

### Header (sticky)
- Fila: logo 44×44 circular (color `--brand`, monograma en fuente display 22px, o imagen) · nombre (display 21px, `letter-spacing:-.01em`) + tagline (13px muted, oculto en móvil) · línea de estado (punto 8px con halo 3px al 20% + texto 12.5px/600: "Abierto · hasta 13:00", "Cerrado · abre hoy a las 17:00", "Pedidos en pausa"). Colores punto: abierto `#2E8B57`, pausa `#D08A1E`, cerrado `#B3261E`.
- Botones circulares 44×44 con borde `--line`: buscar, info; carrito (fondo `--ink`, badge contador con `--brand`) solo en móvil/tablet.
- Buscador desplegable: pill 46px alto, radio 23px, input 16px. Busca en nombre + descripción + tags.
- Chips: altura 40, padding 0 16px, radio 20 (0 si cardStyle premium), borde `--line-strong`; activo = fondo `--ink`, texto `--bg`. Scroll-spy: el chip activo sigue la sección visible y se centra con scroll suave; tocar un chip hace scroll suave a la sección.

### Banner de estado (cerrado/pausa)
Tarjeta `--ink` sobre `--bg`, radio 14, icono reloj. Textos: "Estamos cerrados." + "Abrimos {next}. Puedes ver el menú mientras tanto." / "Por el momento no estamos tomando pedidos." + "Vuelve en unos minutos. El menú sigue disponible para consulta." En estos estados los CTA de agregar/continuar se deshabilitan con el texto correspondiente.

### Hero (toggle desde Apariencia)
Imagen full-bleed con degradado `linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,.72) 100%)`, pill "ESPECIAL" en `--accent` (texto `#1b1408`, 11.5px/700, uppercase, tracking .06em), título display, texto 15px blanco 90%. Radio 20px (4px en editorial/premium).

### Tira de promociones
Tarjetas horizontales: icono 34×34 radio 10 en `--brand2` con "2×1" / "−15%" / "$", nombre 14/700, banner 12.5 muted.

### Destacados
Carrusel horizontal con scroll-snap, tarjetas 230/260px, aspect 4/5, imagen con overlay degradado y nombre display 23px + precio.

### Secciones por categoría
Título h2 display + descripción 14 muted + contador "5 productos". Categoría sin productos: caja con borde discontinuo "Esta categoría aún no tiene productos."

### ProductCard — matriz `cardStyle` × `layout`
Variables por cardStyle (radio tarjeta / radio imagen / sombra / borde / aspect imagen / padding texto / fuente título / tamaño / peso / superficie):
| style | radio | img radio | sombra | borde | aspect | padding | título |
|---|---|---|---|---|---|---|---|
| minimal | 8 | 6 | — | — | 1/1 | 10px 2px 4px | body 15.5/600 |
| rounded | 22 | 0 | 0 8px 28px rgba(0,0,0,.08) | — | 1/1 | 14px 16px 16px | body 16/700, superficie `--surface` |
| editorial (default) | 2 | 2 | — | — | 4/5 | 12px 0 4px | display 20(móvil)/22, 400 |
| image-heavy | 16 | 16 | — | — | 3/4 | overlay | display 20 sobre la foto con degradado a .82 |
| compact | 12 | 0 | — | 1px `--line` | 4/3 | 10px 12px 12px | body 14.5/700, sin descripción |
| premium | 0 | 0 | — | 1px `--line-strong` | 1/1 | 16px 16px 18px | display 19, uppercase, tracking .02em |

Layouts: `grid` (2/3/3 col), `large` (1/2 col), `list` (filas con miniatura 96/112px a la derecha, 1/2 col), `compact` (filas con miniatura 64px, sin descripción).
Contenido: foto (hover scale 1.05 en .5s), badge arriba-izquierda (11px/700 uppercase: Popular=`--brand`, Nuevo=`--brand2`, Especial=`--accent`, Recomendado=`--ink`, Agotado=`#5b5650`), botón "+" 40×40 abajo-derecha (fondo `--bg`, sombra `0 4px 14px rgba(0,0,0,.18)`, active scale .9; si el producto tiene grupos obligatorios abre el sheet, si no agrega directo), nombre, descripción 13px (clamp 2 líneas), precio 15/700 tabular ("Desde $65" si tiene variantes) + precio anterior tachado. Agotado: overlay `rgba(20,18,15,.55)` "Agotado temporalmente", sin botón "+". Tarjeta hover translateY(-2px). Entrada `rise` .35s.

### ProductSheet (detalle)
Imagen (34% alto en móvil / 46% ancho en desktop) + botón cerrar blanco 44px. Pills de badge y tags (borde, 12px/600). Nombre display 32px, descripción 15 muted, precio 20/700.
Por cada grupo: título 16/700, ayuda "Elige 1" / "Elige hasta N", pill "Obligatorio" (fondo `--ink`) / "Opcional" (borde) / "Requerido" (rojo `#B3261E`, tras intentar agregar sin elegir). Opciones en filas de 50px: indicador 24px (radio circular para single, cuadrado radio 7 con check para multiple; seleccionado = borde/fondo `--brand`), nombre 15, precio "+$20" muted. Single no obligatorio: tocar la opción seleccionada la deselecciona. Multiple respeta `max`. Opciones `isDefault` vienen preseleccionadas.
Notas especiales (si `notesEnabled`): textarea "Ej. sin azúcar". Footer sticky: stepper 52px [−] qty [+] + CTA 52px radio 26: "Agregar al carrito — $95" (`--brand`), "Elige tamaño" (`--ink`, si falta obligatorio), "Agotado temporalmente"/"Estamos cerrados"/"Pedidos en pausa" (deshabilitado). Al agregar: toast "Agregado · {nombre}" + animación bump en la barra del carrito.

### Carrito
Encabezado "Tu pedido" display 24 + "3 productos". Líneas: miniatura 60 radio 12, nombre 15/700, total de línea, modificadores "Grande +$20 · Avena +$15", nota en itálica, "$95 c/u", stepper 36px, "Editar" (subrayado), "Eliminar" (muted; toast "Producto eliminado"). Bajar a 0 elimina. Resumen: Subtotal, promos aplicadas en `--brand2` ("2x1 en americanos −$55"), impuestos, Total 19/700. CTA "Continuar pedido" 56px.
Vacío: icono bolsa, "Tu carrito está esperando algo delicioso." + "Agrega productos del menú para empezar tu pedido." + "Explorar menú".
Barra flotante (móvil/tablet): 58px, radio 29, `--brand`, contador en círculo 42px `rgba(0,0,0,.18)`, "Ver pedido", total; sombra `0 10px 30px rgba(0,0,0,.25)`.

### Checkout (overlay a pantalla completa, max-width 620)
Header: atrás 44px, "Paso 1 de 3 · Modalidad", indicador de pasos (puntos 8px, activo 22px ancho).
1. **Modalidad** — "¿Cómo quieres recibir tu pedido?" (display 34). Tarjetas 112px min, radio 20, borde 2px: icono 56px (cubiertos / bolsa), "Comer aquí" — "Te llevamos el pedido a tu mesa." / "Recoger" — "Pasa por él al mostrador cuando esté listo.", radio 26px. Solo se muestran las activas en Settings; si solo hay una se preselecciona. CTA "Elige una opción" → "Continuar".
2. **Datos** — "Datos de tu mesa" / "Datos para recoger". Inputs 52px, radio 14, 16px. Nombre (≥2 chars, "Escribe tu nombre."). Comer aquí: Mesa (obligatoria, "Indica tu mesa.") + Personas stepper (opcional, 1–20, default 2). Recoger: Teléfono (10 dígitos, "Escribe un teléfono de 10 dígitos.") + hora: chips "Lo antes posible" (≈ ahora+15), "En 30 min", "En 1 hora", "Elegir hora" (input time). Notas del pedido opcional. Errores inline rojo 13/600 y borde rojo. CTA "Revisar pedido".
3. **Confirmación** — "Revisa tu pedido". Ticket con "PEDIDO #025", líneas, filas de datos (Modalidad, Cliente, Teléfono/Mesa, Personas, Recoger, Notas), totales. Link "Ver el mensaje que se enviará" muestra el texto en bloque verde `#E4F3E6`. CTA **"Enviar pedido por WhatsApp"** (58px, `#128C4A`, icono) + "Tu pedido se enviará directamente al WhatsApp del negocio."
4. **Enviado** — check verde 72px, "Pedido #025 listo", texto explicativo, simulación de chat WhatsApp (header `#0F5A36`, fondo `#ECE5DD`, burbuja `#D9FDD3`).

### Info del negocio (sheet/modal)
Nombre, descripción, estado, tabla de horarios (día actual en negrita, cerrados muted), dirección, "Cómo llegar", Instagram, teléfono.

### Estados globales
Skeleton de carga (bloques con pulse 1.2s), "Algo salió mal." + "Reintentar", "No hay productos disponibles.", cerrado, pausado, categoría vacía, agotado, carrito vacío.

---

## Screens / Views — Panel (`/admin`)

Paleta fija (independiente del Theme). Fuente Hanken Grotesk 14px; títulos Gloock 34px; mono JetBrains Mono.
- **Layout**: sidebar 236px `#1C1A17` (colapsa a 68px con solo iconos < 1000px); grupos "Operación" (Overview, Pedidos), "Catálogo" (Menú, Categorías, Modificadores, Promociones), "Negocio" (Horarios, Apariencia, Configuración, Cuenta). Item 38px radio 9, activo `rgba(255,255,255,.1)` blanco/700, inactivo `#CFC7BA`. Contador de pendientes en Pedidos (`#B4532A`). Abajo "Ver menú público". Header 60px con breadcrumbs (último en negrita), pill de estado actual (click → Horarios), avatar.
- Contenido max 1240, padding 28. Tarjetas blancas radio 14, borde `#E6E2DA`. Inputs 40px radio 9 borde `#DCD7CE`, focus borde `#1B1916`. Botón primario `#1B1916` (hover `#35312B`), secundario borde ink, terciario borde `#DCD7CE`, peligro `#FBEDEB`/`#B3261E`. Toggle 38×22. Toasts abajo-derecha `#1B1916` con punto `#6FCF97`, 2.6s. Confirm dialog centrado 420px con botón rojo.

1. **Login** — 2 columnas (form + foto de café con claim). "Entra a tu panel", correo, contraseña, "Entrar" (estado "Entrando…"), error "Revisa tu correo y contraseña.".
2. **Overview** — "Buenos días, {nombre}" + fecha. KPIs (Pedidos de hoy, Pendientes, Ventas estimadas, Ticket promedio; número Gloock 34). Actividad reciente (hora mono, #, cliente · modalidad, total, badge estado; click abre drawer del pedido). Horario actual (tarjeta oscura, "ABIERTO" Gloock 30, horario de hoy, "Cambiar"). Pedidos por modalidad (barra apilada `#B4532A`/`#2F4A3A`). Top 5 productos con barras.
3. **Pedidos** — tabs por estado con contador; tabla (Pedido, Hora, Cliente + pill "Nuevo", Modalidad, Artículos, Total, Estado). Drawer 520px: estado con botones para cambiarlo, datos del cliente, líneas, total, mensaje de WhatsApp generado.
4. **Menú (productos)** — buscar (nombre/SKU), filtro categoría, tabs de estado (Todos excluye archivados). Tabla: miniatura 44 + nombre (★ si destacado) + SKU mono, categoría, precio, "N grupos", badge estado, toggle disponible/agotado (solo para publicado/agotado), "Editar", menú ⋯ (Duplicar → borrador "(copia)"; Archivar/Restaurar; Eliminar con confirmación).
5. **Crear / Editar producto** — acciones: "Guardar como borrador", "Guardar", "Guardar y publicar". Columna principal: Información básica (Nombre obligatorio, Descripción ≤140 con contador, Precio obligatorio, Precio anterior, SKU), Imagen (preview 4/5 180px, URL, galería; en prod: upload a Storage, recomendado 1200×1500), Modificadores (agregar grupo existente desde select, reordenar ↑, quitar ×; muestra clase, regla y opciones). Columna lateral: Estado (5 radios con descripción), Organización (Categoría, Badge, Etiquetas toggle + crear, Destacado toggle), Vista previa de tarjeta, Acciones (Duplicar, Archivar, Eliminar).
6. **Categorías** — filas arrastrables (handle ⋮⋮; al arrastrar opacidad .45, destino con línea superior ink), imagen/inicial 48, nombre + pill "Oculta", descripción, contador, toggle visible, Editar (drawer: nombre, descripción, imagen, visible), Eliminar (confirmación; productos pasan a borrador sin categoría).
7. **Modificadores** — "Grupos de opciones": grid de tarjetas (nombre, "Usado en N productos", pill clase Variante/Opción/Extra, tipo, obligatorio, opciones con precio). Drawer: nombre, descripción, clase, tipo (única/múltiple), obligatorio, lista de opciones editable (nombre, +$precio, ↑, ×, "+ Agregar opción"), eliminar (se quita de todos los productos).
8. **Promociones** — tarjetas con banner (color `primary` si activa, gris si no), tipo, nombre, texto; "Aplica a", "Vigencia"; toggle activa; Editar. Drawer: nombre, tipo (2×1 / Porcentaje / Precio promocional), producto o categoría, valor, fechas, texto de banner, activa. **Fase 2:** respetar start/end en el cálculo (el prototipo solo usa `active`).
9. **Horarios** — 4 tarjetas de estado manual (Automático, Abierto, Cerrado, Pausar pedidos). Por día: toggle, rangos from–to (input time) con × si >1, "+ Horario", "Copiar a todos" en lunes.
10. **Apariencia** — Branding (logo, logo alternativo, favicon con upload; monograma, nombre, subtítulo), Colores (5 paletas preset + 5 campos color/hex), Tipografía (5 pares), Estilo de tarjetas (6 miniaturas), Layout (4), Hero (toggle + título, mensaje, imagen). Columna derecha sticky: **vista previa en vivo** del menú real (iframe) en marco de móvil 390×760 o desktop escalado. Todo guarda al instante.
11. **Configuración** — tabs: Negocio (nombre, slug saneado a `[a-z0-9-]` con URL pública, descripción, dirección, teléfono, WhatsApp, Instagram, Facebook, Google Maps), Pedidos (toggles Comer aquí, Recoger — mínimo una activa —, Notas especiales, Selección de horario, Número de personas), WhatsApp (número solo dígitos con código de país, mensaje inicial, mensaje de cierre, preview en burbuja con el último pedido), Moneda e impuestos (moneda, zona horaria, impuestos + %, restablecer demo).
12. **Cuenta** — perfil, plan, cerrar sesión, lista de negocios (multi-negocio) + "Crear negocio".

---

## Interactions & Behavior
- Animaciones (keyframes): `sheetUp` translateY(100%)→0 .32–.34s `cubic-bezier(.2,.8,.2,1)`; `drawerIn` translateX(100%)→0 .28–.3s; `fadeIn` backdrop .2s; `rise` (opacity 0, translateY 8–10px) .25–.4s; `bump` scale 1→1.06→1 .35s (barra carrito); `toastIn` .22–.25s; `pop` en confirm dialog .2s; `pulse` skeleton 1.2s.
- Backdrops: `rgba(15,12,10,.45–.5)` (menú), `rgba(20,18,15,.35–.45)` (panel). Click en backdrop cierra.
- Scroll suave a categoría; scroll-spy con bloqueo de 700 ms tras click.
- Respetar `prefers-reduced-motion` en producción.
- Todos los botones de icono con `aria-label`; touch targets ≥ 44px en el menú.

## State Management
- **Menú**: `business` (server), `cart` (Zustand persist, key por slug), UI: `activeCat`, `search`, `searchOpen`, `productSheet {productId, sel, qty, notes, editLineId, showErr}`, `cartOpen`, `infoOpen`, `checkoutStep: null|'mode'|'info'|'confirm'|'sent'`, `mode`, `form {name, phone, table, guests, pickupChoice, pickupTime, notes}`, `errors`, `sent {num, message, url}`, `toast`.
- **Panel**: fase 1 un store global con el Business (igual al prototipo, persist en localStorage); fase 2 Server Actions + `revalidatePath('/menu/'+slug)` al guardar.
- Sincronía panel ↔ menú: en el prototipo vía evento `storage`; en producción vía BD + revalidación.

## Design Tokens

### Theme del menú (por negocio → CSS vars)
Default "Terracota": `primary #B4532A`, `secondary #2F4A3A`, `accent #E3A63B`, `background #F5EFE6`, `text #1F1B16`.
Presets: Noche `#E0A458 / #8FB09A / #E86A4E / #15130F / #F3ECE0`; Pistache `#3F6B3A / #B4532A / #D9C36A / #F1F0E6 / #1C2119`; Mar `#1F4E79 / #C2553B / #F2B84B / #F2F4F3 / #141A20`; Rosa `#C0395B / #3A2A2F / #F4A261 / #FBF1EE / #2A1A1F`.
Derivados (`themeToCssVars`):
```
--bg: background; --ink: text; --brand: primary; --brand2: secondary; --accent: accent
--on-brand: luminancia(primary) > .6 ? #1a1a1a : #ffffff      // lum = (.299r+.587g+.114b)/255
--surface: fondo oscuro (lum(bg)<.45) ? color-mix(in oklab, bg, white 7%) : color-mix(in oklab, bg, white 65%)
--muted: color-mix(in oklab, text 66%, bg)
--line: color-mix(in oklab, text 11%, transparent)
--line-strong: color-mix(in oklab, text 22%, transparent)
--img-bg: color-mix(in oklab, primary 14%, bg)
--hover-bg: color-mix(in oklab, text 4%, transparent)
```
Pares tipográficos (display / body): Editorial `Gloock` / `Hanken Grotesk`; Moderna `Bricolage Grotesque` / `Hanken Grotesk`; Clásica `Cormorant Garamond` / `Karla`; Urbana `Archivo Black` / `Archivo`; Suave `Young Serif` / `Figtree`.

### Panel
`#1C1A17` sidebar · `#1B1916` ink/primario · `#35312B` hover · `#F6F4F0` canvas · `#FBFAF7` fila hover/cabecera tabla · `#FFFFFF` tarjetas · `#E6E2DA` borde tarjeta · `#DCD7CE` borde input · `#F0EDE7` separador · `#6E685F` muted · `#A39B8F`/`#CFC7BA` texto sidebar · `#B4532A` acento.
Estados producto (fondo/texto): Publicado `#E3F1E7/#1F6B3F`, Borrador `#EEE9E1/#5C554B`, Agotado `#FBEBD7/#8A4B0B`, Oculto `#E6E9EE/#3F4A5A`, Archivado `#F1ECEC/#7A4F4F`.
Estados pedido: Pendiente `#FBEBD7/#8A4B0B`, Preparando `#E4ECF7/#1F4E79`, Listo `#E3F1E7/#1F6B3F`, Completado `#EEE9E1/#5C554B`, Cancelado `#F6E1DF/#8C1D18`.
Clase de modificador: Variante `#F4E6DE/#8A3B19`, Opción `#E4ECF7/#1F4E79`, Extra `#E3F1E7/#1F6B3F`.
WhatsApp: botón `#128C4A`, header chat `#0F5A36`, fondo chat `#ECE5DD`, burbuja `#D9FDD3`, preview `#E4F3E6/#10301A`. Error `#B3261E`.

### Escalas
- Espaciado base 4: 4, 8, 12, 16, 20, 24, 28, 32, 48.
- Radios: 7–9 (inputs/botones panel), 10–12 (items), 14 (tarjetas, inputs checkout), 20–22 (tarjetas grandes/modales), 24 (sheets), pills 50%.
- Sombras: dropdown `0 12px 32px rgba(0,0,0,.12)`; modal `0 30px 80px rgba(0,0,0,.35)`; toast `0 10px 30px rgba(0,0,0,.25)`; rounded card `0 8px 28px rgba(0,0,0,.08)`.
- Tipografía menú: display 46/34/32/28/24/22/20; UI 16/700; cuerpo 15; meta 13–12. Inputs del cliente siempre 16px (evita zoom iOS).

## Assets
- Fotos: Unsplash (placeholders), URLs en `demo.js` (`https://images.unsplash.com/photo-{id}?w=900&q=75&auto=format&fit=crop`). Sustituir por fotos reales del negocio.
- Iconos: SVG inline trazo 1.7–2.4 (buscar, info, bolsa, cubiertos, reloj, check, cerrar, flechas). En producción usar **lucide-react** (`Search, Info, ShoppingBag, UtensilsCrossed, Clock, Check, X, ChevronLeft, Plus, Minus, MessageCircle, GripVertical`).
- Fuentes: Google Fonts (ver pares).

## Files
- `prototipo/Menu Cliente.dc.html` — menú público completo (todas las vistas y estados).
- `prototipo/Dashboard.dc.html` — panel completo.
- `prototipo/Sistema.dc.html` — hoja de sistema: tokens, componentes, modelo, estructura.
- `prototipo/data/demo.js` — datos seed + lógica (portar a `/lib` y `/data/seed.ts`).
- `prototipo/support.js` — runtime del prototipo (no portar).
- `referencias/` — capturas de todas las pantallas (móvil, tablet, panel) + README con reglas de estilo.
- `CLAUDE_CODE_PROMPT.md` — prompt listo para pegar en Claude Code.
- `DEPLOY_VERCEL.md` — pasos de despliegue.
