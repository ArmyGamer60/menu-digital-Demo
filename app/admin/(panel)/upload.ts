"use server";

import { put } from "@vercel/blob";
import { assertAccess } from "@/lib/session";

/* Subida de imágenes del panel.
   - Producción: Vercel Blob (BLOB_READ_WRITE_TOKEN, o la misma variable con prefijo).
   - Desarrollo sin token: se guardan en public/uploads. */

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif" };
/** Las imágenes llegan ya comprimidas desde el navegador; esto es solo un tope de seguridad. */
const MAX_BYTES = 3 * 1024 * 1024;

function blobToken(env: NodeJS.ProcessEnv = process.env): string {
  if (env.BLOB_READ_WRITE_TOKEN) return env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(env).find((k) => /(^|_)READ_WRITE_TOKEN$/.test(k) && env[k]);
  return key ? env[key]! : "";
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadImageAction(businessId: string, form: FormData): Promise<UploadResult> {
  try {
    await assertAccess(businessId);
    const file = form.get("file");
    if (!(file instanceof Blob)) return { ok: false, error: "No llegó ninguna imagen." };
    const ext = TYPES[file.type];
    if (!ext) return { ok: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
    if (file.size > MAX_BYTES) return { ok: false, error: "La imagen es demasiado grande." };

    const name = `${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}.${ext}`;
    const token = blobToken();
    if (token) {
      const blob = await put(`negocios/${businessId}/${name}`, file, { access: "public", token, contentType: file.type });
      return { ok: true, url: blob.url };
    }
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Falta conectar Vercel Blob (Storage) para subir imágenes. Mientras tanto usa un enlace." };
    }
    const { mkdir, writeFile } = await import("node:fs/promises");
    const dir = [process.cwd(), "public", "uploads", businessId].join("/");
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/${name}`, Buffer.from(await file.arrayBuffer()));
    return { ok: true, url: `/uploads/${businessId}/${name}` };
  } catch (e) {
    console.error("uploadImage", e);
    return { ok: false, error: "No se pudo subir la imagen." };
  }
}
