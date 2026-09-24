"use client";

import { useEffect, useState } from "react";

/** Hora actual tras montar (null en SSR para evitar desajustes de hidratación); se refresca cada 30 s. */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
