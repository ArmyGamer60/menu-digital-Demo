"use client";

import {
  AlignLeft,
  Clock,
  LayoutDashboard,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Tag,
  User,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useNow } from "@/components/menu/hooks";
import { Credit } from "@/components/ui";
import { cn } from "@/lib/cn";
import { businessStatus, STATUS_COLORS } from "@/lib/hours";
import { useAdmin } from "./AdminProvider";

interface NavDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: { group: string; items: NavDef[] }[] = [
  {
    group: "Operación",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Pedidos", icon: Receipt },
    ],
  },
  {
    group: "Catálogo",
    items: [
      { href: "/admin/products", label: "Menú", icon: Utensils },
      { href: "/admin/categories", label: "Categorías", icon: AlignLeft },
      { href: "/admin/modifiers", label: "Modificadores", icon: SlidersHorizontal },
      { href: "/admin/promotions", label: "Promociones", icon: Tag },
    ],
  },
  {
    group: "Negocio",
    items: [
      { href: "/admin/hours", label: "Horarios", icon: Clock },
      { href: "/admin/appearance", label: "Apariencia", icon: Palette },
      { href: "/admin/settings", label: "Configuración", icon: Settings },
      { href: "/admin/account", label: "Cuenta", icon: User },
    ],
  },
];

const LABELS: Record<string, string> = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.href, i.label])));
const COLLAPSE_KEY = "menu-digital.admin.sidebar";

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

function useCrumbs(): { label: string; href?: string }[] {
  const pathname = usePathname();
  const { business } = useAdmin();
  const crumbs: { label: string; href?: string }[] = [{ label: business.name, href: "/admin" }];
  if (pathname === "/admin") return [...crumbs, { label: "Overview" }];
  const m = pathname.match(/^\/admin\/products\/(.+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]!);
    const name = id === "new" ? "Nuevo producto" : (business.products.find((p) => p.id === id)?.name ?? "Producto");
    return [...crumbs, { label: "Menú", href: "/admin/products" }, { label: name }];
  }
  const base = "/" + pathname.split("/").slice(1, 3).join("/");
  return [...crumbs, { label: LABELS[base] ?? "" }];
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { business, orders, user } = useAdmin();
  const now = useNow();
  const [collapsed, setCollapsed] = useState(false);
  /** Móvil (< 640px): la sidebar es un drawer que se abre con ☰. */
  const [mobileOpen, setMobileOpen] = useState(false);
  const crumbs = useCrumbs();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const mq = window.matchMedia("(min-width: 640px)");
    const onMq = () => mq.matches && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [mobileOpen]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* sin storage */
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* sin storage */
      }
      return !c;
    });
  };

  const pending = orders.filter((o) => o.status === "pending").length;
  const st = now ? businessStatus(business, now) : null;
  const dot = st ? STATUS_COLORS[st.key] : "transparent";

  // Etiquetas: en el drawer móvil siempre; en tablet ocultas (68px); ≥ 1000px según `collapsed`.
  const show = (d: "inline" | "block") =>
    cn(mobileOpen ? d : "hidden", "min-[640px]:hidden", !collapsed && (d === "inline" ? "min-[1000px]:inline" : "min-[1000px]:block"));
  const labelCls = show("inline");
  const rowCls = cn(mobileOpen && "max-[639px]:justify-start max-[639px]:px-2.5", !collapsed && "min-[1000px]:justify-start min-[1000px]:px-2.5");

  return (
    <div className="admin-root flex h-dvh bg-p-canvas font-pbody text-sm text-p-ink">
      {mobileOpen ? (
        <div aria-hidden onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 animate-fade-in bg-[rgba(20,18,15,.45)] min-[640px]:hidden" />
      ) : null}
      <aside
        id="admin-sidebar"
        className={cn(
          "h-full flex-none flex-col bg-p-side text-[#F3EEE6] transition-[width] duration-200 min-[640px]:flex min-[640px]:w-[68px]",
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 flex w-[264px] animate-[drawerInLeft_.28s_cubic-bezier(.2,.8,.2,1)] shadow-[20px_0_60px_rgba(0,0,0,.25)] min-[640px]:static min-[640px]:animate-none min-[640px]:shadow-none"
            : "hidden",
          !collapsed && "min-[1000px]:w-[236px]",
        )}
      >
        <div className="flex items-center gap-2.5 px-3.5 pt-[18px] pb-3.5">
          <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-p-accent font-pdisplay text-[19px] text-white">
            {business.logoText}
          </span>
          <div className={cn("min-w-0 flex-1", show("block"))}>
            <div className="truncate text-[14.5px] font-bold text-[#F3EEE6]">{business.name}</div>
            <div className="truncate text-xs text-p-side-muted">/menu/{business.slug}</div>
          </div>
          {mobileOpen ? (
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="flex size-9 flex-none items-center justify-center rounded-[9px] border-0 bg-white/6 text-[#F3EEE6] min-[640px]:hidden"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <nav aria-label="Panel" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-1.5">
          {NAV.map((g) => (
            <Fragment key={g.group}>
              <div
                className={cn(
                  "px-2.5 pt-3.5 pb-1.5 text-[11px] font-bold tracking-[.09em] text-p-side-label uppercase",
                  show("block"),
                )}
              >
                {g.group}
              </div>
              {g.items.map((item) => {
                const on = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "relative flex h-[38px] w-full items-center justify-center gap-2.5 rounded-[9px] no-underline transition-colors hover:bg-white/6 hover:!text-inherit max-[639px]:h-11",
                      rowCls,
                      on ? "bg-white/10 font-bold text-white" : "font-medium text-p-side-text",
                    )}
                  >
                    <Icon size={18} strokeWidth={1.7} className="flex-none" aria-hidden />
                    <span className={cn("flex-1 text-left", labelCls)}>{item.label}</span>
                    {item.href === "/admin/orders" && pending > 0 ? (
                      <span
                        aria-label={`${pending} pendientes`}
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-p-accent px-1.5 text-[11px] font-bold text-white",
                          "absolute -top-0.5 right-0.5",
                          mobileOpen && "max-[639px]:static",
                          !collapsed && "min-[1000px]:static",
                        )}
                      >
                        {pending}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </Fragment>
          ))}
        </nav>

        <div className="grid gap-1 border-t border-white/8 px-2.5 pt-3 pb-4">
          <a
            href={`/menu/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver menú público"
            className={cn(
              "flex h-10 items-center justify-center gap-2.5 rounded-[9px] bg-white/6 font-semibold text-[#F3EEE6] no-underline hover:!text-white",
              rowCls,
            )}
          >
            <SquareArrowOutUpRight size={18} strokeWidth={1.7} className="flex-none" aria-hidden />
            <span className={labelCls}>Ver menú público</span>
          </a>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            title={collapsed ? "Expandir" : "Contraer"}
            className={cn(
              "hidden h-9 items-center gap-2.5 rounded-[9px] border-0 bg-transparent text-p-side-muted hover:bg-white/6 min-[1000px]:flex",
              collapsed ? "justify-center" : "justify-start px-2.5",
            )}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.7} /> : <PanelLeftClose size={18} strokeWidth={1.7} />}
            <span className={labelCls}>Contraer</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] flex-none items-center gap-4 border-b border-p-card bg-p-canvas px-7 max-[639px]:gap-2.5 max-[639px]:px-4">
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileOpen(true)}
            className="relative -ml-1 flex size-10 flex-none items-center justify-center rounded-[9px] border border-p-input bg-white min-[640px]:hidden"
          >
            <Menu size={18} />
            {pending > 0 ? <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-p-canvas bg-p-accent" /> : null}
          </button>
          <nav aria-label="Ruta" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-[13.5px] whitespace-nowrap text-p-muted">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 ? <span className="text-[#B8B1A6] max-[639px]:hidden">/</span> : null}
                  {c.href && !last ? (
                    <Link href={c.href} className="font-medium text-p-muted no-underline max-[639px]:hidden">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={cn("truncate", last ? "font-bold text-p-ink" : "font-medium")}>
                      {c.label}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </nav>
          <Link
            href="/admin/hours"
            aria-label={st ? `Estado: ${st.label}` : "Estado"}
            className="flex h-[34px] flex-none items-center gap-2 rounded-[17px] border border-p-input bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-p-ink no-underline"
          >
            <span className="size-2 flex-none rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px ${st ? dot + "33" : "transparent"}` }} />
            <span className={cn(st ? undefined : "invisible", "max-[400px]:hidden")}>{st?.label ?? "Abierto"}</span>
          </Link>
          <Link
            href="/admin/account"
            aria-label="Cuenta"
            className="flex size-[34px] flex-none items-center justify-center rounded-full bg-[#E6DFD3] text-[13px] font-bold text-p-ink no-underline"
          >
            {user.initials}
          </Link>
        </header>

        <main id="admin-scroll" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-10 max-[639px]:px-4 max-[639px]:pt-5">
            {children}
            <Credit className="mt-20 text-p-muted" />
          </div>
        </main>
      </div>
    </div>
  );
}
