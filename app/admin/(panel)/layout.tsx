import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminProvider } from "@/components/dashboard/AdminProvider";
import { AdminShell } from "@/components/dashboard/AdminShell";
import { SESSION_COOKIE, sessionUser, verifySession } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Panel — menu.app", template: "%s — Panel" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  // El middleware ya protege /admin/*; esto cubre accesos sin middleware (p. ej. tests).
  const email = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!email) redirect("/admin/login");
  return (
    <AdminProvider user={sessionUser(email)}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
