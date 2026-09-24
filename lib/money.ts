import type { Currency } from "@/types";

const CURRENCIES: Record<Currency, { symbol: string; locale: string }> = {
  MXN: { symbol: "$", locale: "es-MX" },
  USD: { symbol: "US$", locale: "en-US" },
  EUR: { symbol: "€", locale: "es-ES" },
  COP: { symbol: "$", locale: "es-CO" },
};

/** money(1234.5, "MXN") → "$1,234.50"; enteros sin decimales → "$95". */
export function money(n: number, currency: Currency = "MXN"): string {
  const c = CURRENCIES[currency] ?? CURRENCIES.MXN;
  const v = Math.round(n * 100) / 100;
  return (
    c.symbol +
    v.toLocaleString(c.locale, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
  );
}

/** Número de pedido a 3 dígitos: 25 → "025". */
export const pad = (n: number) => String(n).padStart(3, "0");
