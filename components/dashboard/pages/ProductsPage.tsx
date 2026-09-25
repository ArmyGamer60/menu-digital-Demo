"use client";

import { MoreHorizontal, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Select, Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";
import type { Product, ProductStatus } from "@/types";
import { useAdmin } from "../AdminProvider";
import { categoryName, useProductActions } from "../productActions";
import { PRODUCT_STATUS, PageHeader, PButton, Seg, StatusPill, Thumb } from "../ui";

const COLS = "grid-cols-[minmax(170px,2.2fr)_minmax(min(70px,100%),1fr)_70px_80px_104px_64px_100px]";

function RowMenu({ product, anchor, onClose }: { product: Product; anchor: DOMRect; onClose: () => void }) {
  const { duplicate, toggleArchive, remove } = useProductActions();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const scroller = document.getElementById("admin-scroll");
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    scroller?.addEventListener("scroll", onClose, { passive: true });
    window.addEventListener("resize", onClose);
    ref.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      scroller?.removeEventListener("scroll", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);
  const item = "h-9 w-full rounded-lg border-0 bg-transparent px-2.5 text-left hover:bg-p-canvas";
  // Fijo al viewport (la tabla tiene overflow-x); se abre hacia arriba si no cabe abajo.
  const up = anchor.bottom + 140 > window.innerHeight;
  return (
    <div
      ref={ref}
      role="menu"
      style={{ right: window.innerWidth - anchor.right, ...(up ? { bottom: window.innerHeight - anchor.top + 6 } : { top: anchor.bottom + 6 }) }}
      className="fixed z-50 w-[180px] animate-[rise_.15s_ease-out] rounded-xl border border-p-card bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,.12)]"
    >
      <button role="menuitem" type="button" className={item} onClick={() => (onClose(), duplicate(product))}>
        Duplicar
      </button>
      <button role="menuitem" type="button" className={item} onClick={() => (onClose(), toggleArchive(product))}>
        {product.status === "archived" ? "Restaurar como borrador" : "Archivar"}
      </button>
      <button
        role="menuitem"
        type="button"
        className={cn(item, "text-danger hover:bg-p-danger-bg")}
        onClick={() => (onClose(), void remove(product))}
      >
        Eliminar
      </button>
    </div>
  );
}

export function ProductsPage() {
  const { business, update } = useAdmin();
  const { openEditor } = useProductActions();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [menu, setMenu] = useState<{ id: string; anchor: DOMRect } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const m = (n: number) => money(n, business.settings.currency);

  const products = business.products;
  const query = q.trim().toLowerCase();
  const rows = products.filter(
    (p) =>
      (status === "all" ? p.status !== "archived" : p.status === status) &&
      (cat === "all" || p.categoryId === cat) &&
      (!query || `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(query)),
  );
  const count = (s: ProductStatus) => products.filter((p) => p.status === s).length;
  const cats = [...business.categories].sort((a, b) => a.order - b.order);

  const moreButton = (p: Product) => (
    <button
      type="button"
      aria-label={`Más acciones para ${p.name}`}
      aria-haspopup="menu"
      aria-expanded={menu?.id === p.id}
      onMouseDown={(e) => menu?.id === p.id && e.stopPropagation()}
      onClick={(e) => setMenu(menu?.id === p.id ? null : { id: p.id, anchor: e.currentTarget.getBoundingClientRect() })}
      className="flex size-8 flex-none items-center justify-center rounded-lg border border-p-input bg-white"
    >
      <MoreHorizontal size={16} />
    </button>
  );
  const menuProduct = menu ? products.find((p) => p.id === menu.id) : undefined;

  const toggleAvail = (p: Product) =>
    update(
      (d) => {
        const x = d.products.find((y) => y.id === p.id);
        if (x) x.status = x.status === "published" ? "soldout" : "published";
      },
      p.status === "published" ? `${p.name} marcado como agotado` : `${p.name} disponible`,
    );

  return (
    <>
      <PageHeader
        title="Menú"
        sub={`${count("published")} publicados · ${products.length} en total`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-p-ink px-4 font-semibold text-white no-underline hover:bg-p-ink-hover hover:!text-white"
          >
            <Plus size={16} strokeWidth={2.2} />
            Nuevo producto
          </Link>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <label className="flex h-[38px] max-w-[340px] min-w-[220px] flex-1 items-center max-sm:max-w-none max-sm:basis-full gap-2 rounded-[9px] border border-p-input bg-white px-3 focus-within:border-p-ink">
          <Search size={16} strokeWidth={1.8} className="text-p-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar por nombre o SKU"
            className="min-w-0 flex-1 border-0 bg-transparent outline-none"
          />
        </label>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoría" className="h-[38px] max-sm:w-full">
          <option value="all">Todas las categorías</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="no-scrollbar flex flex-wrap gap-1 max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-4" role="tablist" aria-label="Filtrar por estado">
          <Seg role="tab" aria-selected={status === "all"} active={status === "all"} onClick={() => setStatus("all")}>
            Todos <span className="ml-[3px] opacity-60">{products.filter((p) => p.status !== "archived").length}</span>
          </Seg>
          {(Object.keys(PRODUCT_STATUS) as ProductStatus[]).map((k) => (
            <Seg key={k} role="tab" aria-selected={status === k} active={status === k} onClick={() => setStatus(k)}>
              {PRODUCT_STATUS[k].label} <span className="ml-[3px] opacity-60">{count(k)}</span>
            </Seg>
          ))}
        </div>
      </div>

      {/* Móvil: tarjetas */}
      <ul className="m-0 mt-3.5 grid list-none gap-2 p-0 sm:hidden" aria-label="Productos">
        {rows.map((p) => {
          const s = PRODUCT_STATUS[p.status];
          const availEnabled = p.status === "published" || p.status === "soldout";
          return (
            <li key={p.id} className="rounded-xl border border-p-card bg-white p-3">
              <Link href={`/admin/products/${p.id}`} className="flex min-w-0 items-center gap-3 no-underline">
                <Thumb src={p.image} className="size-14 rounded-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center font-semibold">
                    <span className="truncate">{p.name}</span>
                    {p.featured ? <Star size={12} className="ml-1.5 flex-none fill-p-accent text-p-accent" aria-label="Destacado" /> : null}
                  </span>
                  <span className="block truncate text-[12.5px] text-p-muted">
                    {categoryName(business, p.categoryId)} · <span className="font-mono">{p.sku || "—"}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="tabular font-semibold">{m(p.price)}</span>
                    <StatusPill bg={s.bg} fg={s.fg}>
                      {s.label}
                    </StatusPill>
                  </span>
                </span>
              </Link>
              <div className="mt-2.5 flex items-center gap-2 border-t border-p-sep pt-2.5">
                <label className={`mr-auto flex items-center gap-2 text-[13px] font-semibold ${availEnabled ? "" : "opacity-50"}`}>
                  <Toggle
                    checked={p.status === "published"}
                    disabled={!availEnabled}
                    onChange={() => toggleAvail(p)}
                    label={`${p.name}: disponible / agotado`}
                  />
                  {p.status === "soldout" ? "Agotado" : "Disponible"}
                </label>
                <PButton size="sm" onClick={() => openEditor(p.id)}>
                  Editar
                </PButton>
                {moreButton(p)}
              </div>
            </li>
          );
        })}
        {!rows.length ? (
          <li className="rounded-xl border border-p-card bg-white px-6 py-10 text-center">
            <div className="font-pdisplay text-[22px]">Sin resultados</div>
            <div className="mt-1.5 text-p-muted">Ajusta los filtros o crea un producto nuevo.</div>
          </li>
        ) : null}
      </ul>

      <div className="mt-3.5 overflow-x-auto rounded-[14px] border border-p-card bg-white max-sm:hidden">
        <div className="min-w-[760px]">
          <div
            className={`grid ${COLS} gap-3 rounded-t-[14px] border-b border-p-card bg-p-row px-[18px] py-3 text-xs font-bold tracking-[.05em] text-p-muted uppercase`}
          >
            <span>Producto</span>
            <span>Categoría</span>
            <span>Precio</span>
            <span>Opciones</span>
            <span>Estado</span>
            <span>Disponible</span>
            <span />
          </div>
          {rows.map((p) => {
            const s = PRODUCT_STATUS[p.status];
            const availEnabled = p.status === "published" || p.status === "soldout";
            const groups = p.modifierGroupIds.length;
            return (
              <div key={p.id} className={`relative grid ${COLS} items-center gap-3 border-b border-p-sep px-[18px] py-2.5 hover:bg-p-row`}>
                <Link href={`/admin/products/${p.id}`} className="flex min-w-0 items-center gap-3 text-left no-underline">
                  <Thumb src={p.image} className="size-11 rounded-[9px]" />
                  <span className="min-w-0">
                    <span className="flex items-center truncate font-semibold">
                      <span className="truncate">{p.name}</span>
                      {p.featured ? <Star size={12} className="ml-1.5 flex-none fill-p-accent text-p-accent" aria-label="Destacado" /> : null}
                    </span>
                    <span className="block font-mono text-[11.5px] text-p-muted">{p.sku || "—"}</span>
                  </span>
                </Link>
                <span className="truncate text-p-soft">{categoryName(business, p.categoryId)}</span>
                <span className="tabular font-semibold">{m(p.price)}</span>
                <span className="text-p-muted">{groups ? `${groups} ${groups === 1 ? "grupo" : "grupos"}` : "—"}</span>
                <span>
                  <StatusPill bg={s.bg} fg={s.fg}>
                    {s.label}
                  </StatusPill>
                </span>
                <Toggle
                  checked={p.status === "published"}
                  disabled={!availEnabled}
                  onChange={() => toggleAvail(p)}
                  label={`${p.name}: disponible / agotado`}
                />
                <div className="flex justify-end gap-1">
                  <PButton size="sm" onClick={() => openEditor(p.id)}>
                    Editar
                  </PButton>
                  {moreButton(p)}
                </div>
              </div>
            );
          })}
          {!rows.length ? (
            <div className="px-6 py-14 text-center">
              <div className="font-pdisplay text-[22px]">Sin resultados</div>
              <div className="mt-1.5 text-p-muted">Ajusta los filtros o crea un producto nuevo.</div>
            </div>
          ) : null}
        </div>
      </div>
      {menu && menuProduct ? <RowMenu product={menuProduct} anchor={menu.anchor} onClose={closeMenu} /> : null}
    </>
  );
}
