"use client";

import { useEffect, type ReactNode } from "react";
import { useScrollLock } from "./Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación destructiva: centrada, 420px, animación pop, botón rojo. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div aria-hidden onClick={onCancel} className="absolute inset-0 animate-[fadeIn_.15s] bg-[rgba(20,18,15,.45)]" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[420px] animate-pop rounded-2xl bg-white p-6 font-pbody text-sm text-p-ink shadow-[0_30px_80px_rgba(0,0,0,.25)]"
      >
        <div className="font-pdisplay text-2xl leading-[1.1]">{title}</div>
        {children ? <p className="mt-2.5 mb-[22px] leading-normal text-p-muted">{children}</p> : <div className="h-[22px]" />}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-10 rounded-[9px] border border-p-input bg-white px-3.5 font-semibold">
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="h-10 rounded-[9px] border-0 bg-danger px-4 font-semibold text-white hover:bg-[#9A1F18]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
