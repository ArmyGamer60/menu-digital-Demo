"use client";

import { X } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ModifierGroup, OrderStatus, ProductStatus } from "@/types";

/* ───────── Paletas de estado (README → Design Tokens · Panel) ───────── */

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; bg: string; fg: string; desc: string }> = {
  published: { label: "Publicado", bg: "#E3F1E7", fg: "#1F6B3F", desc: "Visible en el menú." },
  draft: { label: "Borrador", bg: "#EEE9E1", fg: "#5C554B", desc: "Solo visible en el panel." },
  soldout: { label: "Agotado", bg: "#FBEBD7", fg: "#8A4B0B", desc: "Visible, sin poder pedirse." },
  hidden: { label: "Oculto", bg: "#E6E9EE", fg: "#3F4A5A", desc: "No aparece en el menú." },
  archived: { label: "Archivado", bg: "#F1ECEC", fg: "#7A4F4F", desc: "Fuera de catálogo." },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pendiente", bg: "#FBEBD7", fg: "#8A4B0B" },
  preparing: { label: "Preparando", bg: "#E4ECF7", fg: "#1F4E79" },
  ready: { label: "Listo", bg: "#E3F1E7", fg: "#1F6B3F" },
  completed: { label: "Completado", bg: "#EEE9E1", fg: "#5C554B" },
  cancelled: { label: "Cancelado", bg: "#F6E1DF", fg: "#8C1D18" },
};

export const GROUP_KIND: Record<ModifierGroup["kind"], { label: string; bg: string; fg: string }> = {
  variant: { label: "Variante", bg: "#F4E6DE", fg: "#8A3B19" },
  option: { label: "Opción", bg: "#E4ECF7", fg: "#1F4E79" },
  extra: { label: "Extra", bg: "#E3F1E7", fg: "#1F6B3F" },
};

/* ───────── Primitivas ───────── */

export function StatusPill({ bg, fg, children, className }: { bg: string; fg: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-[22px] items-center rounded-[11px] px-[9px] text-xs font-bold whitespace-nowrap", className)}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

export function Card({ children, className, pad = 22 }: { children: ReactNode; className?: string; pad?: 18 | 20 | 22 | 0 }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-p-card bg-white",
        pad === 22 && "p-[22px]",
        pad === 20 && "p-5",
        pad === 18 && "p-[18px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[15px] font-bold", className)}>{children}</div>;
}

export function PageHeader({
  title,
  sub,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[13px] text-p-muted">{eyebrow}</div> : null}
        <h1 className="m-0 font-pdisplay text-[34px] leading-[1.15] font-normal tracking-[-.015em]">{title}</h1>
        {sub ? <div className="mt-1 text-p-muted">{sub}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

type BtnVariant = "primary" | "secondary" | "tertiary" | "danger" | "ghost";
const BTN: Record<BtnVariant, string> = {
  primary: "border-0 bg-p-ink text-white hover:bg-p-ink-hover",
  secondary: "border border-p-ink bg-white text-p-ink",
  tertiary: "border border-p-input bg-white text-p-ink",
  danger: "border border-p-danger-line bg-p-danger-bg text-danger",
  ghost: "border-0 bg-transparent text-p-muted",
};

export const PButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }
>(function PButton({ variant = "tertiary", size = "lg", className, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        BTN[variant],
        size === "sm" && "h-8 rounded-lg px-3 text-[13px]",
        size === "md" && "h-[38px] rounded-[9px] px-3.5",
        size === "lg" && "h-10 rounded-[9px] px-4",
        className,
      )}
      {...props}
    />
  );
});

/** Botón cuadrado 30–32px (↑, ×, ⋯). */
export function IconBtn({
  className,
  danger,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string; danger?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-8 flex-none items-center justify-center rounded-lg border border-p-card bg-white disabled:opacity-40",
        danger && "text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function PLabel({ children, hint, className, ...props }: LabelHTMLAttributes<HTMLLabelElement> & { hint?: ReactNode }) {
  return (
    <label className={cn("mb-1.5 block text-[13px] font-semibold", className)} {...props}>
      {children}
      {hint ? <span className="font-medium text-p-muted"> {hint}</span> : null}
    </label>
  );
}

const inputBase = "w-full border bg-white text-p-ink outline-none transition-colors placeholder:text-[#A39B8F] focus:border-p-ink";

export const PInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; mono?: boolean }>(
  function PInput({ className, invalid, mono, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          inputBase,
          "h-10 rounded-[9px] px-3",
          invalid ? "border-danger" : "border-p-input",
          mono && "font-mono text-[13px]",
          className,
        )}
        {...props}
      />
    );
  },
);

export const PTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function PTextarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(inputBase, "resize-y rounded-[9px] border-p-input px-3 py-2.5", className)} {...props} />;
});

/** Input con prefijo ($, +$). */
export function PrefixInput({
  prefix,
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { prefix: string; invalid?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-[9px] border bg-white px-3 focus-within:border-p-ink",
        invalid ? "border-danger" : "border-p-input",
        className,
      )}
    >
      <span className="text-p-muted">{prefix}</span>
      <input className="w-full min-w-0 flex-1 border-0 bg-transparent outline-none" {...props} />
    </div>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="mt-[5px] text-[12.5px] font-semibold text-danger">
      {children}
    </div>
  );
}

export function Help({ children }: { children: ReactNode }) {
  return <div className="mt-[5px] text-xs text-p-muted">{children}</div>;
}

/** Botón segmentado (filtros, clase, tipo…). */
export function Seg({
  active,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "h-[34px] rounded-lg border px-3 text-[13px] font-semibold whitespace-nowrap",
        active ? "border-p-ink bg-p-ink text-white" : "border-p-input bg-white text-p-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Miniatura por background-image (URLs arbitrarias o data: sin pasar por next/image). */
export function Thumb({ src, className, style, children }: { src?: string; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn("flex-none bg-[#EEE9E1] bg-cover bg-center", className)}
      style={{ backgroundImage: src ? `url("${src}")` : undefined, ...style }}
    >
      {children}
    </div>
  );
}

/** Fila título + descripción + control (toggles de ajustes). */
export function SettingRow({ title, desc, children, className }: { title: ReactNode; desc?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <div className="font-semibold">{title}</div>
        {desc ? <div className="text-xs text-p-muted">{desc}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** Drawer derecho del panel (520px) con cabecera y pie opcional. */
export function PanelDrawer({
  open,
  title,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      label={title}
      placement="drawer"
      tone="panel"
      z={60}
      backdrop="rgba(20,18,15,.35)"
      className="h-full w-[min(520px,100vw)] font-pbody text-sm shadow-[-20px_0_60px_rgba(0,0,0,.15)]"
    >
      <div className="flex items-center justify-between border-b border-p-card px-[22px] py-[18px]">
        <h2 className="m-0 font-pdisplay text-2xl font-normal">{title}</h2>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-[9px] border border-p-card bg-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid flex-1 content-start gap-4 overflow-y-auto px-[22px] py-5">{children}</div>
      {footer ? <div className="flex justify-between gap-2 border-t border-p-card px-[22px] py-3.5">{footer}</div> : null}
    </Dialog>
  );
}
