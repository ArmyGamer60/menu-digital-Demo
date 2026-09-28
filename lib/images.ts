/* Imágenes: compresión en el navegador antes de subir y compatibilidad con next/image. */

/** Solo Unsplash pasa por el optimizador de next/image; el resto (Blob, enlaces pegados) se sirve tal cual.
    Las fotos subidas ya llegan reducidas y en WebP. */
export const optimizable = (src: string) => src.startsWith("https://images.unsplash.com/");

export type ImageKind = "product" | "hero" | "category" | "logo" | "favicon";

/** Lado mayor en px por tipo de imagen. */
const MAX_SIDE: Record<ImageKind, number> = { product: 1200, hero: 1800, category: 800, logo: 512, favicon: 128 };

export const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
/** Tope del archivo original (antes de comprimir). */
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Reduce y convierte a WebP (JPEG si el navegador no codifica WebP). Logos/favicons conservan transparencia en PNG si WebP no está disponible. */
export async function compressImage(file: File, kind: ImageKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) throw new Error("No se pudo leer la imagen. Prueba con JPG o PNG.");
  const max = MAX_SIDE[kind];
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp", 0.82);
  if (webp?.type === "image/webp") return webp;
  const transparent = kind === "logo" || kind === "favicon";
  const fallback = await toBlob(canvas, transparent ? "image/png" : "image/jpeg", 0.85);
  if (!fallback) throw new Error("No se pudo comprimir la imagen.");
  return fallback;
}
