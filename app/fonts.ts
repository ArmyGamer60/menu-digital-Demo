import localFont from "next/font/local";

/* Fuentes autoalojadas desde @fontsource (subset latin): el build no depende de la red.
   next/font/google falló en Vercel al descargar de Google Fonts ("Cannot read properties of null").
   next/font exige literales, por eso las rutas van escritas una a una.
   Par por defecto (Gloock + Hanken Grotesk) precargado; el resto sin preload (solo se descarga si el Theme lo usa). */

export const gloock = localFont({
  src: [
    { path: "../node_modules/@fontsource/gloock/files/gloock-latin-400-normal.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-gloock",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const hanken = localFont({
  src: [
    { path: "../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hanken",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const jetbrains = localFont({
  src: [
    { path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const bricolage = localFont({
  src: [
    { path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const cormorant = localFont({
  src: [
    { path: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export const karla = localFont({
  src: [
    { path: "../node_modules/@fontsource/karla/files/karla-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/karla/files/karla-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/karla/files/karla-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-karla",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const archivoBlack = localFont({
  src: [
    { path: "../node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-archivo-black",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const archivo = localFont({
  src: [
    { path: "../node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/archivo/files/archivo-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const youngSerif = localFont({
  src: [
    { path: "../node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-young-serif",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
});

export const figtree = localFont({
  src: [
    { path: "../node_modules/@fontsource/figtree/files/figtree-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/figtree/files/figtree-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/figtree/files/figtree-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-figtree",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const fontVariables = [gloock, hanken, jetbrains, bricolage, cormorant, karla, archivoBlack, archivo, youngSerif, figtree]
  .map((f) => f.variable)
  .join(" ");
