"use client";

import { useRouter } from "next/navigation";
import type { Business, Product } from "@/types";
import { useAdmin } from "./AdminProvider";

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const PRESET_TAGS = ["Caliente", "Frío", "Vegano", "Vegetariano", "Sin gluten", "Sin cafeína", "Dulce", "Picante", "Con leche"];

export const categoryName = (b: Business, id: string) => b.categories.find((c) => c.id === id)?.name ?? "Sin categoría";

/** Duplicar / archivar-restaurar / eliminar (con confirmación) — usadas en la tabla y en el editor. */
export function useProductActions() {
  const { update, confirm } = useAdmin();
  const router = useRouter();

  const duplicate = (p: Product): Product => {
    const copy: Product = {
      ...structuredClone(p),
      id: newId("pr"),
      name: `${p.name} (copia)`,
      status: "draft",
      sku: p.sku ? `${p.sku}-C` : "",
      sold: 0,
      featured: false,
    };
    update((d) => {
      const i = d.products.findIndex((x) => x.id === p.id);
      d.products.splice(i + 1, 0, copy);
    }, "Producto duplicado como borrador");
    return copy;
  };

  const toggleArchive = (p: Product) => {
    const restoring = p.status === "archived";
    update(
      (d) => {
        const x = d.products.find((y) => y.id === p.id);
        if (x) x.status = restoring ? "draft" : "archived";
      },
      restoring ? "Producto restaurado" : "Producto archivado",
    );
  };

  const remove = async (p: Product, after?: () => void) => {
    const ok = await confirm({
      title: `¿Eliminar “${p.name}”?`,
      text: "Esta acción no se puede deshacer. Si solo quieres quitarlo del menú, archívalo.",
      label: "Eliminar",
    });
    if (!ok) return;
    update((d) => {
      d.products = d.products.filter((x) => x.id !== p.id);
      d.promotions = d.promotions.filter((x) => x.productId !== p.id);
    }, "Producto eliminado");
    after?.();
  };

  return { duplicate, toggleArchive, remove, openEditor: (id: string) => router.push(`/admin/products/${id}`) };
}
