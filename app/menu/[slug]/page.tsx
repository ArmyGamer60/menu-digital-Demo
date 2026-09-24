import type { Metadata, Viewport } from "next";
import { MenuApp } from "@/components/menu/MenuApp";
import { MenuLoader } from "@/components/menu/MenuLoader";
import { getBusinessBySlug, listBusinessSlugs } from "@/lib/repo";

type Params = { slug: string };

// ISR: fase 2 revalida con revalidatePath('/menu/' + slug) al guardar en el panel.
export const revalidate = 300;

export async function generateStaticParams(): Promise<Params[]> {
  return (await listBusinessSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "Menú no encontrado" };
  return {
    title: `${business.name} — Menú digital`,
    description: business.description,
    openGraph: {
      title: `${business.name} — ${business.tagline}`,
      description: business.description,
      images: business.theme.heroImage ? [business.theme.heroImage] : undefined,
    },
    icons: business.favicon ? [{ url: business.favicon }] : undefined,
  };
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  return { themeColor: business?.theme.background };
}

export default async function MenuPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  // Sin coincidencia en el servidor: puede ser un slug renombrado en el panel (fase 1, localStorage).
  if (!business) return <MenuLoader slug={slug} />;
  return <MenuApp initialBusiness={business} />;
}
