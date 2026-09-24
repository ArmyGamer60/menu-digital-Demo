import type { CSSProperties } from "react";
import type { Theme } from "@/types";

/** Luminancia percibida 0–1: (.299r + .587g + .114b) / 255. */
export function luminance(hex: string): number {
  const h = (hex || "#000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Variables CSS de next/font por par tipográfico (ver app/fonts.ts). */
const FONT_VARS: Record<Theme["fontPair"], { display: string; body: string }> = {
  editorial: { display: "var(--font-gloock)", body: "var(--font-hanken)" },
  moderna: { display: "var(--font-bricolage)", body: "var(--font-hanken)" },
  clasica: { display: "var(--font-cormorant)", body: "var(--font-karla)" },
  urbana: { display: "var(--font-archivo-black)", body: "var(--font-archivo)" },
  suave: { display: "var(--font-young-serif)", body: "var(--font-figtree)" },
};

/** Familias CSS de un par tipográfico (vista previa en el panel). */
export function fontPairFamilies(pair: Theme["fontPair"]): { display: string; body: string } {
  const f = FONT_VARS[pair] ?? FONT_VARS.editorial;
  return { display: `${f.display}, Georgia, serif`, body: `${f.body}, system-ui, sans-serif` };
}

/** Theme del negocio → CSS custom properties para el contenedor raíz del menú. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const dark = luminance(theme.background) < 0.45;
  const fonts = FONT_VARS[theme.fontPair] ?? FONT_VARS.editorial;
  return {
    "--bg": theme.background,
    "--ink": theme.text,
    "--brand": theme.primary,
    "--brand2": theme.secondary,
    "--accent": theme.accent,
    "--on-brand": luminance(theme.primary) > 0.6 ? "#1a1a1a" : "#ffffff",
    "--surface": dark
      ? `color-mix(in oklab, ${theme.background}, white 7%)`
      : `color-mix(in oklab, ${theme.background}, white 65%)`,
    "--muted": `color-mix(in oklab, ${theme.text} 66%, ${theme.background})`,
    "--line": `color-mix(in oklab, ${theme.text} 11%, transparent)`,
    "--line-strong": `color-mix(in oklab, ${theme.text} 22%, transparent)`,
    "--img-bg": `color-mix(in oklab, ${theme.primary} 14%, ${theme.background})`,
    "--hover-bg": `color-mix(in oklab, ${theme.text} 4%, transparent)`,
    "--fd": `${fonts.display}, Georgia, serif`,
    "--fb": `${fonts.body}, system-ui, sans-serif`,
  };
}

export const asStyle = (vars: Record<string, string>) => vars as CSSProperties;
