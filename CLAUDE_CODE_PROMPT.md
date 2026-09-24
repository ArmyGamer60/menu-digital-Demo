# Prompt para Claude Code

Copia esta carpeta (`design_handoff_menu_digital/`) dentro de un directorio vacío, abre Claude Code ahí y pega el bloque de abajo. Está dividido en fases; pide una fase a la vez y revisa antes de continuar.

---

## Prompt inicial (Fase 1)

```
Lee design_handoff_menu_digital/README.md completo, mira TODAS las imágenes de
design_handoff_menu_digital/referencias/ (y su README) como referencia visual obligatoria,
y revisa los prototipos en
design_handoff_menu_digital/prototipo/ (sobre todo data/demo.js, que contiene el
modelo de datos, los datos demo y la lógica de precios, horarios y WhatsApp).

Objetivo: recrear el prototipo como una app de producción, pixel-perfect según el README
y las capturas de referencias/. Al terminar cada pantalla, compárala con su captura.

Stack:
- Next.js 15 (App Router) + TypeScript estricto + Tailwind CSS v4
- next/font/google para Gloock, Hanken Grotesk, JetBrains Mono y los pares alternativos
- Zustand (persist) para el carrito
- Zod para validación
- @dnd-kit/sortable para reordenar categorías y opciones
- lucide-react para iconos
- Sin backend todavía: los datos vienen de /data/seed.ts (portado de demo.js) y el panel
  guarda en localStorage como el prototipo, detrás de una capa /lib/repo.ts con funciones
  async (getBusinessBySlug, saveBusiness, createOrder, listOrders…) para que en la Fase 2
  solo cambiemos la implementación por Supabase.

Pasos:
1. Inicializa el proyecto en la raíz (create-next-app con TS, Tailwind, App Router, src/ no, alias @/*).
   Configura next.config para permitir imágenes de images.unsplash.com.
2. Crea /types/index.ts con el modelo del README.
3. Porta demo.js a /data/seed.ts y /lib (money, pricing, hours, whatsapp, theme).
   Escribe tests con Vitest para pricing.cartTotals (bogo, percent, price), businessStatus
   y generateWhatsAppMessage (debe coincidir con el formato exacto del README).
4. Construye /components/ui (Button, Input, Toggle, Badge, Chip, Sheet, Modal, Drawer,
   Toast, ConfirmDialog, Skeleton, EmptyState).
5. Construye el menú público en /app/menu/[slug] con todos los breakpoints, variantes de
   cardStyle × layout, ProductSheet, carrito, checkout en 4 pasos y envío por WhatsApp.
   El Theme del negocio se aplica con themeToCssVars() en el contenedor raíz.
   Soporta ?mesa=N y los estados cerrado / pausado / vacío / error.
   Redirige "/" a "/menu/molienda".
6. No hagas todavía el panel.

Cuando termines, corre `npm run build` y `npm run lint` sin errores, y dame un resumen
de lo que falta respecto al README.
```

## Fase 1b — Panel

```
Ahora construye el panel /admin según el README (sección "Screens / Views — Panel"):
login (mock: cualquier email válido + contraseña no vacía, cookie de sesión simple con
middleware que protege /admin/*), layout con sidebar colapsable y breadcrumbs, y todas
las páginas: Overview, Pedidos (con drawer), Menú (tabla + filtros + acciones),
Crear/Editar producto, Categorías (drag & drop), Modificadores (drawer), Promociones
(drawer), Horarios, Apariencia (con vista previa en vivo del menú en iframe) y
Configuración (4 tabs) y Cuenta. Usa /lib/repo.ts para leer/escribir.
Los cambios deben reflejarse en /menu/molienda al recargar.
Confirmación antes de eliminar. Toasts en cada guardado.
```

## Fase 2 — Supabase (persistencia real)

```
Migra /lib/repo.ts a Supabase:
- Crea supabase/migrations/0001_init.sql con las tablas del README (businesses con theme
  y settings jsonb, business_hours, categories, products, modifier_groups,
  modifier_options, product_modifier_groups, promotions, orders, order_items),
  índices por business_id y RLS: lectura pública de productos publicados/agotados y
  categorías visibles; escritura solo para el owner (auth.uid()).
- Script supabase/seed.sql o scripts/seed.ts que cargue Molienda.
- Auth con Supabase (email + contraseña / magic link) reemplazando el login mock.
- Storage bucket "media" para imágenes de productos, logos y favicon (upload desde el panel).
- El menú público usa ISR y el panel llama revalidatePath(`/menu/${slug}`) al guardar.
- Al enviar un pedido, POST /api/orders lo guarda (status pending) y devuelve el número
  (secuencia por negocio); luego se abre WhatsApp.
- Las promociones respetan start/end en la zona horaria del negocio.
Variables de entorno: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY (solo servidor). Documenta en README.md del proyecto.
```

## Consejos
- Si algo visual no cuadra, dile a Claude Code: "compáralo con prototipo/Menu Cliente.dc.html, sección X" — puede leer el HTML y copiar los valores exactos.
- Pide commits pequeños por paso (`git init` al principio).
