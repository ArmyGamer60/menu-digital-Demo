"use client";

import {
  AlignLeft,
  Clock,
  LayoutDashboard,
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
  const crumbs = useCrumbs();

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

  // Etiquetas visibles: nunca con `collapsed`; con sidebar abierta solo ≥ 1000px.
  const labelCls = collapsed ? "hidden" : "hidden min-[1000px]:inline";

  return (
    <div className="admin-root flex h-dvh bg-p-canvas font-pbody text-sm text-p-ink">
      <aside
        className={cn(
          "flex h-full w-[68px] flex-none flex-col bg-p-side text-[#F3EEE6] transition-[width] duration-200",
          !collapsed && "min-[1000px]:w-[236px]",
        )}
      >
        <div className="flex items-center gap-2.5 px-3.5 pt-[18px] pb-3.5">
          <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-p-accent font-pdisplay text-[19px] text-white">
            {business.logoText}
          </span>
          <div className={cn("min-w-0", collapsed ? "hidden" : "hidden min-[1000px]:block")}>
            <div className="truncate text-[14.5px] font-bold text-[#F3EEE6]">{business.name}</div>
            <div className="truncate text-xs text-p-side-muted">/menu/{business.slug}</div>
          </div>
        </div>

        <nav aria-label="Panel" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-1.5">
          {NAV.map((g) => (
            <Fragment key={g.group}>
              <div
                className={cn(
                  "px-2.5 pt-3.5 pb-1.5 text-[11px] font-bold tracking-[.09em] text-p-side-label uppercase",
                  collapsed ? "hidden" : "hidden min-[1000px]:block",
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
                      "relative flex h-[38px] w-full items-center justify-center gap-2.5 rounded-[9px] no-underline transition-colors hover:bg-white/6 hover:!text-inherit",
                      !collapsed && "min-[1000px]:justify-start min-[1000px]:px-2.5",
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
                          collapsed ? "absolute -top-0.5 right-0.5" : "absolute -top-0.5 right-0.5 min-[1000px]:static",
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
              !collapsed && "min-[1000px]:justify-start min-[1000px]:px-2.5",
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
        <header className="flex h-[60px] flex-none items-center gap-4 border-b border-p-card bg-p-canvas px-7 max-[640px]:px-4">
          <nav aria-label="Ruta" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-[13.5px] whitespace-nowrap text-p-muted">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 ? <span className="text-[#B8B1A6]">/</span> : null}
                  {c.href && !last ? (
                    <Link href={c.href} className="font-medium text-p-muted no-underline">
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
            className="flex h-[34px] items-center gap-2 rounded-[17px] border border-p-input bg-white px-3 text-[13px] font-semibold text-p-ink no-underline"
          >
            <span className="size-2 flex-none rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px ${st ? dot + "33" : "transparent"}` }} />
            <span className={st ? undefined : "invisible"}>{st?.label ?? "Abierto"}</span>
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
          <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-10 max-[640px]:px-4">
            {children}
            <Credit className="mt-20 text-p-muted" />
          </div>
        </main>
      </div>
    </div>
  );
}
