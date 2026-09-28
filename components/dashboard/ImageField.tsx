"use client";

import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { uploadImageAction } from "@/app/admin/(panel)/upload";
import { cn } from "@/lib/cn";
import { ACCEPTED_IMAGE, MAX_ORIGINAL_BYTES, compressImage, type ImageKind } from "@/lib/images";
import { useAdmin } from "./AdminProvider";
import { PButton, PInput, Thumb } from "./ui";

/** Comprime en el navegador y sube al almacenamiento del negocio. Devuelve la URL o null (ya avisó con toast). */
export function useImageUpload() {
  const { business, toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const upload = async (file: File | undefined, kind: ImageKind): Promise<string | null> => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) return toast("Elige un archivo de imagen"), null;
    if (file.size > MAX_ORIGINAL_BYTES) return toast("La imagen pesa más de 25 MB"), null;
    setBusy(true);
    try {
      const blob = await compressImage(file, kind);
      const form = new FormData();
      form.append("file", blob, "imagen");
      const r = await uploadImageAction(business.id, form);
      if (!r.ok) return toast(r.error), null;
      return r.url;
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo subir la imagen");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy };
}

/** Foto con "Subir" (se comprime en el navegador y va a Vercel Blob), arrastrar y soltar, quitar
    y, como alternativa, pegar un enlace. */
export function ImageField({
  value,
  onChange,
  kind,
  label,
  previewClassName,
  empty = "Sin imagen",
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  kind: ImageKind;
  /** Nombre accesible del campo ("Foto del producto"). */
  label: string;
  previewClassName?: string;
  empty?: ReactNode;
  hint?: ReactNode;
}) {
  const { upload: uploadFile, busy } = useImageUpload();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const isLink = !!value && /^https?:\/\//.test(value) && !value.includes(".blob.vercel-storage.com/");

  const upload = async (file: File | undefined) => {
    const url = await uploadFile(file, kind);
    if (!url) return;
    onChange(url);
    setShowLink(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void upload(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-wrap items-start gap-4">
      <button
        type="button"
        aria-label={value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-xl border-[1.5px] border-dashed p-0 transition-colors",
          value ? "border-transparent" : "border-p-input bg-p-row",
          drag && "border-p-ink bg-p-row",
          previewClassName,
        )}
      >
        <Thumb src={value} className="flex size-full items-center justify-center text-[13px] text-p-muted">
          {value ? null : (
            <span className="flex flex-col items-center gap-1.5 px-2 text-center">
              <ImagePlus size={22} strokeWidth={1.6} aria-hidden />
              {empty}
            </span>
          )}
        </Thumb>
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 size={22} className="animate-spin" aria-label="Subiendo" />
          </span>
        ) : null}
      </button>

      <div className="grid min-w-[200px] flex-1 gap-2">
        <div className="flex flex-wrap gap-2">
          <PButton size="md" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus size={16} aria-hidden />
            {busy ? "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
          </PButton>
          {value ? (
            <PButton size="md" variant="ghost" disabled={busy} onClick={() => onChange("")}>
              <Trash2 size={16} aria-hidden />
              Quitar
            </PButton>
          ) : null}
        </div>
        {showLink || isLink ? (
          <PInput
            aria-label={`${label} (enlace)`}
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
            placeholder="https://…"
            className="text-[13px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowLink(true)}
            className="inline-flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-p-muted hover:text-p-ink"
          >
            <Link2 size={14} aria-hidden />
            Usar un enlace
          </button>
        )}
        <div className="text-[12.5px] leading-[1.45] text-p-muted">
          {hint ?? "JPG, PNG o WebP. Se reduce automáticamente antes de subirse."} También puedes arrastrarla aquí.
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void upload(f);
        }}
      />
    </div>
  );
}
