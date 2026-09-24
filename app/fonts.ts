import {
  Archivo,
  Archivo_Black,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Figtree,
  Gloock,
  Hanken_Grotesk,
  JetBrains_Mono,
  Karla,
  Young_Serif,
} from "next/font/google";

/* Par por defecto (Editorial) + mono del panel: precargadas. */
export const gloock = Gloock({ weight: "400", subsets: ["latin"], variable: "--font-gloock", display: "swap" });
export const hanken = Hanken_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-hanken", display: "swap" });
export const jetbrains = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });

/* Pares alternativos (Moderna, Clásica, Urbana, Suave): sin preload, se descargan solo si el Theme los usa. */
export const bricolage = Bricolage_Grotesque({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-bricolage", display: "swap", preload: false });
export const cormorant = Cormorant_Garamond({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-cormorant", display: "swap", preload: false });
export const karla = Karla({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-karla", display: "swap", preload: false });
export const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo-black", display: "swap", preload: false });
export const archivo = Archivo({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-archivo", display: "swap", preload: false });
export const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-young-serif", display: "swap", preload: false });
export const figtree = Figtree({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-figtree", display: "swap", preload: false });

export const fontVariables = [gloock, hanken, jetbrains, bricolage, cormorant, karla, archivoBlack, archivo, youngSerif, figtree]
  .map((f) => f.variable)
  .join(" ");
