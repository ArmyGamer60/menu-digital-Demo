import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { MenuApp } from "@/components/menu/MenuApp";
import { MenuUnavailable } from "@/components/menu/MenuUnavailable";
import { menuMetadata, menuViewport } from "@/components/menu/menuMetadata";
import { getBusinessRowByDomain } from "@/lib/repo";

/* Menú servido en el dominio propio del negocio (el middleware reescribe "/" → /sites/<host>). */

type Params = { host: string };

export const revalidate = 60;

const load = cache((host: string) => getBusinessRowByDomain(decodeURIComponent(host)));

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const row = await load((await params).host);
  return menuMetadata(row?.status === "active" ? row.business : null);
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  return menuViewport((await load((await params).host))?.business);
}

export default async function DomainMenuPage({ params }: { params: Promise<Params> }) {
  const row = await load((await params).host);
  if (!row) return <MenuUnavailable kind="missing" />;
  if (row.status !== "active") return <MenuUnavailable kind="suspended" theme={row.business.theme} />;
  return <MenuApp initialBusiness={row.business} />;
}
