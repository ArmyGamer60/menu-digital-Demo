"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Credit, Toast, useToast } from "@/components/ui";
import { businessStatus, zonedClock } from "@/lib/hours";
import { money } from "@/lib/money";
import { cartTotals, defaultSelections, describeSelections, lineUnitPrice } from "@/lib/pricing";
import { createOrder, getBusinessById, subscribeBusiness } from "@/lib/repo";
import { asStyle, themeToCssVars } from "@/lib/theme";
import { getCartStore } from "@/stores/cart";
import type { Business, CardStyle, CartLine, Layout, OrderDraft, Product } from "@/types";
import { BusinessInfoSheet } from "./BusinessInfoSheet";
import { CartBar, CartPanel } from "./CartPanel";
import { CategoryChips, CategorySidebar, type NavItem } from "./CategoryNav";
import { CheckoutFlow, type CheckoutStep } from "./CheckoutFlow";
import { Hero } from "./Hero";
import { useNow } from "./hooks";
import { MenuHeader } from "./MenuHeader";
import { MenuEmpty, MenuError, MenuSkeleton } from "./MenuStates";
import { FeaturedStrip, ProductCard } from "./ProductCard";
import { ProductSheet, type ProductSheetState } from "./ProductSheet";
import { PromoStrip } from "./PromoStrip";
import { StatusBanner } from "./StatusBanner";
import {
  applyDemoStatus,
  buildSections,
  closedCtaLabel,
  countLabel,
  searchProducts,
  visibleProducts,
  type DemoState,
  type ProductView,
} from "./view";

const DEMO_STATES = ["closed", "paused", "empty", "error", "loading"] as const;
const CARD_STYLES: CardStyle[] = ["minimal", "rounded", "editorial", "image-heavy", "compact", "premium"];
const LAYOUTS: Layout[] = ["grid", "list", "large", "compact"];
const SPY_LOCK_MS = 700;

type LoadState = "ready" | "loading" | "error";

const headerOffset = () => ((document.querySelector("[data-menu-header]") as HTMLElement | null)?.offsetHeight ?? 100) + 8;

export function MenuApp({ initialBusiness }: { initialBusiness: Business }) {
  const slug = initialBusiness.slug;
  const [business, setBusiness] = useState(initialBusiness);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [demo, setDemo] = useState<DemoState>(null);
  const [preview, setPreview] = useState<{ card?: CardStyle; layout?: Layout }>({});
  const [tableFromQr, setTableFromQr] = useState("");
  const now = useNow();

  // UI
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pd, setPd] = useState<ProductSheetState | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep | null>(null);
  const [bump, setBump] = useState(0);
  const toast = useToast();

  // Carrito (Zustand persist por slug; se rehidrata tras montar para no romper la hidratación SSR).
  const cart = getCartStore(slug);
  const lines = cart((s) => s.lines);
  useEffect(() => {
    void cart.persist.rehydrate();
  }, [cart]);

  const load = useCallback(async () => {
    try {
      const b = await getBusinessById(initialBusiness.id);
      if (!b) throw new Error("not found");
      setBusiness(b);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [initialBusiness.id]);

  // ?mesa=N, ?demo=closed|paused|empty|error|loading, ?card=…, ?layout=… + cambios guardados desde el panel.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setTableFromQr((q.get("mesa") ?? "").trim().slice(0, 12));
    const d = q.get("demo") as DemoState;
    const card = q.get("card") as CardStyle | null;
    const layout = q.get("layout") as Layout | null;
    setPreview({
      card: card && CARD_STYLES.includes(card) ? card : undefined,
      layout: layout && LAYOUTS.includes(layout) ? layout : undefined,
    });
    if (d && (DEMO_STATES as readonly string[]).includes(d)) {
      setDemo(d);
      if (d === "error") setLoadState("error");
      if (d === "loading") setLoadState("loading");
    }
    if (d !== "error" && d !== "loading") void load();
    return subscribeBusiness(initialBusiness.id, setBusiness);
  }, [slug, load, initialBusiness.id]);

  // Al pasar a desktop el carrito es fijo: cerrar el drawer/sheet.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = () => mq.matches && setCartOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme = useMemo(
    () => ({ ...business.theme, cardStyle: preview.card ?? business.theme.cardStyle, layout: preview.layout ?? business.theme.layout }),
    [business.theme, preview],
  );

  // Fondo del documento = fondo del Theme (overscroll / barras del navegador).
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = theme.background;
    return () => {
      document.body.style.background = prev;
    };
  }, [theme.background]);

  // Favicon subido desde el panel (fase 1 vive en localStorage; fase 2 lo sirve generateMetadata).
  useEffect(() => {
    if (!business.favicon) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = business.favicon;
  }, [business.favicon]);

  // Estado de apertura (en la zona horaria del negocio). Sin `now` (SSR) solo se resuelven los estados manuales fijos.
  const status = useMemo(() => {
    const manual = business.settings.manualState;
    const base = now
      ? businessStatus(business, now)
      : manual === "open" || manual === "paused"
        ? businessStatus(business)
        : null;
    return applyDemoStatus(base, demo);
  }, [business, now, demo]);
  const canOrder = status?.canOrder ?? true;
  const today = now ? zonedClock(now, business.settings.timezone).day : null;
  const m = useCallback((n: number) => money(n, business.settings.currency), [business.settings.currency]);

  const products = useMemo(() => (demo === "empty" ? [] : visibleProducts(business)), [business, demo]);
  const sections = useMemo(() => buildSections(business, products, canOrder), [business, products, canOrder]);
  const inSearch = searchOpen && search.trim().length > 0;
  const results = useMemo(
    () => (inSearch ? searchProducts(business, products, search, canOrder) : []),
    [inSearch, business, products, search, canOrder],
  );
  const nav: NavItem[] = useMemo(() => sections.map((s) => ({ id: s.id, name: s.name, count: s.items.length })), [sections]);
  const navIds = useMemo(() => nav.map((n) => n.id), [nav]);
  const active = activeCat ?? navIds[0] ?? null;
  const totals = useMemo(() => cartTotals(business, lines), [business, lines]);
  const promotions = useMemo(() => business.promotions.filter((p) => p.active), [business.promotions]);

  // ───── Scroll-spy ─────
  const sectionEls = useRef(new Map<string, HTMLElement>());
  const lockUntil = useRef(0);
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (Date.now() < lockUntil.current || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const off = headerOffset() + 30;
        let cur: string | null = null;
        for (const id of navIds) {
          const el = sectionEls.current.get(id);
          if (el && el.getBoundingClientRect().top <= off) cur = id;
        }
        const next = cur ?? navIds[0] ?? null;
        setActiveCat((prev) => (prev === next ? prev : next));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [navIds]);

  // El chip activo se centra con scroll suave.
  useEffect(() => {
    const c = chipsRef.current;
    if (!c || !active) return;
    const b = c.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (b) c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  const scrollToCat = useCallback((id: string) => {
    const el = sectionEls.current.get(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset() + 12;
    lockUntil.current = Date.now() + SPY_LOCK_MS;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveCat(id);
  }, []);

  // ───── Producto / carrito ─────
  const openProduct = useCallback(
    (p: Product, line?: CartLine) => {
      setPd({
        productId: p.id,
        sel: line ? structuredClone(line.sel) : defaultSelections(business, p),
        qty: line ? line.qty : 1,
        notes: line ? line.notes : "",
        editLineId: line ? line.id : null,
        showErr: false,
      });
      setCartOpen(false);
    },
    [business],
  );

  const commit = useCallback(
    (s: ProductSheetState) => {
      const p = business.products.find((x) => x.id === s.productId);
      if (!p) return;
      const line: CartLine = {
        id: s.editLineId ?? "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        productId: p.id,
        categoryId: p.categoryId,
        name: p.name,
        image: p.image,
        qty: s.qty,
        sel: s.sel,
        notes: s.notes.trim(),
        unit: lineUnitPrice(business, p, s.sel),
        mods: describeSelections(business, p, s.sel),
      };
      const st = cart.getState();
      if (s.editLineId) st.update(s.editLineId, line);
      else st.add(line);
      setBump((b) => b + 1);
      toast.show(s.editLineId ? "Producto actualizado" : `Agregado · ${p.name}`);
    },
    [business, cart, toast],
  );

  const quickAdd = useCallback(
    (v: ProductView) => {
      if (v.hasRequired) return openProduct(v.product);
      commit({ productId: v.product.id, sel: defaultSelections(business, v.product), qty: 1, notes: "", editLineId: null, showErr: false });
    },
    [business, commit, openProduct],
  );

  const startCheckout = () => {
    if (!canOrder || !lines.length) return;
    setCartOpen(false);
    setStep("mode");
  };

  const onSent = (draft: OrderDraft) => {
    cart.getState().clear();
    createOrder(business.id, draft)
      .then((order) => setBusiness((b) => ({ ...b, orderCounter: order.number })))
      .catch(() => setBusiness((b) => ({ ...b, orderCounter: draft.number })));
  };

  const retry = () => {
    setDemo(null);
    setLoadState("loading");
    void load();
  };

  const ready = loadState === "ready";
  const showCartBar = ready && lines.length > 0 && !cartOpen && !pd && !step && !infoOpen;
  const renderCard = (v: ProductView, i: number) => (
    <ProductCard
      key={v.product.id}
      view={v}
      cardStyle={theme.cardStyle}
      layout={theme.layout}
      index={i}
      onOpen={() => openProduct(v.product)}
      onQuick={() => quickAdd(v)}
    />
  );

  return (
    <div className="menu-root" data-card={theme.cardStyle} data-layout={theme.layout} style={asStyle(themeToCssVars(theme))}>
      <div className={ready ? "desk:pr-[380px]" : undefined}>
        <MenuHeader
          business={business}
          status={status}
          cartCount={totals.count}
          searchOpen={searchOpen}
          search={search}
          onSearchChange={setSearch}
          onToggleSearch={() => {
            setSearchOpen((o) => !o);
            setSearch("");
          }}
          onOpenInfo={() => setInfoOpen(true)}
          onOpenCart={() => setCartOpen(true)}
          chips={
            ready && products.length && !inSearch ? (
              <CategoryChips ref={chipsRef} items={nav} activeId={active} onSelect={scrollToCat} />
            ) : null
          }
        />

        {ready ? <StatusBanner status={status} /> : null}

        {loadState === "loading" ? (
          <MenuSkeleton />
        ) : loadState === "error" ? (
          <>
            <MenuError onRetry={retry} />
            <Credit className="pb-8 text-muted" />
          </>
        ) : !products.length ? (
          <>
            <MenuEmpty />
            <Credit className="pb-8 text-muted" />
          </>
        ) : (
          <div className="mx-auto flex max-w-[var(--maxw)] items-start gap-10 px-[var(--gutter)]">
            {!inSearch ? <CategorySidebar items={nav} activeId={active} onSelect={scrollToCat} /> : null}

            <main className="min-w-0 flex-1 pb-[140px]">
              {theme.heroEnabled && !inSearch ? <Hero theme={theme} /> : null}
              {!inSearch ? <PromoStrip promotions={promotions} /> : null}

              {inSearch ? (
                <section className="pt-[26px]" aria-live="polite">
                  <h2 className="m-0 font-display text-[26px] font-normal tracking-[-.01em]">
                    {results.length ? `${results.length} resultados para “${search.trim()}”` : `Sin resultados para “${search.trim()}”`}
                  </h2>
                  {results.length ? (
                    <div className="menu-grid mt-3.5">{results.map(renderCard)}</div>
                  ) : (
                    <p className="mt-2 text-[15px] text-muted">Prueba con otra palabra, por ejemplo “latte” o “vegano”.</p>
                  )}
                </section>
              ) : (
                sections.map((sec) => (
                  <section
                    key={sec.id}
                    aria-labelledby={`sec-${sec.id}`}
                    ref={(el) => {
                      if (el) sectionEls.current.set(sec.id, el);
                      else sectionEls.current.delete(sec.id);
                    }}
                    className="pt-[30px]"
                  >
                    <div className="mb-3.5 flex items-baseline justify-between gap-3">
                      <div>
                        <h2
                          id={`sec-${sec.id}`}
                          className="m-0 font-display text-[length:var(--sec-fs)] leading-[1.05] font-normal tracking-[-.015em]"
                        >
                          {sec.name}
                        </h2>
                        {sec.description ? <div className="mt-1 text-sm text-muted">{sec.description}</div> : null}
                      </div>
                      {sec.kind === "products" ? (
                        <div className="text-[13px] whitespace-nowrap text-muted">{countLabel(sec.items.length)}</div>
                      ) : null}
                    </div>

                    {sec.kind === "empty" ? (
                      <div className="rounded-2xl border-[1.5px] border-dashed border-line-strong px-5 py-7 text-center text-[15px] text-muted">
                        Esta categoría aún no tiene productos.
                      </div>
                    ) : sec.kind === "strip" ? (
                      <FeaturedStrip items={sec.items} onOpen={(v) => openProduct(v.product)} />
                    ) : (
                      <div className="menu-grid">{sec.items.map(renderCard)}</div>
                    )}
                  </section>
                ))
              )}

              <footer className="mt-14 flex flex-wrap justify-between gap-x-5 gap-y-2 border-t border-line py-6 text-[13px] text-muted">
                <span>{business.address}</span>
                <span>menu.app/menu/{business.slug}</span>
                <Credit className="basis-full pt-2 text-muted" />
              </footer>
            </main>
          </div>
        )}
      </div>

      {ready ? (
        <CartPanel
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          lines={lines}
          totals={totals}
          money={m}
          taxRate={business.settings.taxRate}
          canOrder={canOrder}
          continueLabel={canOrder ? "Continuar pedido" : closedCtaLabel(status)}
          onInc={(id) => cart.getState().inc(id)}
          onDec={(id) => cart.getState().dec(id)}
          onEdit={(l) => {
            const p = business.products.find((x) => x.id === l.productId);
            if (p) openProduct(p, l);
          }}
          onRemove={(l) => {
            cart.getState().remove(l.id);
            toast.show("Producto eliminado");
          }}
          onCheckout={startCheckout}
        />
      ) : null}

      {showCartBar ? <CartBar count={totals.count} total={m(totals.total)} bumpKey={bump} onOpen={() => setCartOpen(true)} /> : null}

      <ProductSheet
        business={business}
        state={pd}
        status={status}
        onChange={setPd}
        onClose={() => setPd(null)}
        onCommit={(s) => {
          commit(s);
          setPd(null);
        }}
      />

      <BusinessInfoSheet business={business} status={status} today={today} open={infoOpen} onClose={() => setInfoOpen(false)} />

      <CheckoutFlow
        business={business}
        lines={lines}
        totals={totals}
        step={step}
        onStepChange={setStep}
        tableFromQr={tableFromQr}
        onBackToCart={() => setCartOpen(true)}
        onSent={onSent}
      />

      <Toast message={toast.message} />
    </div>
  );
}
