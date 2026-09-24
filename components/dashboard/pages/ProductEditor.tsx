"use client";

import { ArrowUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import { z } from "zod";
import { Select, Toggle } from "@/components/ui";
import { seedBusiness } from "@/data/seed";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";
import type { Badge, Product, ProductStatus } from "@/types";
import { useAdmin } from "../AdminProvider";
import { PRESET_TAGS, newId, useProductActions } from "../productActions";
import {
  Card,
  CardTitle,
  FieldError,
  GROUP_KIND,
  IconBtn,
  PInput,
  PLabel,
  PRODUCT_STATUS,
  PTextarea,
  PageHeader,
  PButton,
  PrefixInput,
  Seg,
  StatusPill,
  Thumb,
} from "../ui";

/** Borrador del formulario: precios como texto mientras se editan. */
type Draft = Omit<Product, "price" | "compareAt"> & { price: string; compareAt: string };

const DESC_MAX = 140;
const BADGES: [Badge, string][] = [
  [null, "Ninguno"],
  ["nuevo", "Nuevo"],
  ["popular", "Popular"],
  ["especial", "Especial"],
  ["recomendado", "Recomendado"],
];
const GALLERY = [...new Set(seedBusiness.products.map((p) => p.image))];

const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  price: z
    .string()
    .trim()
    .min(1, "Indica un precio válido.")
    .transform((v) => Number(v.replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n >= 0, "Indica un precio válido."),
});

function toDraft(p: Product): Draft {
  return { ...structuredClone(p), price: String(p.price), compareAt: p.compareAt != null ? String(p.compareAt) : "" };
}

export function ProductEditor({ productId }: { productId: string | null }) {
  const { business, update } = useAdmin();
  const router = useRouter();
  const actions = useProductActions();
  const existing = productId ? business.products.find((p) => p.id === productId) : undefined;
  const cats = useMemo(() => [...business.categories].sort((a, b) => a.order - b.order), [business.categories]);

  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? toDraft(existing)
      : {
          id: newId("pr"),
          categoryId: cats[0]?.id ?? "",
          name: "",
          description: "",
          price: "",
          compareAt: "",
          image: "",
          sku: "",
          tags: [],
          badge: null,
          status: "draft",
          featured: false,
          modifierGroupIds: [],
          sold: 0,
        },
  );
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [picker, setPicker] = useState(false);
  const [newTag, setNewTag] = useState("");
  const isNew = !existing;
  const m = (n: number) => money(n, business.settings.currency);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    if (k === "name" || k === "price") setErrors((e) => ({ ...e, [k]: undefined }));
  };

  if (productId && !existing) {
    return (
      <div className="py-20 text-center">
        <div className="font-pdisplay text-[28px]">Producto no encontrado</div>
        <p className="mt-2 text-p-muted">Puede que se haya eliminado.</p>
        <Link href="/admin/products" className="mt-4 inline-block font-semibold">
          Volver al menú
        </Link>
      </div>
    );
  }

  const save = (status?: ProductStatus) => {
    const res = productSchema.safeParse(draft);
    if (!res.success) {
      const e: typeof errors = {};
      for (const i of res.error.issues) {
        const k = i.path[0];
        if ((k === "name" || k === "price") && !e[k]) e[k] = i.message;
      }
      setErrors(e);
      return;
    }
    const compare = draft.compareAt.trim() ? Number(draft.compareAt.replace(",", ".")) : null;
    const product: Product = {
      ...draft,
      name: res.data.name,
      price: res.data.price,
      compareAt: compare != null && Number.isFinite(compare) && compare > 0 ? compare : null,
      sku: draft.sku?.trim() ?? "",
      status: status ?? draft.status,
    };
    update(
      (d) => {
        if (isNew) d.products.unshift(product);
        else d.products = d.products.map((x) => (x.id === product.id ? product : x));
      },
      status === "published" ? "Producto publicado" : status === "draft" ? "Guardado como borrador" : "Cambios guardados",
    );
    setDraft(toDraft(product));
    setErrors({});
    if (isNew) router.replace(`/admin/products/${product.id}`);
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !draft.tags.includes(t)) set("tags", [...draft.tags, t]);
    setNewTag("");
  };
  const allTags = [...new Set([...PRESET_TAGS, ...business.products.flatMap((p) => p.tags), ...draft.tags])];
  const groups = draft.modifierGroupIds
    .map((id) => business.modifierGroups.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g);
  const availableGroups = business.modifierGroups.filter((g) => !draft.modifierGroupIds.includes(g.id));
  const moveGroup = (i: number) => {
    if (!i) return;
    const a = [...draft.modifierGroupIds];
    [a[i - 1], a[i]] = [a[i]!, a[i - 1]!];
    set("modifierGroupIds", a);
  };
  const previewPrice = Number(draft.price.replace(",", "."));

  return (
    <>
      <PageHeader
        title={isNew ? "Nuevo producto" : "Editar producto"}
        sub={isNew ? "Completa la información y publícalo cuando esté listo." : `SKU ${draft.sku || "—"} · ${PRODUCT_STATUS[draft.status].label}`}
        actions={
          <>
            <PButton onClick={() => save("draft")}>Guardar como borrador</PButton>
            <PButton variant="secondary" onClick={() => save()}>
              Guardar
            </PButton>
            <PButton variant="primary" onClick={() => save("published")}>
              Guardar y publicar
            </PButton>
          </>
        }
      />

      <div className="mt-[22px] grid items-start gap-[18px] min-[1150px]:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 gap-[18px]">
          <Card>
            <CardTitle className="mb-4">Información básica</CardTitle>
            <div className="grid gap-3.5">
              <div>
                <PLabel htmlFor="pe-name">Nombre</PLabel>
                <PInput
                  id="pe-name"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej. Latte Caramelo"
                  invalid={!!errors.name}
                  className="text-[15px]"
                />
                <FieldError>{errors.name}</FieldError>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between">
                  <label htmlFor="pe-desc" className="text-[13px] font-semibold">
                    Descripción corta
                  </label>
                  <span className="text-xs text-p-muted">
                    {draft.description.length}/{DESC_MAX}
                  </span>
                </div>
                <PTextarea
                  id="pe-desc"
                  rows={3}
                  maxLength={DESC_MAX}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Qué lleva, cómo se sirve"
                />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                <div>
                  <PLabel htmlFor="pe-price">Precio</PLabel>
                  <PrefixInput
                    id="pe-price"
                    prefix="$"
                    inputMode="decimal"
                    placeholder="0"
                    value={draft.price}
                    invalid={!!errors.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                  <FieldError>{errors.price}</FieldError>
                </div>
                <div>
                  <PLabel htmlFor="pe-compare" hint="(opcional)">
                    Precio anterior
                  </PLabel>
                  <PrefixInput
                    id="pe-compare"
                    prefix="$"
                    inputMode="decimal"
                    placeholder="—"
                    value={draft.compareAt}
                    onChange={(e) => set("compareAt", e.target.value)}
                  />
                </div>
                <div>
                  <PLabel htmlFor="pe-sku" hint="(opcional)">
                    SKU
                  </PLabel>
                  <PInput id="pe-sku" mono value={draft.sku ?? ""} onChange={(e) => set("sku", e.target.value)} placeholder="CAF-010" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3.5 flex items-center justify-between">
              <CardTitle>Imagen</CardTitle>
              <PButton size="sm" className="h-[34px]" aria-expanded={picker} onClick={() => setPicker((v) => !v)}>
                {picker ? "Cerrar galería" : "Cambiar imagen"}
              </PButton>
            </div>
            <div className="flex flex-wrap items-start gap-4">
              <Thumb src={draft.image} className="flex aspect-[4/5] w-[180px] items-center justify-center rounded-xl text-[13px] text-p-muted">
                {draft.image ? null : <span>Sin imagen</span>}
              </Thumb>
              <div className="min-w-[220px] flex-1">
                <PLabel htmlFor="pe-img">URL de la imagen</PLabel>
                <PInput id="pe-img" value={draft.image} onChange={(e) => set("image", e.target.value)} placeholder="https://" className="text-[13px]" />
                <div className="mt-2 text-[12.5px] leading-[1.45] text-p-muted">
                  Recomendado: 1200 × 1500 px, fondo limpio, luz natural. En la fase 2 la imagen se subirá a Supabase Storage.
                </div>
              </div>
            </div>
            {picker ? (
              <div className="mt-4 grid animate-[rise_.2s] grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
                {GALLERY.map((src) => (
                  <button
                    key={src}
                    type="button"
                    aria-label="Usar esta imagen"
                    aria-pressed={draft.image === src}
                    onClick={() => set("image", src)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-[9px] border-2 bg-[#EEE9E1] p-0",
                      draft.image === src ? "border-p-ink" : "border-transparent",
                    )}
                  >
                    <Thumb src={src} className="size-full" />
                  </button>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <CardTitle>Modificadores</CardTitle>
              <Select
                size="sm"
                value=""
                aria-label="Agregar grupo de modificadores"
                onChange={(e) => e.target.value && set("modifierGroupIds", [...draft.modifierGroupIds, e.target.value])}
              >
                <option value="">+ Agregar grupo</option>
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({GROUP_KIND[g.kind].label})
                  </option>
                ))}
              </Select>
            </div>
            <div className="mb-3 text-[13px] text-p-muted">Variantes, opciones y extras que el cliente elige al pedir.</div>
            {!groups.length ? (
              <div className="rounded-[10px] border-[1.5px] border-dashed border-p-input p-5 text-center text-p-muted">
                Este producto no tiene modificadores.
              </div>
            ) : (
              <div className="grid gap-2">
                {groups.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-[10px] border border-p-card px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="font-bold">{g.name}</b>
                        <StatusPill bg={GROUP_KIND[g.kind].bg} fg={GROUP_KIND[g.kind].fg}>
                          {GROUP_KIND[g.kind].label}
                        </StatusPill>
                        <span className="text-xs text-p-muted">
                          {g.type === "single" ? "Única" : "Múltiple"} · {g.required ? "Obligatorio" : "Opcional"}
                        </span>
                      </div>
                      <div className="mt-[3px] truncate text-[12.5px] text-p-muted">
                        {g.options.map((o) => o.name + (o.price ? ` +${m(o.price)}` : "")).join(" · ")}
                      </div>
                    </div>
                    <IconBtn aria-label={`Subir ${g.name}`} disabled={i === 0} onClick={() => moveGroup(i)} className="size-[30px] rounded-[7px]">
                      <ArrowUp size={14} />
                    </IconBtn>
                    <IconBtn
                      aria-label={`Quitar ${g.name}`}
                      danger
                      onClick={() => set("modifierGroupIds", draft.modifierGroupIds.filter((x) => x !== g.id))}
                      className="size-[30px] rounded-[7px]"
                    >
                      <X size={14} />
                    </IconBtn>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 gap-[18px]">
          <Card pad={20}>
            <CardTitle className="mb-3">Estado</CardTitle>
            <div className="grid gap-1.5" role="radiogroup" aria-label="Estado">
              {(Object.keys(PRODUCT_STATUS) as ProductStatus[]).map((k) => {
                const on = draft.status === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("status", k)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[9px] border px-2.5 py-[9px] text-left",
                      on ? "border-p-ink bg-p-row" : "border-[#EFEBE4] bg-white",
                    )}
                  >
                    <span
                      className={cn("size-4 flex-none rounded-full bg-white", on ? "border-[5px] border-p-ink" : "border-[1.5px] border-[#C9C3B8]")}
                    />
                    <span className="flex-1">
                      <span className="block font-semibold">{PRODUCT_STATUS[k].label}</span>
                      <span className="block text-xs text-p-muted">{PRODUCT_STATUS[k].desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card pad={20} className="grid gap-3.5">
            <CardTitle>Organización</CardTitle>
            <div>
              <PLabel htmlFor="pe-cat">Categoría</PLabel>
              <Select id="pe-cat" className="w-full" value={draft.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {!draft.categoryId ? <option value="">Sin categoría</option> : null}
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Badge</div>
              <div className="flex flex-wrap gap-1.5">
                {BADGES.map(([k, label]) => (
                  <Seg key={label} active={draft.badge === k} onClick={() => set("badge", k)}>
                    {label}
                  </Seg>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Etiquetas</div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => {
                  const on = draft.tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("tags", on ? draft.tags.filter((x) => x !== t) : [...draft.tags, t])}
                      className={cn(
                        "h-[30px] rounded-[15px] border px-[11px] text-[12.5px] font-semibold",
                        on ? "border-p-ink bg-p-ink text-white" : "border-p-input bg-white",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5">
                <PInput
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Nueva etiqueta"
                  aria-label="Nueva etiqueta"
                  className="h-[34px] rounded-lg px-2.5"
                />
                <PButton size="sm" className="h-[34px]" onClick={addTag}>
                  Agregar
                </PButton>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Destacado</div>
                <div className="text-xs text-p-muted">Aparece en la franja “Destacados”.</div>
              </div>
              <Toggle checked={draft.featured} onChange={(v) => set("featured", v)} label="Destacado" />
            </div>
          </Card>

          <Card pad={20}>
            <CardTitle className="mb-3">Vista previa</CardTitle>
            <div className="overflow-hidden rounded p-3" style={{ background: business.theme.background, color: business.theme.text }}>
              <Thumb src={draft.image} className="aspect-[4/5] w-full rounded-[2px] bg-[#E7D5C8]" />
              <div className="mt-2.5 font-pdisplay text-[21px] leading-[1.1]">{draft.name || "Nombre del producto"}</div>
              <div className="mt-1 text-[13px] opacity-70">{draft.description}</div>
              <div className="mt-2 font-bold">{Number.isFinite(previewPrice) && draft.price ? m(previewPrice) : m(0)}</div>
            </div>
          </Card>

          {!isNew ? (
            <Card pad={20} className="grid gap-2">
              <CardTitle className="mb-1">Acciones</CardTitle>
              <PButton size="md" onClick={() => router.push(`/admin/products/${actions.duplicate(existing).id}`)}>
                Duplicar producto
              </PButton>
              <PButton
                size="md"
                onClick={() => {
                  actions.toggleArchive(existing);
                  set("status", existing.status === "archived" ? "draft" : "archived");
                }}
              >
                {existing.status === "archived" ? "Restaurar como borrador" : "Archivar"}
              </PButton>
              <PButton size="md" variant="danger" onClick={() => void actions.remove(existing, () => router.push("/admin/products"))}>
                Eliminar
              </PButton>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
