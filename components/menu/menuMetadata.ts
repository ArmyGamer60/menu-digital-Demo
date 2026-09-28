import type { Metadata, Viewport } from "next";
import type { Business } from "@/types";

export function menuMetadata(business: Business | null | undefined): Metadata {
  if (!business) return { title: "Menú no encontrado" };
  return {
    title: `${business.name} — Menú digital`,
    description: business.description,
    openGraph: {
      title: business.tagline ? `${business.name} — ${business.tagline}` : business.name,
      description: business.description,
      images: business.theme.heroImage ? [business.theme.heroImage] : undefined,
    },
    icons: business.favicon ? [{ url: business.favicon }] : undefined,
  };
}

export const menuViewport = (business: Business | null | undefined): Viewport => ({ themeColor: business?.theme.background });
