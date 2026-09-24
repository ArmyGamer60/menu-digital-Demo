"use client";

import { MapPin, X } from "lucide-react";
import { IconButton, Sheet } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BusinessStatus } from "@/lib/hours";
import type { Business, DayOfWeek } from "@/types";
import { StatusDot } from "./StatusDot";

export function BusinessInfoSheet({
  business,
  status,
  today,
  open,
  onClose,
}: {
  business: Business;
  status: BusinessStatus | null;
  /** Día actual en la zona horaria del negocio (se resalta en negrita). */
  today: DayOfWeek | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      responsive
      open={open}
      onClose={onClose}
      label={`Información de ${business.name}`}
      z={70}
      className="max-h-[85%] tab:max-h-full tab:w-[min(480px,100%)]"
    >
      <div className="overflow-y-auto overscroll-contain px-[22px] py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 font-display text-[30px] leading-none font-normal">{business.name}</h2>
            <p className="mt-1.5 mb-0 text-sm leading-[1.45] text-muted">{business.description}</p>
          </div>
          <IconButton aria-label="Cerrar" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </IconButton>
        </div>

        <div className="mt-[18px] flex items-center gap-2 font-bold">
          <StatusDot status={status} />
        </div>

        <dl className="m-0 mt-[18px] border-t border-line">
          {business.hours.map((h) => (
            <div
              key={h.day}
              className={cn(
                "flex justify-between gap-3 border-b border-line py-2.5 text-[14.5px]",
                h.day === today ? "font-bold" : "font-normal",
                h.active ? "text-ink" : "text-muted",
              )}
            >
              <dt>{h.label}</dt>
              <dd className="m-0 text-right">{h.active ? h.ranges.map((r) => `${r[0]}–${r[1]}`).join(" · ") : "Cerrado"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 grid gap-2.5 text-[14.5px]">
          <div className="flex gap-2.5">
            <MapPin size={18} strokeWidth={1.8} className="flex-none" aria-hidden />
            <span>{business.address}</span>
          </div>
          <div className="flex flex-wrap gap-x-[18px] gap-y-2 pl-7 font-semibold">
            {business.maps ? (
              <a href={business.maps} target="_blank" rel="noopener noreferrer">
                Cómo llegar
              </a>
            ) : null}
            {business.instagram ? (
              <a href={`https://instagram.com/${business.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="no-underline">
                {business.instagram}
              </a>
            ) : null}
            {business.phone ? (
              <a href={`tel:${business.phone.replace(/\s/g, "")}`} className="no-underline">
                {business.phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
