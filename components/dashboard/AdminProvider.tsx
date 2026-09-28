"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { listOrdersAction, resetDemoAction, saveBusinessAction, updateOrderAction } from "@/app/admin/(panel)/data";
import { ConfirmDialog } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import { pad } from "@/lib/money";
import type { Business, Order } from "@/types";

interface ConfirmOptions {
  title: string;
  text?: string;
  label?: string;
}

export interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  status: "active" | "suspended";
}

interface AdminContextValue {
  user: SessionUser;
  business: Business;
  orders: Order[];
  /** Negocios a los que tiene acceso la sesión (selector de la sidebar). */
  businesses: BusinessOption[];
  suspended: boolean;
  customDomain: string | null;
  isDemo: boolean;
  /** Aplica cambios sobre una copia, la guarda en el servidor y muestra toast.
      Sin `msg` (autoguardado de campos) guarda con debounce y muestra "Cambios guardados". */
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
/** Espera tras el último cambio antes de guardar (escritura en campos). */
const SAVE_DEBOUNCE_MS = 700;
const ORDERS_POLL_MS = 15_000;

interface AdminProviderProps {
  user: SessionUser;
  initialBusiness: Business;
  initialOrders: Order[];
  businesses: BusinessOption[];
  suspended: boolean;
  customDomain: string | null;
  isDemo: boolean;
  children: ReactNode;
}

export function AdminProvider({ user, initialBusiness, initialOrders, businesses, suspended, customDomain, isDemo, children }: AdminProviderProps) {
  const businessId = initialBusiness.id;
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const bizRef = useRef<Business>(initialBusiness);

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

  // ───── Guardado: cola con debounce; una petición a la vez y siempre con la última versión ─────
  const queue = useRef<{ pending: Business | null; msgs: string[]; inflight: boolean; timer?: ReturnType<typeof setTimeout> }>({
    pending: null,
    msgs: [],
    inflight: false,
  });

  const flush = useCallback(async () => {
    const q = queue.current;
    clearTimeout(q.timer);
    if (q.inflight || !q.pending) return;
    const next = q.pending;
    const msgs = q.msgs;
    q.pending = null;
    q.msgs = [];
    q.inflight = true;
    try {
      const r = await saveBusinessAction(next);
      if (!r.ok) toast(r.error || "No se pudo guardar");
      else {
        if (r.slug !== next.slug) {
          // El servidor conservó el slug anterior (estaba ocupado).
          bizRef.current = { ...bizRef.current, slug: r.slug };
          setBusiness(bizRef.current);
        }
        if (r.error) toast(r.error);
        else if (msgs.length) msgs.forEach(toast);
        else savedToast();
      }
    } catch {
      toast("Sin conexión: no se pudo guardar");
    } finally {
      q.inflight = false;
      if (q.pending) void flush();
    }
  }, [toast, savedToast]);

  // Aviso al cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      const q = queue.current;
      if (q.pending || q.inflight) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const update = useCallback(
    (fn: (draft: Business) => void, msg?: string) => {
      const next = structuredClone(bizRef.current);
      fn(next);
      bizRef.current = next;
      setBusiness(next);
      const q = queue.current;
      q.pending = next;
      if (msg) {
        q.msgs.push(msg);
        void flush();
      } else {
        clearTimeout(q.timer);
        q.timer = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
      }
    },
    [flush],
  );

  // ───── Pedidos: sondeo mientras la pestaña está visible ─────
  const seen = useRef(new Set(initialOrders.map((o) => o.id)));
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const list = await listOrdersAction(businessId);
        if (!alive) return;
        const fresh = list.filter((o) => !seen.current.has(o.id));
        list.forEach((o) => seen.current.add(o.id));
        setOrders(list);
        if (fresh.length === 1) toast(`Nuevo pedido #${pad(fresh[0]!.number)}`);
        else if (fresh.length > 1) toast(`${fresh.length} pedidos nuevos`);
      } catch {
        /* se reintenta en el siguiente ciclo */
      }
    };
    const id = setInterval(poll, ORDERS_POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [businessId, toast]);

  const updateOrder = useCallback(
    async (orderId: string, patch: Partial<Order>, msg?: string) => {
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
      const ok = await updateOrderAction(businessId, orderId, patch).catch(() => false);
      if (!ok) toast("No se pudo actualizar el pedido");
      else if (msg) toast(msg);
    },
    [toast, businessId],
  );

  const reset = useCallback(async () => {
    const r = await resetDemoAction(businessId).catch(() => null);
    if (!r) return toast("No se pudo restablecer");
    queue.current.pending = null;
    bizRef.current = r.business;
    setBusiness(r.business);
    setOrders(r.orders);
    r.orders.forEach((o) => seen.current.add(o.id));
    toast("Datos demo restablecidos");
  }, [toast, businessId]);

  const value = useMemo<AdminContextValue>(
    () => ({ user, business, orders, businesses, suspended, customDomain, isDemo, update, updateOrder, reset, toast, confirm }),
    [user, business, orders, businesses, suspended, customDomain, isDemo, update, updateOrder, reset, toast, confirm],
  );

  return (
    <>
      <AdminContext.Provider value={value}>{children}</AdminContext.Provider>

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
