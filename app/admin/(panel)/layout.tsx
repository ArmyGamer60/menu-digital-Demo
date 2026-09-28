import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminProvider } from "@/components/dashboard/AdminProvider";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { NoBusiness } from "@/components/dashboard/NoBusiness";
import { sessionUser } from "@/lib/auth";
import { getBusinessRow, isDemoBusiness, listOrders } from "@/lib/repo";
import { activeBusinessId, businessesFor, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Panel — menu.app", template: "%s — Panel" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const list = await businessesFor(user);
  const activeId = await activeBusinessId(user, list);
  const row = activeId ? await getBusinessRow(activeId) : null;
  if (!row) {
    if (user.isSuperadmin) redirect("/admin/negocios");
    return <NoBusiness user={sessionUser(user)} />;
  }
  const orders = await listOrders(row.business.id);
  return (
    <AdminProvider
      user={sessionUser(user)}
      initialBusiness={row.business}
      initialOrders={orders}
      businesses={list.map((b) => ({ id: b.id, name: b.name, slug: b.slug, logoText: b.logoText, status: b.status }))}
      suspended={row.status === "suspended"}
      customDomain={row.customDomain}
      isDemo={isDemoBusiness(row.business.id)}
    >
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
