"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUp, GripVertical, X } from "lucide-react";
import { useState } from "react";
import { Toggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money } from "@/lib/money";
import type { ModifierGroup } from "@/types";
import { useAdmin } from "../AdminProvider";
import { newId } from "../productActions";
import { GROUP_KIND, Help, IconBtn, PInput, PLabel, PageHeader, PButton, PanelDrawer, Seg, SettingRow, StatusPill } from "../ui";

/** Opción en edición: el precio se edita como texto. */
type OptionDraft = { id: string; name: string; price: string; isDefault?: boolean };
type GroupDraft = Omit<ModifierGroup, "options" | "max"> & { options: OptionDraft[]; max: string };

function OptionRow({
  o,
  index,
  onChange,
  onUp,
  onRemove,
}: {
  o: OptionDraft;
  index: number;
  onChange: (o: OptionDraft) => void;
  onUp: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: o.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1.5 bg-white", isDragging && "relative z-10 opacity-80")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Reordenar ${o.name || "opción"}`}
        className="cursor-grab touch-none border-0 bg-transparent px-0.5 text-[#A39B8F]"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <PInput
        value={o.name}
        onChange={(e) => onChange({ ...o, name: e.target.value })}
        placeholder="Nombre"
        aria-label={`Nombre de la opción ${index + 1}`}
        className="h-[38px] min-w-0 flex-1 rounded-lg px-2.5"
      />
      <div className="flex h-[38px] w-24 items-center gap-[3px] rounded-lg border border-p-input px-2 focus-within:border-p-ink">
        <span className="text-p-muted">+$</span>
        <input
          value={o.price}
          inputMode="decimal"
          aria-label={`Precio adicional de la opción ${index + 1}`}
          onChange={(e) => onChange({ ...o, price: e.target.value })}
          className="w-full min-w-0 border-0 outline-none"
        />
      </div>
      <IconBtn aria-label="Subir" disabled={index === 0} onClick={onUp} className="h-[38px]">
        <ArrowUp size={14} />
      </IconBtn>
      <IconBtn aria-label="Quitar opción" danger onClick={onRemove} className="h-[38px]">
        <X size={14} />
      </IconBtn>
    </div>
  );
}

function toDraft(g: ModifierGroup): GroupDraft {
  return { ...structuredClone(g), max: g.max ? String(g.max) : "", options: g.options.map((o) => ({ ...o, price: String(o.price) })) };
}

export function ModifiersPage() {
  const { business, update, confirm, toast } = useAdmin();
  const [drawer, setDrawer] = useState<{ draft: GroupDraft; isNew: boolean } | null>(null);
  const m = (n: number) => money(n, business.settings.currency);
  const usedIn = (id: string) => business.products.filter((p) => p.modifierGroupIds.includes(id)).length;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setDr = <K extends keyof GroupDraft>(k: K, v: GroupDraft[K]) => setDrawer((d) => (d ? { ...d, draft: { ...d.draft, [k]: v } } : d));
  const setOptions = (fn: (o: OptionDraft[]) => OptionDraft[]) => setDrawer((d) => (d ? { ...d, draft: { ...d.draft, options: fn(d.draft.options) } } : d));

  const save = () => {
    if (!drawer) return;
    const dr = drawer.draft;
    if (!dr.name.trim()) return toast("Escribe un nombre");
    const options = dr.options
      .filter((o) => o.name.trim())
      .map((o) => ({ ...o, name: o.name.trim(), price: Math.max(0, Number(o.price.replace(",", ".")) || 0) }));
    if (!options.length) return toast("Agrega al menos una opción");
    const max = dr.type === "multiple" && Number(dr.max) > 0 ? Math.floor(Number(dr.max)) : undefined;
    const group: ModifierGroup = { ...dr, name: dr.name.trim(), options, max };
    if (!max) delete group.max;
    update((d) => {
      if (drawer.isNew) d.modifierGroups.push(group);
      else d.modifierGroups = d.modifierGroups.map((x) => (x.id === group.id ? group : x));
    }, drawer.isNew ? "Grupo creado" : "Grupo guardado");
    setDrawer(null);
  };

  const remove = async () => {
    if (!drawer) return;
    const dr = drawer.draft;
    const ok = await confirm({ title: `¿Eliminar “${dr.name}”?`, text: "Se quitará de todos los productos que lo usan." });
    if (!ok) return;
    update((d) => {
      d.modifierGroups = d.modifierGroups.filter((x) => x.id !== dr.id);
      d.products.forEach((p) => {
        p.modifierGroupIds = p.modifierGroupIds.filter((g) => g !== dr.id);
      });
    }, "Grupo eliminado");
    setDrawer(null);
  };

  const onOptionsDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOptions((opts) => arrayMove(opts, opts.findIndex((o) => o.id === active.id), opts.findIndex((o) => o.id === over.id)));
  };

  return (
    <>
      <PageHeader
        title="Grupos de opciones"
        sub="Crea un grupo una vez y úsalo en todos los productos que lo necesiten."
        actions={
          <PButton
            variant="primary"
            onClick={() =>
              setDrawer({
                isNew: true,
                draft: { id: newId("mg"), name: "", description: "", kind: "option", type: "single", required: false, max: "", options: [{ id: newId("o"), name: "", price: "0" }] },
              })
            }
          >
            Nuevo grupo
          </PButton>
        }
      />

      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3.5">
        {business.modifierGroups.map((g) => {
          const used = usedIn(g.id);
          const k = GROUP_KIND[g.kind];
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setDrawer({ isNew: false, draft: toDraft(g) })}
              className="flex flex-col gap-2.5 rounded-[14px] border border-p-card bg-white p-[18px] text-left transition-[border-color,box-shadow] duration-150 hover:border-p-ink hover:shadow-[0_6px_20px_rgba(0,0,0,.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-bold">{g.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-p-muted">
                    Usado en {used} {used === 1 ? "producto" : "productos"}
                  </div>
                </div>
                <StatusPill bg={k.bg} fg={k.fg}>
                  {k.label}
                </StatusPill>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md bg-p-chip px-2 py-[3px] text-xs font-semibold">
                  {g.type === "single" ? "Selección única" : `Selección múltiple${g.max ? ` · máx. ${g.max}` : ""}`}
                </span>
                <span className={cn("rounded-md px-2 py-[3px] text-xs font-semibold", g.required ? "bg-p-ink text-white" : "bg-p-chip")}>
                  {g.required ? "Obligatorio" : "Opcional"}
                </span>
              </div>
              <div className="w-full border-t border-p-sep pt-2">
                {g.options.map((o) => (
                  <div key={o.id} className="flex justify-between py-1 text-[13.5px]">
                    <span>
                      {o.name}
                      {o.isDefault ? " · por defecto" : ""}
                    </span>
                    <span className="tabular text-p-muted">+{m(o.price)}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <PanelDrawer
        open={!!drawer}
        title={drawer?.isNew ? "Nuevo grupo" : "Editar grupo"}
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
              <PLabel htmlFor="mg-name">Nombre del grupo</PLabel>
              <PInput id="mg-name" value={drawer.draft.name} onChange={(e) => setDr("name", e.target.value)} placeholder="Ej. Tipo de leche" />
            </div>
            <div>
              <PLabel htmlFor="mg-desc">Descripción</PLabel>
              <PInput
                id="mg-desc"
                value={drawer.draft.description}
                onChange={(e) => setDr("description", e.target.value)}
                placeholder="Opcional, visible para el cliente"
              />
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Clase</div>
              <div className="flex gap-1.5">
                {(Object.keys(GROUP_KIND) as ModifierGroup["kind"][]).map((k) => (
                  <Seg key={k} active={drawer.draft.kind === k} onClick={() => setDr("kind", k)}>
                    {GROUP_KIND[k].label}
                  </Seg>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Tipo de selección</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Seg active={drawer.draft.type === "single"} onClick={() => setDr("type", "single")}>
                  Selección única
                </Seg>
                <Seg active={drawer.draft.type === "multiple"} onClick={() => setDr("type", "multiple")}>
                  Selección múltiple
                </Seg>
                {drawer.draft.type === "multiple" ? (
                  <label className="ml-2 flex items-center gap-2 text-[13px] font-semibold">
                    Máximo
                    <PInput
                      value={drawer.draft.max}
                      inputMode="numeric"
                      placeholder="—"
                      onChange={(e) => setDr("max", e.target.value.replace(/\D/g, ""))}
                      className="h-[34px] w-16 rounded-lg text-center"
                    />
                  </label>
                ) : null}
              </div>
            </div>
            <SettingRow title="Obligatorio" desc="El cliente debe elegir antes de agregar.">
              <Toggle checked={drawer.draft.required} onChange={(v) => setDr("required", v)} label="Obligatorio" />
            </SettingRow>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold">Opciones</span>
                <span className="text-xs text-p-muted">Precio adicional</span>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onOptionsDragEnd}>
                <SortableContext items={drawer.draft.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-1.5">
                    {drawer.draft.options.map((o, i) => (
                      <OptionRow
                        key={o.id}
                        o={o}
                        index={i}
                        onChange={(next) => setOptions((opts) => opts.map((x) => (x.id === o.id ? next : x)))}
                        onUp={() => setOptions((opts) => arrayMove(opts, i, i - 1))}
                        onRemove={() => setOptions((opts) => opts.filter((x) => x.id !== o.id))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <button
                type="button"
                onClick={() => setOptions((opts) => [...opts, { id: newId("o"), name: "", price: "0" }])}
                className="mt-2 h-9 w-full rounded-lg border-[1.5px] border-dashed border-p-input bg-transparent font-semibold text-p-muted"
              >
                + Agregar opción
              </button>
              <Help>Arrastra ⋮⋮ o usa ↑ para cambiar el orden en el que el cliente ve las opciones.</Help>
            </div>
          </>
        ) : null}
      </PanelDrawer>
    </>
  );
}
