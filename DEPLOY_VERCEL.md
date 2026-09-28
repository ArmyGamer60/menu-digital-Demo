# Despliegue en Vercel

## Requisitos
- Cuenta en GitHub y en vercel.com (puedes entrar con GitHub).
- Node.js 20+ instalado.
- Claude Code instalado (`npm install -g @anthropic-ai/claude-code`).

## 1. Crear el proyecto con Claude Code
```bash
mkdir menu-digital && cd menu-digital
# copia aquí la carpeta design_handoff_menu_digital/ descomprimida
git init
claude
```
Pega el prompt de `CLAUDE_CODE_PROMPT.md` (Fase 1). Al terminar:
```bash
npm run dev      # abre http://localhost:3000/menu/molienda
npm run build    # debe pasar sin errores antes de desplegar
```

## 2. Subir a GitHub
```bash
git add . && git commit -m "Menú digital v1"
# crea un repo vacío en github.com (ej. menu-digital) y luego:
git remote add origin https://github.com/TU_USUARIO/menu-digital.git
git branch -M main
git push -u origin main
```

## 3. Importar en Vercel
1. vercel.com → **Add New… → Project** → importa el repo `menu-digital`.
2. Framework: **Next.js** (se detecta solo). Build: `next build`. Output: automático.
3. **Base de datos:** Vercel → tu proyecto → **Storage → Create Database → Neon** (Postgres, plan gratis) → conéctala al proyecto (Production, Preview y Development). Vercel agrega `DATABASE_URL` sola. Las tablas y el negocio demo se crean en la primera visita.
   **Fotos:** Storage → Create Database → **Blob** → conéctalo al proyecto con el prefijo `BLOB` (crea `BLOB_READ_WRITE_TOKEN`). Las fotos se reducen en el navegador (≈150 KB, WebP) antes de subirse.
4. En **Settings → Environment Variables** agrega:
   - `ADMIN_PASSWORD`: contraseña para crear tu cuenta de superadmin la primera vez.
   - `SESSION_SECRET`: 32+ caracteres aleatorios (firma las sesiones).
   Ver `.env.example`. Tras añadirlas, **Redeploy** para que se apliquen.
5. **Deploy.** Obtendrás `https://menu-digital.vercel.app`. Tu menú: `/menu/molienda`, panel: `/admin`.
6. **Primera entrada:** `/admin/login` con tu correo y la contraseña de `ADMIN_PASSWORD`. Esa cuenta queda como superadmin (después puedes cambiar la contraseña en Cuenta).

## Gestionar clientes (multi-negocio)
- Panel → **Negocios** (`/admin/negocios`, solo superadmin): crea un negocio (en blanco o copia del demo), asigna el correo del dueño y copia los datos de acceso para enviárselos.
- **Abrir panel** entra al panel de cualquier negocio para darle soporte. El selector de la esquina superior izquierda cambia de negocio.
- Cada dueño solo ve su(s) negocio(s). **Accesos** agrega socios, genera contraseñas nuevas o quita accesos.
- **Suspender** oculta el menú público (p. ej. por falta de pago) sin borrar nada.

Cada `git push` a `main` redepliega; cada rama/PR genera una URL de preview.

Alternativa sin GitHub: `npm i -g vercel && vercel` (y `vercel --prod` para producción).

## Dominio propio de un cliente (opcional)
1. Vercel → Project → **Settings → Domains** → agrega `menu.sucafe.com`.
2. En el DNS del cliente: CNAME `menu` → `cname.vercel-dns.com` (o registro A `76.76.21.21` si es el dominio raíz).
3. Panel → Negocios → ⋯ → **Dominio propio** → guarda `menu.sucafe.com`. La raíz de ese dominio muestra su menú.
Si usas un dominio propio para la app (ej. `menudigital.mx`), agrégalo en `APP_HOSTS` para que no se trate como dominio de un cliente.
Para incrustar el menú en la web del cliente: `<iframe src="https://TU-APP/menu/su-slug" style="width:100%;height:100vh;border:0"></iframe>`.

## 5. QR por mesa
Genera un QR por mesa apuntando a:
```
https://TU-DOMINIO/menu/molienda?mesa=7
```
(Cualquier generador de QR sirve; se puede pedir a Claude Code una página `/admin/qr` que los genere con `qrcode`.)

## Checklist antes de producción
- [ ] Cambiar el número de WhatsApp en Configuración → WhatsApp (formato `52` + 10 dígitos).
- [ ] Reemplazar fotos Unsplash por fotos reales.
- [ ] Base de datos conectada (`DATABASE_URL`) y `SESSION_SECRET` configurada.
- [ ] Plan Pro de Vercel si vas a cobrar (el plan Hobby no permite uso comercial).
- [ ] Probar el envío en un teléfono real (iOS y Android) — WhatsApp debe abrir con el mensaje.
- [ ] Favicon, título y Open Graph (`generateMetadata` con nombre y foto del negocio).
