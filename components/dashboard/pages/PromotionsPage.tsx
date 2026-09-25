"use client";

import { useState } from "react";
import { Select, Toggle } from "@/components/ui";
import { money } from "@/lib/money";
import type { Promotion } from "@/types";
import { useAdmin } from "../AdminProvider";
import { categoryName, newId } from "../productActions";
import { PInput, PLabel, PageHeader, PButton, PanelDrawer, Seg, SettingRow } from "../ui";

type PromoDraft = Omit<Promotion, "value"> & { value: string };

const PTYPE: Record<Promotion["type"], string> = { bogo: "2×1", percent: "Porcentaje de descuento", price: "Precio promocional" };

const fmtDate = (s: string) => {
  if (!s) return "—";
  const [, mo, da] = s.split("-");
  return `${da}/${mo}`;
};
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function PromotionsPage() {
  const { business, update, confirm, toast } = useAdmin();
  const [drawer, setDrawer] = useState<{ draft: PromoDraft; isNew: boolean } | null>(null);
  const m = (n: number) => money(n, business.settings.currency);
  const productName = (id?: string) => business.products.find((p) => p.id === id)?.name ?? "Producto";
  const cats = [...business.categories].sort((a, b) => a.order - b.order);
  const products = business.products.filter((p) => p.status !== "archived");
  const setDr = <K extends keyof PromoDraft>(k: K, v: PromoDraft[K]) => setDrawer((d) => (d ? { ...d, draft: { ...d.draft, [k]: v } } : d));

  const openNew = () => {
    const today = new Date();
    setDrawer({
      isNew: true,
      draft: {
        id: newId("promo"),
        name: "",
        type: "bogo",
        productId: products[0]?.id,
        categoryId: cats[0]?.id,
        value: "0",
        start: isoDate(today),
        end: isoDate(new Date(today.getTime() + 30 * 864e5)),
        active: true,
        banner: "",
      },
    });
  };

  const save = () => {
    if (!drawer) return;
    const dr = drawer.draft;
    if (!dr.name.trim()) return toast("Escribe un nombre");
    const value = Number(dr.value.replace(",", ".")) || 0;
    if (dr.type === "percent" && (value <= 0 || value > 100)) return toast("El porcentaje debe estar entre 1 y 100");
    if (dr.type === "price" && value <= 0) return toast("Indica el precio promocional");
    if (dr.start && dr.end && dr.end < dr.start) return toast("La fecha final debe ser posterior a la inicial");
    const promo: Promotion = {
      ...dr,
      name: dr.name.trim(),
      value: dr.type === "bogo" ? 0 : value,
      productId: dr.type === "percent" ? undefined : dr.productId,
      categoryId: dr.type === "percent" ? dr.categoryId : undefined,
    };
    update((d) => {
      if (drawer.isNew) d.promotions.push(promo);
      else d.promotions = d.promotions.map((x) => (x.id === promo.id ? promo : x));
    }, drawer.isNew ? "Promoción creada" : "Promoción guardada");
    setDrawer(null);
  };

  const remove = async () => {
    if (!drawer) return;
    const ok = await confirm({ title: `¿Eliminar “${drawer.draft.name}”?`, text: "La promoción dejará de aplicarse." });
    if (!ok) return;
    update((d) => {
      d.promotions = d.promotions.filter((x) => x.id !== drawer.draft.id);
    }, "Promoción eliminada");
    setDrawer(null);
  };

  return (
    <>
      <PageHeader
        title="Promociones"
        sub="Las promociones activas se muestran en el menú y se aplican en el carrito."
        actions={
          <PButton variant="primary" onClick={openNew}>
            Nueva promoción
          </PButton>
        }
      />

      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-3.5">
        {business.promotions.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-[14px] border border-p-card bg-white">
            <div
              className="min-h-[112px] p-[18px]"
              style={p.active ? { background: business.theme.primary, color: "#fff" } : { background: "#D9D4CB", color: "#1B1916" }}
            >
              <div className="text-[11.5px] font-bold tracking-[.08em] uppercase opacity-85">
                {PTYPE[p.type]}
                {p.type === "percent" ? ` · ${p.value}%` : p.type === "price" ? ` · ${m(p.value)}` : ""}
              </div>
              <div className="mt-1.5 font-pdisplay text-2xl leading-[1.05]">{p.name}</div>
              <div className="mt-1.5 text-[13px] opacity-90">{p.banner}</div>
            </div>
            <div className="grid gap-1.5 px-[18px] py-3.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-p-muted">Aplica a</span>
                <span className="font-semibold">{p.type === "percent" ? categoryName(business, p.categoryId ?? "") : productName(p.productId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-p-muted">Vigencia</span>
                <span className="font-semibold">
                  {fmtDate(p.start)} – {fmtDate(p.end)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-p-sep px-[18px] py-3">
              <div className="flex items-center gap-2.5">
                <Toggle
                  checked={p.active}
                  label={`${p.name} activa`}
                  onChange={() =>
                    update(
                      (d) => {
                        const x = d.promotions.find((y) => y.id === p.id);
                        if (x) x.active = !x.active;
                      },
                      p.active ? "Promoción desactivada" : "Promoción activada",
                    )
                  }
                />
                <span className="font-semibold">{p.active ? "Activa" : "Inactiva"}</span>
              </div>
              <PButton size="sm" onClick={() => setDrawer({ isNew: false, draft: { ...structuredClone(p), value: String(p.value) } })}>
                Editar
              </PButton>
            </div>
          </div>
        ))}
      </div>
      {!business.promotions.length ? (
        <div className="mt-5 rounded-[14px] border-[1.5px] border-dashed border-p-input p-10 text-center text-p-muted">Aún no hay promociones.</div>
      ) : null}

      <PanelDrawer
        open={!!drawer}
        title={drawer?.isNew ? "Nueva promoción" : "Editar promoción"}
        onClose={() => setDrawer(null)}
        footer={
          <>
            <div>
              {drawer && !drawer.isNew ? (
                <PButton variant="danger" onClick={() => void remove()}>
                  Eliminar
                </PButton>
              ) : null}
            </div>
            <div className="flex gap-2">
              <PButton onClick={() => setDrawer(null)}>Cancelar</PButton>
              <PButton variant="primary" className="px-[18px]" onClick={save}>
                Guardar
              </PButton>
            </div>
          </>
        }
      >
        {drawer ? (
          <>
            <div>
              <PLabel htmlFor="pr-name">Nombre</PLabel>
              <PInput id="pr-name" value={drawer.draft.name} onChange={(e) => setDr("name", e.target.value)} placeholder="Ej. 2x1 en americanos" />
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Tipo</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PTYPE) as Promotion["type"][]).map((k) => (
                  <Seg key={k} active={drawer.draft.type === k} onClick={() => setDr("type", k)}>
                    {PTYPE[k]}
                  </Seg>
                ))}
              </div>
            </div>
            {drawer.draft.type === "percent" ? (
              <div>
                <PLabel htmlFor="pr-cat">Categoría</PLabel>
                <Select id="pr-cat" className="w-full" value={drawer.draft.categoryId ?? ""} onChange={(e) => setDr("categoryId", e.target.value)}>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <PLabel htmlFor="pr-prod">Producto relacionado</PLabel>
                <Select id="pr-prod" className="w-full" value={drawer.draft.productId ?? ""} onChange={(e) => setDr("productId", e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {drawer.draft.type !== "bogo" ? (
              <div>
                <PLabel htmlFor="pr-val">{drawer.draft.type === "percent" ? "Porcentaje de descuento" : "Precio promocional"}</PLabel>
                <PInput id="pr-val" inputMode="decimal" value={drawer.draft.value} onChange={(e) => setDr("value", e.target.value)} />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <PLabel htmlFor="pr-start">Fecha inicial</PLabel>
                <PInput id="pr-start" type="date" value={drawer.draft.start} onChange={(e) => setDr("start", e.target.value)} className="px-2.5" />
              </div>
              <div>
                <PLabel htmlFor="pr-end">Fecha final</PLabel>
                <PInput id="pr-end" type="date" value={drawer.draft.end} onChange={(e) => setDr("end", e.target.value)} className="px-2.5" />
              </div>
            </div>
            <div>
              <PLabel htmlFor="pr-banner">Texto del banner</PLabel>
              <PInput id="pr-banner" value={drawer.draft.banner} onChange={(e) => setDr("banner", e.target.value)} placeholder="Se muestra en el menú" />
            </div>
            <SettingRow title="Activa">
              <Toggle checked={drawer.draft.active} onChange={(v) => setDr("active", v)} label="Activa" />
            </SettingRow>
          </>
        ) : null}
      </PanelDrawer>
    </>
  );
}
