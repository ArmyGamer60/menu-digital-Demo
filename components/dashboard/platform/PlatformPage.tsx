"use client";

import { ArrowLeft, Check, Copy, ExternalLink, Globe, KeyRound, MoreHorizontal, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { logout, selectBusiness } from "@/app/admin/actions";
import {
  addOwnerAction,
  createBusinessAction,
  deleteBusinessAction,
  removeOwnerAction,
  resetPasswordAction,
  importMenuAction,
  setDomainAction,
  setStatusAction,
  type Credentials,
} from "@/app/admin/negocios/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Credit } from "@/components/ui/Credit";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { generatePassword } from "@/lib/password";
import type { BusinessSummary } from "@/lib/repo";
import { sanitizeSlug } from "@/lib/slug";
import { TEMPLATES, type TemplateKey } from "@/lib/templates";
import { Card, Help, PButton, PInput, PLabel, PageHeader, PanelDrawer, Seg, StatusPill } from "../ui";

type Drawer =
  | { kind: "new" }
  | { kind: "created"; name: string; slug: string; credentials: Credentials | null }
  | { kind: "access"; id: string }
  | { kind: "domain"; id: string }
  | { kind: "import"; id: string };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

function useToasts() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed right-5 bottom-5 z-[100] flex flex-col items-end gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex animate-[panelToast_.22s_ease-out] items-center gap-2.5 rounded-xl bg-p-ink px-4 py-3 text-sm font-semibold text-p-canvas shadow-[0_12px_30px_rgba(0,0,0,.2)]"
        >
          <span className="size-2 rounded-full bg-[#6FCF97]" />
          {t.msg}
        </div>
      ))}
    </div>
  );
  return { toast, node };
}

export function PlatformPage({ user, businesses, activeId }: { user: SessionUser; businesses: BusinessSummary[]; activeId: string | null }) {
  const router = useRouter();
  const { toast, node: toasts } = useToasts();
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; text: string; label: string; run: () => Promise<void> } | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const active = businesses.filter((b) => b.status === "active").length;
  const orders30 = businesses.reduce((s, b) => s + b.ordersLast30, 0);
  const byId = (id: string) => businesses.find((b) => b.id === id);

  const after = (r: { ok: boolean; error?: string }, msg: string) => {
    if (!r.ok) return toast(r.error ?? "Algo salió mal"), false;
    toast(msg);
    router.refresh();
    return true;
  };

  return (
    <div className="min-h-dvh bg-p-canvas font-pbody text-sm text-p-ink">
      <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-p-card bg-p-canvas/95 px-7 backdrop-blur max-[639px]:px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-p-muted no-underline hover:!text-p-ink">
          <ArrowLeft size={16} aria-hidden />
          <span className="max-[480px]:hidden">Volver al panel</span>
          <span className="min-[481px]:hidden">Panel</span>
        </Link>
        <div className="flex-1" />
        <span className="truncate text-[13px] text-p-muted max-[520px]:hidden">{user.email}</span>
        <form action={logout}>
          <PButton type="submit" size="sm">
            Salir
          </PButton>
        </form>
      </header>

      <main className="mx-auto max-w-[1240px] px-7 pt-7 pb-10 max-[639px]:px-4 max-[639px]:pt-5">
        <PageHeader
          eyebrow="Plataforma"
          title="Negocios"
          sub="Da de alta a tus clientes, entra a su panel y controla quién tiene acceso."
          actions={
            <PButton variant="primary" onClick={() => setDrawer({ kind: "new" })}>
              <Plus size={16} aria-hidden />
              Nuevo negocio
            </PButton>
          }
        />

        <div className="mt-5 grid grid-cols-3 gap-3 max-[520px]:grid-cols-1">
          <Kpi label="Negocios activos" value={active} />
          <Kpi label="Suspendidos" value={businesses.length - active} />
          <Kpi label="Pedidos (30 días)" value={orders30} />
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3">
          {businesses.map((b) => (
            <BusinessCard
              key={b.id}
              b={b}
              current={b.id === activeId}
              onAccess={() => setDrawer({ kind: "access", id: b.id })}
              onDomain={() => setDrawer({ kind: "domain", id: b.id })}
              onImport={() => setDrawer({ kind: "import", id: b.id })}
              onToggleStatus={() => {
                const suspend = b.status === "active";
                const go = async () => void after(await setStatusAction(b.id, suspend ? "suspended" : "active"), suspend ? "Negocio suspendido" : "Negocio activado");
                if (!suspend) return void go();
                setConfirm({
                  title: `¿Suspender “${b.name}”?`,
                  text: "Su menú público dejará de mostrarse. Los datos se conservan y puedes reactivarlo cuando quieras.",
                  label: "Suspender",
                  run: go,
                });
              }}
              onDelete={() =>
                setConfirm({
                  title: `¿Eliminar “${b.name}”?`,
                  text: "Se borran para siempre su menú, pedidos y accesos. Esta acción no se puede deshacer.",
                  label: "Eliminar",
                  run: async () => void after(await deleteBusinessAction(b.id), "Negocio eliminado"),
                })
              }
            />
          ))}
          {!businesses.length ? (
            <div className="rounded-[14px] border-[1.5px] border-dashed border-p-input p-10 text-center text-p-muted">
              Aún no hay negocios. Crea el primero con “Nuevo negocio”.
            </div>
          ) : null}
        </div>

        <Credit className="mt-20 text-p-muted" />
      </main>

      <NewBusinessDrawer
        open={drawer?.kind === "new"}
        onClose={() => setDrawer(null)}
        onCreated={(d) => {
          router.refresh();
          setDrawer({ kind: "created", ...d });
        }}
      />
      <CreatedDrawer drawer={drawer?.kind === "created" ? drawer : null} origin={origin} onClose={() => setDrawer(null)} toast={toast} />
      <AccessDrawer
        business={drawer?.kind === "access" ? byId(drawer.id) : undefined}
        origin={origin}
        onClose={() => setDrawer(null)}
        toast={toast}
        onChanged={() => router.refresh()}
        askConfirm={setConfirm}
      />
      <ImportDrawer
        business={drawer?.kind === "import" ? byId(drawer.id) : undefined}
        onClose={() => setDrawer(null)}
        askConfirm={setConfirm}
        onDone={(r) => after(r, r.ok && "summary" in r ? `Menú importado: ${r.summary}` : "") && setDrawer(null)}
      />
      <DomainDrawer
        business={drawer?.kind === "domain" ? byId(drawer.id) : undefined}
        onClose={() => setDrawer(null)}
        onSaved={(r) => after(r, "Dominio actualizado") && setDrawer(null)}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        confirmLabel={confirm?.label ?? "Confirmar"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm;
          setConfirm(null);
          void c?.run();
        }}
      >
        {confirm?.text}
      </ConfirmDialog>
      {toasts}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card pad={18}>
      <div className="text-[13px] text-p-muted">{label}</div>
      <div className="mt-1 font-pdisplay text-[30px] leading-none">{value}</div>
    </Card>
  );
}

function BusinessCard({
  b,
  current,
  onAccess,
  onDomain,
  onImport,
  onToggleStatus,
  onDelete,
}: {
  b: BusinessSummary;
  current: boolean;
  onAccess: () => void;
  onDomain: () => void;
  onImport: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);
  const suspended = b.status === "suspended";
  const item = (label: string, fn: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setMenu(false);
        fn();
      }}
      className={cn("block w-full border-0 bg-transparent px-3.5 py-2 text-left font-medium hover:bg-p-row", danger && "text-danger")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] border border-p-card bg-white p-4">
      <span className="flex size-11 flex-none items-center justify-center rounded-[11px] bg-p-accent font-pdisplay text-[21px] text-white">
        {b.logoText || b.name[0]}
      </span>
      <div className="min-w-0 flex-[1_1_220px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[15.5px] font-bold">{b.name}</span>
          {suspended ? (
            <StatusPill bg="#FBE9E7" fg="#B3261E">
              Suspendido
            </StatusPill>
          ) : (
            <StatusPill bg="#E3F1E7" fg="#1F6B3F">
              Activo
            </StatusPill>
          )}
          {current ? <span className="text-xs font-semibold text-p-muted">· abierto en tu panel</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-p-muted">
          <a href={`/menu/${b.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono text-p-muted">
            /menu/{b.slug}
          </a>
          {b.customDomain ? (
            <a href={`https://${b.customDomain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-p-muted">
              <Globe size={13} aria-hidden />
              {b.customDomain}
            </a>
          ) : null}
        </div>
        <div className="mt-1 truncate text-[13px] text-p-muted">
          {b.owners.length ? b.owners.map((o) => o.email).join(", ") : "Sin dueño asignado"} · {b.products} productos · {b.ordersLast30} pedidos (30 d) · alta{" "}
          {fmtDate(b.createdAt)}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2 max-[640px]:w-full">
        <form action={selectBusiness.bind(null, b.id, "/admin")} className="max-[640px]:flex-1">
          <PButton type="submit" variant="primary" size="md" className="max-[640px]:w-full">
            Abrir panel
          </PButton>
        </form>
        <PButton size="md" onClick={onAccess} title="Accesos">
          <Users size={16} aria-hidden />
          <span className="max-[380px]:hidden">Accesos</span>
        </PButton>
        <div ref={ref} className="relative">
          <PButton size="md" aria-label="Más acciones" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="px-2.5">
            <MoreHorizontal size={18} />
          </PButton>
          {menu ? (
            <div
              role="menu"
              className="absolute top-[calc(100%+6px)] right-0 z-20 w-[210px] animate-fade-in overflow-hidden rounded-xl border border-p-card bg-white py-1.5 shadow-[0_18px_40px_rgba(0,0,0,.18)]"
            >
              {item("Ver menú", () => window.open(`/menu/${b.slug}`, "_blank"))}
              {item("Importar menú", onImport)}
              {item(b.customDomain ? "Cambiar dominio" : "Dominio propio", onDomain)}
              {item(suspended ? "Reactivar" : "Suspender", onToggleStatus)}
              {item("Eliminar negocio", onDelete, true)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NewBusinessDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (d: { name: string; slug: string; credentials: Credentials | null }) => void;
}) {
  const blank = () => ({ name: "", slug: "", slugTouched: false, template: "blank" as TemplateKey, ownerEmail: "", ownerName: "", ownerPassword: generatePassword() });
  const [f, setF] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setF(blank());
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const r = await createBusinessAction({
      name: f.name,
      slug: f.slug,
      template: f.template,
      ownerEmail: f.ownerEmail,
      ownerName: f.ownerName,
      ownerPassword: f.ownerPassword,
    }).catch(() => ({ ok: false as const, error: "Sin conexión." }));
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onCreated({ name: f.name.trim(), slug: r.slug, credentials: r.credentials });
  };

  return (
    <PanelDrawer
      open={open}
      title="Nuevo negocio"
      onClose={onClose}
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <PButton onClick={onClose}>Cancelar</PButton>
            <PButton variant="primary" className="px-[18px]" disabled={busy || !f.name.trim()} onClick={() => void submit()}>
              {busy ? "Creando…" : "Crear negocio"}
            </PButton>
          </div>
        </>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <PLabel htmlFor="nb-name">Nombre del negocio</PLabel>
          <PInput
            id="nb-name"
            value={f.name}
            placeholder="Ej. Café Luna"
            onChange={(e) => {
              const name = e.target.value;
              setF((x) => ({ ...x, name, slug: x.slugTouched ? x.slug : sanitizeSlug(name).replace(/^-+|-+$/g, "") }));
            }}
          />
        </div>
        <div>
          <PLabel htmlFor="nb-slug">Slug (dirección del menú)</PLabel>
          <PInput
            id="nb-slug"
            mono
            value={f.slug}
            placeholder="cafe-luna"
            onChange={(e) => setF((x) => ({ ...x, slug: sanitizeSlug(e.target.value), slugTouched: true }))}
          />
          <Help>El menú quedará en /menu/{f.slug || "…"}</Help>
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold">Plantilla</div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <Seg key={t.key} active={f.template === t.key} onClick={() => setF((x) => ({ ...x, template: t.key }))}>
                {t.label}
              </Seg>
            ))}
          </div>
          <Help>{TEMPLATES.find((t) => t.key === f.template)?.help}</Help>
        </div>

        <div className="mt-1 border-t border-p-sep pt-4">
          <div className="font-bold">Cuenta del dueño</div>
          <div className="mt-0.5 text-[13px] text-p-muted">Opcional. Si el correo ya tiene cuenta, solo se le da acceso a este negocio.</div>
        </div>
        <div>
          <PLabel htmlFor="nb-email">Correo</PLabel>
          <PInput id="nb-email" type="email" value={f.ownerEmail} placeholder="dueno@cafeluna.mx" onChange={(e) => setF((x) => ({ ...x, ownerEmail: e.target.value }))} />
        </div>
        <div>
          <PLabel htmlFor="nb-oname">Nombre</PLabel>
          <PInput id="nb-oname" value={f.ownerName} placeholder="Ana Pérez" onChange={(e) => setF((x) => ({ ...x, ownerName: e.target.value }))} />
        </div>
        <div>
          <PLabel htmlFor="nb-pw">Contraseña temporal</PLabel>
          <div className="flex gap-2">
            <PInput id="nb-pw" mono value={f.ownerPassword} onChange={(e) => setF((x) => ({ ...x, ownerPassword: e.target.value }))} />
            <PButton size="lg" onClick={() => setF((x) => ({ ...x, ownerPassword: generatePassword() }))} title="Generar otra">
              <KeyRound size={16} aria-hidden />
            </PButton>
          </div>
          <Help>El cliente puede cambiarla después en Cuenta.</Help>
        </div>
        {error ? (
          <div role="alert" className="text-[13px] font-semibold text-danger">
            {error}
          </div>
        ) : null}
        <button type="submit" hidden />
      </form>
    </PanelDrawer>
  );
}

function CopyBlock({ text, toast, children }: { text: string; toast: (m: string) => void; children: ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-xl border border-p-card bg-p-row p-4">
      <div className="grid gap-1.5 font-mono text-[13px] leading-relaxed break-all">{children}</div>
      <PButton
        size="md"
        className="mt-3"
        onClick={() => {
          navigator.clipboard.writeText(text).then(
            () => {
              setDone(true);
              toast("Copiado");
              setTimeout(() => setDone(false), 1500);
            },
            () => toast("No se pudo copiar"),
          );
        }}
      >
        {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        Copiar para enviar
      </PButton>
    </div>
  );
}

function credentialsText(origin: string, c: Credentials, name?: string, slug?: string) {
  return [
    name ? `Acceso a tu menú digital — ${name}` : "Acceso a tu menú digital",
    slug ? `Tu menú: ${origin}/menu/${slug}` : null,
    `Panel: ${origin}/admin`,
    `Correo: ${c.email}`,
    c.password ? `Contraseña: ${c.password}` : "Contraseña: la misma que ya usas",
  ]
    .filter(Boolean)
    .join("\n");
}

function CreatedDrawer({
  drawer,
  origin,
  onClose,
  toast,
}: {
  drawer: { name: string; slug: string; credentials: Credentials | null } | null;
  origin: string;
  onClose: () => void;
  toast: (m: string) => void;
}) {
  const c = drawer?.credentials;
  return (
    <PanelDrawer
      open={!!drawer}
      title="Negocio creado"
      onClose={onClose}
      footer={
        <>
          <div />
          <PButton variant="primary" onClick={onClose}>
            Listo
          </PButton>
        </>
      }
    >
      {drawer ? (
        <div className="grid gap-4">
          <div className="text-[15px]">
            <b>{drawer.name}</b> ya tiene su menú en{" "}
            <a href={`/menu/${drawer.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono">
              /menu/{drawer.slug}
              <ExternalLink size={13} aria-hidden />
            </a>
          </div>
          {c ? (
            <>
              <div className="font-bold">Datos de acceso para el cliente</div>
              <CopyBlock text={credentialsText(origin, c, drawer.name, drawer.slug)} toast={toast}>
                <span>Panel: {origin}/admin</span>
                <span>Correo: {c.email}</span>
                <span>Contraseña: {c.password ?? "(la que ya usa)"}</span>
              </CopyBlock>
              {c.password ? <Help>La contraseña no se vuelve a mostrar. Si se pierde, genera otra desde Accesos.</Help> : null}
            </>
          ) : (
            <Help>No asignaste dueño. Puedes darle acceso a alguien después desde “Accesos”.</Help>
          )}
        </div>
      ) : null}
    </PanelDrawer>
  );
}

function AccessDrawer({
  business,
  origin,
  onClose,
  toast,
  onChanged,
  askConfirm,
}: {
  business: BusinessSummary | undefined;
  origin: string;
  onClose: () => void;
  toast: (m: string) => void;
  onChanged: () => void;
  askConfirm: (c: { title: string; text: string; label: string; run: () => Promise<void> }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Credentials | null>(null);
  const id = business?.id;
  useEffect(() => {
    setEmail("");
    setName("");
    setShown(null);
  }, [id]);

  const add = async () => {
    if (!business) return;
    setBusy(true);
    const r = await addOwnerAction(business.id, email, name).catch(() => ({ ok: false as const, error: "Sin conexión." }));
    setBusy(false);
    if (!r.ok) return toast(r.error);
    setEmail("");
    setName("");
    setShown(r.credentials);
    toast("Acceso agregado");
    onChanged();
  };

  return (
    <PanelDrawer open={!!business} title="Accesos" onClose={onClose}>
      {business ? (
        <div className="grid gap-4">
          <div className="text-p-muted">
            Personas que pueden entrar al panel de <b className="text-p-ink">{business.name}</b>.
          </div>
          <div className="grid gap-2">
            {business.owners.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-[10px] border border-p-card p-3">
                <div className="min-w-0 flex-[1_1_160px]">
                  <div className="truncate font-semibold">{o.name || o.email}</div>
                  {o.name ? <div className="truncate text-[13px] text-p-muted">{o.email}</div> : null}
                </div>
                <PButton
                  size="sm"
                  onClick={async () => {
                    const r = await resetPasswordAction(o.id);
                    if (!r.ok) return toast(r.error);
                    setShown(r.credentials);
                    toast("Contraseña nueva generada");
                  }}
                >
                  Nueva contraseña
                </PButton>
                <PButton
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    askConfirm({
                      title: `¿Quitar el acceso de ${o.email}?`,
                      text: "Ya no podrá entrar al panel de este negocio.",
                      label: "Quitar acceso",
                      run: async () => {
                        const r = await removeOwnerAction(business.id, o.id);
                        if (!r.ok) return toast(r.error);
                        toast("Acceso retirado");
                        onChanged();
                      },
                    })
                  }
                >
                  Quitar
                </PButton>
              </div>
            ))}
            {!business.owners.length ? <div className="text-[13px] text-p-muted">Nadie tiene acceso todavía.</div> : null}
          </div>

          {shown ? (
            <CopyBlock text={credentialsText(origin, shown, business.name, business.slug)} toast={toast}>
              <span>Panel: {origin}/admin</span>
              <span>Correo: {shown.email}</span>
              <span>Contraseña: {shown.password ?? "(la que ya usa)"}</span>
            </CopyBlock>
          ) : null}

          <form
            className="grid gap-3 border-t border-p-sep pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <div className="font-bold">Dar acceso</div>
            <div>
              <PLabel htmlFor="ac-email">Correo</PLabel>
              <PInput id="ac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="socio@negocio.mx" />
            </div>
            <div>
              <PLabel htmlFor="ac-name">Nombre (opcional)</PLabel>
              <PInput id="ac-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <PButton type="submit" variant="primary" size="md" disabled={busy || !email.trim()}>
                {busy ? "Agregando…" : "Agregar acceso"}
              </PButton>
            </div>
            <Help>Si el correo no tiene cuenta se crea con una contraseña temporal que verás aquí para enviársela.</Help>
          </form>
        </div>
      ) : null}
    </PanelDrawer>
  );
}

function DomainDrawer({
  business,
  onClose,
  onSaved,
}: {
  business: BusinessSummary | undefined;
  onClose: () => void;
  onSaved: (r: { ok: boolean; error?: string }) => void;
}) {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setDomain(business?.customDomain ?? ""), [business?.id, business?.customDomain]);
  const sub = domain.split(".").length > 2;

  const save = async (value: string) => {
    if (!business) return;
    setBusy(true);
    const r = await setDomainAction(business.id, value).catch(() => ({ ok: false as const, error: "Sin conexión." }));
    setBusy(false);
    onSaved(r);
  };

  return (
    <PanelDrawer
      open={!!business}
      title="Dominio propio"
      onClose={onClose}
      footer={
        <>
          <div>
            {business?.customDomain ? (
              <PButton variant="danger" disabled={busy} onClick={() => void save("")}>
                Quitar dominio
              </PButton>
            ) : null}
          </div>
          <div className="flex gap-2">
            <PButton onClick={onClose}>Cancelar</PButton>
            <PButton variant="primary" disabled={busy || !domain.trim()} onClick={() => void save(domain)}>
              Guardar
            </PButton>
          </div>
        </>
      }
    >
      {business ? (
        <div className="grid gap-4">
          <div className="text-p-muted">
            El menú de <b className="text-p-ink">{business.name}</b> se abrirá directamente en su dominio, por ejemplo <span className="font-mono">menu.sucafe.com</span>.
          </div>
          <div>
            <PLabel htmlFor="dm">Dominio</PLabel>
            <PInput id="dm" mono value={domain} onChange={(e) => setDomain(e.target.value.toLowerCase())} placeholder="menu.sucafe.com" />
          </div>
          <ol className="m-0 grid gap-2.5 pl-5 text-[13.5px] leading-normal">
            <li>
              En <b>Vercel</b> → tu proyecto → Settings → <b>Domains</b> → Add, escribe <span className="font-mono">{domain || "el dominio"}</span>.
            </li>
            <li>
              En el proveedor del dominio del cliente (GoDaddy, Hostinger, Cloudflare…) agrega el registro que te indique Vercel:
              <div className="mt-1.5 rounded-lg bg-p-row px-3 py-2 font-mono text-[12.5px]">
                {sub ? (
                  <>
                    CNAME · {domain.split(".")[0]} → cname.vercel-dns.com
                  </>
                ) : (
                  <>A · @ → 76.76.21.21</>
                )}
              </div>
            </li>
            <li>Guarda aquí. En cuanto el DNS se propague (minutos a unas horas) el menú abre en ese dominio.</li>
          </ol>
          <Help>El enlace /menu/{business.slug} sigue funcionando. Para mostrar el menú dentro de otra web, usa un iframe con esa dirección.</Help>
        </div>
      ) : null}
    </PanelDrawer>
  );
}

function ImportDrawer({
  business,
  onClose,
  askConfirm,
  onDone,
}: {
  business: BusinessSummary | undefined;
  onClose: () => void;
  askConfirm: (c: { title: string; text: string; label: string; run: () => Promise<void> }) => void;
  onDone: (r: { ok: boolean; error?: string; summary?: string }) => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const id = business?.id;
  useEffect(() => {
    setText("");
    setFileName("");
  }, [id]);

  const run = () => {
    if (!business) return;
    askConfirm({
      title: `¿Reemplazar el menú de “${business.name}”?`,
      text: "Se sustituyen sus categorías, productos, modificadores y promociones por los del archivo. Los pedidos y los accesos no cambian.",
      label: "Importar",
      run: async () => {
        setBusy(true);
        const r = await importMenuAction(business.id, text).catch(() => ({ ok: false as const, error: "Sin conexión." }));
        setBusy(false);
        onDone(r);
      },
    });
  };

  return (
    <PanelDrawer
      open={!!business}
      title="Importar menú"
      onClose={onClose}
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <PButton onClick={onClose}>Cancelar</PButton>
            <PButton variant="primary" disabled={busy || !text.trim()} onClick={run}>
              {busy ? "Importando…" : "Importar"}
            </PButton>
          </div>
        </>
      }
    >
      {business ? (
        <div className="grid gap-4">
          <div className="text-p-muted">
            Carga el archivo <span className="font-mono">.json</span> del menú de <b className="text-p-ink">{business.name}</b>.
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-p-input bg-p-row px-4 py-7 text-center hover:border-p-ink">
            <span className="font-semibold">{fileName || "Elegir archivo"}</span>
            <span className="text-[12.5px] text-p-muted">{fileName ? "Listo para importar" : "o pega el contenido abajo"}</span>
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setFileName(f.name);
                setText(await f.text());
              }}
            />
          </label>
          <textarea
            aria-label="Contenido del menú (JSON)"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFileName("");
            }}
            rows={8}
            spellCheck={false}
            placeholder='{ "categories": [...], "products": [...] }'
            className="w-full rounded-[10px] border border-p-input bg-white p-3 font-mono text-[12px] outline-none focus:border-p-ink"
          />
          <Help>Se revisa todo antes de guardar: si falta una categoría o un modificador, no se cambia nada y verás el error.</Help>
        </div>
      ) : null}
    </PanelDrawer>
  );
}
