import type { Metadata, Viewport } from "next";
import { permanentRedirect } from "next/navigation";
import { cache } from "react";
import { MenuApp } from "@/components/menu/MenuApp";
import { MenuUnavailable } from "@/components/menu/MenuUnavailable";
import { menuMetadata, menuViewport } from "@/components/menu/menuMetadata";
import { getBusinessRowBySlug, resolveSlugRedirect } from "@/lib/repo";

type Params = { slug: string };

// ISR: se regenera al guardar en el panel (revalidatePath) y, como red de seguridad, cada 60 s.
export const revalidate = 60;

const load = cache((slug: string) => getBusinessRowBySlug(decodeURIComponent(slug)));

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const row = await load((await params).slug);
  return menuMetadata(row?.status === "active" ? row.business : null);
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  return menuViewport((await load((await params).slug))?.business);
}

export default async function MenuPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const row = await load(slug);
  if (!row) {
    // Slug renombrado desde el panel: los QR impresos con el slug anterior siguen funcionando.
    const current = await resolveSlugRedirect(decodeURIComponent(slug));
    if (current) permanentRedirect(`/menu/${current}`);
    return <MenuUnavailable kind="missing" />;
  }
  if (row.status !== "active") return <MenuUnavailable kind="suspended" theme={row.business.theme} />;
  return <MenuApp initialBusiness={row.business} />;
}
