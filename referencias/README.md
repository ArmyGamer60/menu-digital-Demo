# Referencias visuales

Capturas del prototipo para que Claude Code mantenga la línea visual. **Son la fuente de verdad visual**; ante cualquier duda de valores exactos (px, colores), consultar el README y el HTML en `../prototipo/`.

> Las capturas muestran el tema **"Mar"** (principal `#1F4E79`, secundario `#C2553B`, acento `#F2B84B`, fondo `#F2F4F3`, texto `#141A20`) y el nombre "Cafe Cremata", que es como quedó configurado el negocio en el prototipo. El tema por defecto del seed es "Terracota". Ambos deben verse igual de bien: el theming es por CSS variables.

## Menú público — móvil (390 px)
- `movil-01-inicio.png` — header, chips horizontales, hero, promos, barra flotante "Ver pedido".
- `movil-02-grid.png` — grid de 2 columnas, estilo de tarjeta editorial.
- `movil-03-detalle-producto.png` — bottom sheet del producto, pill "Obligatorio", CTA "Elige tamaño".
- `movil-04-carrito-sheet.png` — carrito como bottom sheet con modificadores y stepper.

## Menú público — tablet (~920 px)
- `tablet-01-inicio.jpg` — header completo, chips, hero, tira de promociones.
- `tablet-02/03-grid-productos-*.jpg` — sección de categoría, grid 3 columnas, badges.
- `tablet-04-detalle-producto-modificadores.jpg` — modal de 2 columnas (foto | opciones).
- `tablet-05-carrito-drawer.jpg` — drawer derecho + toast "Agregado".
- `tablet-06/07/08-checkout-*.jpg` — pasos Modalidad → Datos → Confirmación con CTA WhatsApp verde.
- `tablet-09-info-negocio.jpg` — modal de info y horarios.

Desktop (≥1100 px) = tablet + sidebar de categorías a la izquierda y carrito sticky a la derecha (ver README).

## Panel (1280 px)
- `panel-01-overview.jpg` · `panel-02-pedidos.jpg` · `panel-03-menu-productos.jpg` · `panel-04-editar-producto.jpg`
- `panel-05-categorias.jpg` · `panel-06-modificadores.jpg` · `panel-07-drawer-grupo.jpg` · `panel-08-promociones.jpg`
- `panel-09-horarios.jpg` · `panel-10-apariencia.jpg` (la vista previa en vivo es un iframe del menú; aparece en blanco en la captura) · `panel-11-config-whatsapp.jpg`

## Reglas de estilo que no se deben perder
- Menú: editorial y gastronómico. Títulos en serif display (Gloock) grandes con tracking negativo, cuerpo en Hanken Grotesk, mucha foto, pocos bordes, chips en píldora, CTA en píldora del color principal.
- Panel: sobrio y neutro cálido (`#F6F4F0`), sidebar casi negra `#1C1A17`, tarjetas blancas con borde fino `#E6E2DA`, títulos Gloock 34 px, botones primarios negro `#1B1916`. Nada de azules Bootstrap ni sombras pesadas.
- WhatsApp siempre en verde `#128C4A`.
