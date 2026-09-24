import { z } from "zod";
import type { OrderMode } from "@/types";

export interface CheckoutForm {
  name: string;
  phone: string;
  table: string;
  guests: number;
  pickupChoice: "asap" | "30" | "60" | "custom";
  pickupTime: string;
  notes: string;
}

export type CheckoutErrors = Partial<Record<"name" | "phone" | "table", string>>;

const name = z.string().trim().min(2, "Escribe tu nombre.");

const dineInSchema = z.object({
  name,
  table: z.string().trim().min(1, "Indica tu mesa."),
  guests: z.number().int().min(1).max(20),
});

const pickupSchema = z.object({
  name,
  phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Escribe un teléfono de 10 dígitos."),
});

/** Valida el paso "Datos" según la modalidad. Devuelve errores por campo (vacío = válido). */
export function validateCheckout(mode: OrderMode, form: CheckoutForm): CheckoutErrors {
  const res = (mode === "dinein" ? dineInSchema : pickupSchema).safeParse(form);
  if (res.success) return {};
  const errors: CheckoutErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0];
    if ((key === "name" || key === "phone" || key === "table") && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
