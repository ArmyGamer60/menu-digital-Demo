"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, X } from "lucide-react";
import { useState } from "react";
import { Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Category } from "@/types";
import { useAdmin } from "../AdminProvider";
import { newId } from "../productActions";
import { IconBtn, PInput, PLabel, PageHeader, PButton, PanelDrawer, SettingRow, StatusPill, Thumb } from "../ui";

type Indicator = "top" | "bottom" | null;

function CategoryRow({
  cat,
  count,
  indicator,
  onToggle,
  onEdit,
  onRemove,
}: {
  cat: Category;
  count: number;
  indicator: Indicator;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  // Sin transform: el destino se marca con una línea ink (como el prototipo) en lugar de desplazar filas.
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({ id: cat.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-3.5 rounded-xl border bg-white px-4 py-3 transition-shadow duration-100",
        indicator ? "border-p-ink" : "border-p-card",
        indicator === "top" && "shadow-[0_-3px_0_#1B1916]",
        indicator === "bottom" && "shadow-[0_3px_0_#1B1916]",
        isDragging ? "opacity-45" : !cat.visible && "opacity-75",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reordenar ${cat.name}`}
        className="cursor-grab touch-none border-0 bg-transparent px-1 text-[#A39B8F] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <Thumb src={cat.image} className="flex size-12 items-center justify-center rounded-[10px] font-pdisplay text-xl text-p-muted">
        {cat.image ? null : cat.name.charAt(0)}
      </Thumb>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <b className="text-[15px] font-bold">{cat.name}</b>
          {!cat.visible ? (
            <StatusPill bg="#E6E9EE" fg="#3F4A5A" className="h-5 px-2 text-[11.5px]">
              Oculta
            </StatusPill>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-p-muted">{cat.description}</div>
      </div>
      <span className="text-[13px] whitespace-nowrap text-p-muted">
        {count} {count === 1 ? "producto" : "productos"}
      </span>
      <Toggle checked={cat.visible} onChange={onToggle} label={`${cat.name} visible`} />
      <PButton size="sm" onClick={onEdit}>
        Editar
      </PButton>
      <IconBtn aria-label={`Eliminar ${cat.name}`} danger onClick={onRemove} className="border-p-input">
        <X size={14} />
      </IconBtn>
    </div>
  );
}

export function CategoriesPage() {
  const { business, update, confirm, toast } = useAdmin();
  const [drawer, setDrawer] = useState<{ draft: Category; isNew: boolean } | null>(null);
  const [over, setOver] = useState<{ id: string; indicator: Indicator } | null>(null);
  const sorted = [...business.categories].sort((a, b) => a.order - b.order);
  const count = (id: string) => business.products.filter((p) => p.categoryId === id && p.status !== "archived").length;
  const catName = (id: string | number) => sorted.find((c) => c.id === id)?.name ?? "la categoría";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragOver = ({ active, over: o }: DragOverEvent) => {
    if (!o || o.id === active.id) return setOver(null);
    const from = sorted.findIndex((c) => c.id === active.id);
    const to = sorted.findIndex((c) => c.id === o.id);
    setOver({ id: String(o.id), indicator: from > to ? "top" : "bottom" });
  };

  const onDragEnd = ({ active, over: o }: DragEndEvent) => {
    setOver(null);
    if (!o || o.id === active.id) return;
    const from = sorted.findIndex((c) => c.id === active.id);
    const to = sorted.findIndex((c) => c.id === o.id);
    const next = arrayMove(sorted, from, to).map((c) => c.id);
    update((d) => {
      d.categories.forEach((c) => {
        c.order = next.indexOf(c.id) + 1;
      });
      d.categories.sort((a, b) => a.order - b.order);
    }, "Orden actualizado");
  };

  const remove = async (c: Category) => {
    const n = count(c.id);
    const ok = await confirm({
      title: `¿Eliminar la categoría “${c.name}”?`,
      text: n ? `Sus ${n} productos pasarán a borrador sin categoría.` : "La categoría no tiene productos.",
    });
    if (!ok) return;
    update((d) => {
      d.categories = d.categories.filter((x) => x.id !== c.id);
      d.products.forEach((p) => {
        if (p.categoryId === c.id) {
          p.categoryId = "";
          p.status = "draft";
        }
      });
      d.promotions = d.promotions.filter((p) => p.categoryId !== c.id || p.type !== "percent");
    }, "Categoría eliminada");
  };

  const save = () => {
    if (!drawer) return;
    const item = { ...drawer.draft, name: drawer.draft.name.trim() };
    if (!item.name) return toast("Escribe un nombre");
    update((d) => {
      if (drawer.isNew) d.categories.push({ ...item, order: d.categories.length + 1 });
      else d.categories = d.categories.map((x) => (x.id === item.id ? item : x));
    }, drawer.isNew ? "Categoría creada" : "Categoría guardada");
    setDrawer(null);
  };
  const setDr = <K extends keyof Category>(k: K, v: Category[K]) => setDrawer((d) => (d ? { ...d, draft: { ...d.draft, [k]: v } } : d));

  return (
    <>
      <PageHeader
        title="Categorías"
        sub="Arrastra para cambiar el orden en el menú público."
        actions={
          <PButton
            variant="primary"
            onClick={() =>
              setDrawer({ isNew: true, draft: { id: newId("cat"), name: "", description: "", image: "", visible: true, order: 0 } })
            }
          >
            Nueva categoría
          </PButton>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setOver(null)}
        accessibility={{
          screenReaderInstructions: { draggable: "Pulsa espacio para tomar la categoría, flechas para moverla y espacio para soltarla." },
          announcements: {
            onDragStart: ({ active }) => `Tomaste ${catName(active.id)}.`,
            onDragOver: ({ active, over }) => (over ? `${catName(active.id)} está sobre ${catName(over.id)}.` : `${catName(active.id)} fuera de la lista.`),
            onDragEnd: ({ active, over }) => (over ? `${catName(active.id)} se movió a la posición de ${catName(over.id)}.` : `${catName(active.id)} se soltó.`),
            onDragCancel: ({ active }) => `Se canceló el movimiento de ${catName(active.id)}.`,
          },
        }}
      >
        <SortableContext items={sorted.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-5 grid max-w-[900px] gap-2">
            {sorted.map((c) => (
              <CategoryRow
                key={c.id}
                cat={c}
                count={count(c.id)}
                indicator={over?.id === c.id ? over.indicator : null}
                onToggle={() =>
                  update(
                    (d) => {
                      const x = d.categories.find((y) => y.id === c.id);
                      if (x) x.visible = !x.visible;
                    },
                    c.visible ? `${c.name} oculta` : `${c.name} visible`,
                  )
                }
                onEdit={() => setDrawer({ isNew: false, draft: structuredClone(c) })}
                onRemove={() => void remove(c)}
              />
            ))}
            {!sorted.length ? (
              <div className="rounded-[14px] border-[1.5px] border-dashed border-p-input p-10 text-center text-p-muted">Aún no hay categorías.</div>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      <PanelDrawer
        open={!!drawer}
        title={drawer?.isNew ? "Nueva categoría" : "Editar categoría"}
        onClose={() => setDrawer(null)}
        footer={
          <>
            <span />
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
              <PLabel htmlFor="cat-name">Nombre</PLabel>
              <PInput id="cat-name" autoFocus value={drawer.draft.name} onChange={(e) => setDr("name", e.target.value)} placeholder="Ej. Desayunos" />
            </div>
            <div>
              <PLabel htmlFor="cat-desc">Descripción</PLabel>
              <PInput id="cat-desc" value={drawer.draft.description} onChange={(e) => setDr("description", e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <PLabel htmlFor="cat-img" hint="(opcional)">
                Imagen
              </PLabel>
              <PInput id="cat-img" value={drawer.draft.image ?? ""} onChange={(e) => setDr("image", e.target.value)} placeholder="https://" className="text-[12.5px]" />
            </div>
            <SettingRow title="Visible en el menú" desc="Si la ocultas, sus productos no se muestran.">
              <Toggle checked={drawer.draft.visible} onChange={(v) => setDr("visible", v)} label="Visible en el menú" />
            </SettingRow>
          </>
        ) : null}
      </PanelDrawer>
    </>
  );
}
