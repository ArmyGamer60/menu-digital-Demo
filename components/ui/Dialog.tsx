"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Base de Sheet / Modal / Drawer: backdrop que cierra, Escape, bloqueo de scroll y foco.
   Se renderiza en su sitio (sin portal) para heredar las CSS vars del Theme del contenedor. */

export type Placement = "sheet" | "modal" | "drawer" | "sheet-modal" | "sheet-drawer";

let locks = 0;
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    if (locks++ === 0) {
      html.style.overflow = "hidden";
    }
    return () => {
      if (--locks === 0) html.style.overflow = "";
    };
  }, [active]);
}

const WRAP: Record<Placement, string> = {
  sheet: "items-end",
  modal: "items-center justify-center p-6",
  drawer: "justify-end",
  "sheet-modal": "items-end tab:items-center tab:justify-center tab:p-6",
  "sheet-drawer": "items-end tab:items-stretch tab:justify-end",
};

const SHEET = "w-full rounded-t-[24px] animate-sheet-up";
const MODAL = "rounded-[var(--modal-r,22px)] shadow-[0_30px_80px_rgba(0,0,0,.35)] animate-modal-in";
const DRAWER = "animate-drawer-in";

const PANEL: Record<Placement, string> = {
  sheet: SHEET,
  modal: MODAL,
  drawer: DRAWER,
  "sheet-modal": cn(SHEET, "tab:rounded-[var(--modal-r,22px)] tab:shadow-[0_30px_80px_rgba(0,0,0,.35)] tab:animate-modal-in"),
  "sheet-drawer": cn(SHEET, "tab:rounded-none tab:animate-drawer-in tab:shadow-[-10px_0_40px_rgba(0,0,0,.18)]"),
};
/* El tamaño (w/h/max-h por breakpoint) lo define siempre el llamador vía `className`
   para no competir con utilidades del mismo variant. */

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Nombre accesible del diálogo. */
  label: string;
  placement: Placement;
  children: ReactNode;
  className?: string;
  /** z-index del conjunto (backdrop + panel). */
  z?: number;
  /** Color del backdrop (menú: rgba(15,12,10,.45–.5); panel: rgba(20,18,15,.35)). */
  backdrop?: string;
  /** "theme": colores del Theme del negocio (menú). "panel": paleta fija del panel. */
  tone?: "theme" | "panel";
  /** Clases del contenedor fijo (p. ej. "desk:hidden"). */
  wrapperClassName?: string;
}

export function Dialog({ open, onClose, label, placement, children, className, z = 60, backdrop = "rgba(15,12,10,.5)", tone = "theme", wrapperClassName }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useScrollLock(open);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={cn("fixed inset-0 flex", WRAP[placement], wrapperClassName)} style={{ zIndex: z }}>
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in"
        style={{ background: backdrop }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("relative flex flex-col overflow-hidden outline-none", tone === "panel" ? "bg-white text-p-ink" : "bg-bg text-ink", PANEL[placement], className)}
      >
        {children}
      </div>
    </div>
  );
}

type PresetProps = Omit<DialogProps, "placement"> & { responsive?: boolean };

/** Bottom sheet (móvil). Con `responsive`, pasa a modal centrado desde tablet. */
export function Sheet({ responsive, ...props }: PresetProps) {
  return <Dialog placement={responsive ? "sheet-modal" : "sheet"} {...props} />;
}

/** Modal centrado. */
export function Modal(props: Omit<DialogProps, "placement">) {
  return <Dialog placement="modal" {...props} />;
}

/** Drawer derecho. Con `responsive`, es bottom sheet en móvil. */
export function Drawer({ responsive, ...props }: PresetProps) {
  return <Dialog placement={responsive ? "sheet-drawer" : "drawer"} {...props} />;
}
