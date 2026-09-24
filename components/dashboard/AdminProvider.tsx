"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import {
  DEFAULT_BUSINESS_ID,
  getBusinessById,
  listOrders,
  resetDemo,
  saveBusiness,
  subscribeBusiness,
  subscribeOrders,
  updateOrder as repoUpdateOrder,
} from "@/lib/repo";
import type { Business, Order } from "@/types";

interface ConfirmOptions {
  title: string;
  text?: string;
  label?: string;
}

interface AdminContextValue {
  user: SessionUser;
  business: Business;
  orders: Order[];
  /** Aplica cambios sobre una copia, persiste en el repo y muestra toast.
      Sin `msg` (autoguardado de campos) muestra "Cambios guardados" con debounce. */
  update: (fn: (draft: Business) => void, msg?: string) => void;
  updateOrder: (orderId: string, patch: Partial<Order>, msg?: string) => Promise<void>;
  reset: () => Promise<void>;
  toast: (msg: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin fuera de <AdminProvider>");
  return ctx;
}

const TOAST_MS = 2600;
const AUTOSAVE_TOAST_MS = 900;

export function AdminProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState(false);
  const bizRef = useRef<Business | null>(null);

  // ───── Toasts ─────
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS);
  }, []);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedToast = useCallback(() => {
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => toast("Cambios guardados"), AUTOSAVE_TOAST_MS);
  }, [toast]);

  // ───── Confirmación ─────
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })), []);
  const closeConfirm = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  // ───── Datos ─────
  useEffect(() => {
    let alive = true;
    Promise.all([getBusinessById(DEFAULT_BUSINESS_ID), listOrders(DEFAULT_BUSINESS_ID)])
      .then(([b, o]) => {
        if (!alive) return;
        if (!b) return setError(true);
        bizRef.current = b;
        setBusiness(b);
        setOrders(o);
      })
      .catch(() => alive && setError(true));
    const unBiz = subscribeBusiness(DEFAULT_BUSINESS_ID, (b) => {
      bizRef.current = b;
      setBusiness(b);
    });
    const unOrders = subscribeOrders(DEFAULT_BUSINESS_ID, setOrders);
    return () => {
      alive = false;
      unBiz();
      unOrders();
    };
  }, []);

  const update = useCallback(
    (fn: (draft: Business) => void, msg?: string) => {
      const cur = bizRef.current;
      if (!cur) return;
      const next = structuredClone(cur);
      fn(next);
      bizRef.current = next;
      setBusiness(next);
      saveBusiness(next).then(
        () => (msg ? toast(msg) : savedToast()),
        () => toast("No se pudo guardar"),
      );
    },
    [toast, savedToast],
  );

  const updateOrder = useCallback(
    async (orderId: string, patch: Partial<Order>, msg?: string) => {
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
      await repoUpdateOrder(DEFAULT_BUSINESS_ID, orderId, patch);
      if (msg) toast(msg);
    },
    [toast],
  );

  const reset = useCallback(async () => {
    const r = await resetDemo(DEFAULT_BUSINESS_ID);
    if (r.business) {
      bizRef.current = r.business;
      setBusiness(r.business);
    }
    setOrders(r.orders);
    toast("Datos demo restablecidos");
  }, [toast]);

  const value = useMemo<AdminContextValue | null>(
    () => (business ? { user, business, orders, update, updateOrder, reset, toast, confirm } : null),
    [user, business, orders, update, updateOrder, reset, toast, confirm],
  );

  return (
    <>
      {value ? (
        <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
      ) : (
        <div className="grid h-dvh place-items-center bg-p-canvas text-p-muted">
          {error ? "No se pudo cargar el negocio." : <span className="sr-only">Cargando panel…</span>}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={pending?.title ?? ""}
        confirmLabel={pending?.label ?? "Eliminar"}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      >
        {pending?.text}
      </ConfirmDialog>

      <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[100] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex animate-[panelToast_.22s_ease-out] items-center gap-2.5 rounded-xl bg-p-ink px-4 py-3 font-pbody text-sm font-semibold text-p-canvas shadow-[0_12px_30px_rgba(0,0,0,.2)]"
          >
            <span className="size-2 rounded-full bg-[#6FCF97]" />
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
