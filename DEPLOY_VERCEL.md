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
3. En **Settings → Environment Variables** agrega `ADMIN_PASSWORD` (contraseña del panel `/admin`; sin ella el panel queda deshabilitado en producción). Opcional: `ADMIN_SESSION_SECRET` (32+ caracteres aleatorios). Ver `.env.example`. Tras añadirla, **Redeploy** para que se aplique.
   (Fase 2) Agrega también:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   Tip: Vercel → Storage / Marketplace → **Supabase** crea el proyecto y carga las variables automáticamente.
4. **Deploy.** Obtendrás `https://menu-digital.vercel.app`. Tu menú: `/menu/molienda`, panel: `/admin`.

Cada `git push` a `main` redepliega; cada rama/PR genera una URL de preview.

Alternativa sin GitHub: `npm i -g vercel && vercel` (y `vercel --prod` para producción).

## 4. Dominio propio (opcional)
Vercel → Project → **Settings → Domains** → agrega `menu.tunegocio.com` y crea el registro DNS que te indique (CNAME a `cname.vercel-dns.com`).

## 5. QR por mesa
Genera un QR por mesa apuntando a:
```
https://TU-DOMINIO/menu/molienda?mesa=7
```
(Cualquier generador de QR sirve; se puede pedir a Claude Code una página `/admin/qr` que los genere con `qrcode`.)

## Checklist antes de producción
- [ ] Cambiar el número de WhatsApp en Configuración → WhatsApp (formato `52` + 10 dígitos).
- [ ] Reemplazar fotos Unsplash por fotos reales.
- [ ] Fase 2 activa (sin ella, lo que edites en el panel solo vive en tu navegador).
- [ ] Login real (Supabase Auth) antes de compartir `/admin`.
- [ ] Probar el envío en un teléfono real (iOS y Android) — WhatsApp debe abrir con el mensaje.
- [ ] Favicon, título y Open Graph (`generateMetadata` con nombre y foto del negocio).
