import type { Metadata } from "next";
import { PlatformPage } from "@/components/dashboard/platform/PlatformPage";
import { sessionUser } from "@/lib/auth";
import { listBusinessSummaries } from "@/lib/repo";
import { activeBusinessId, requireSuperadmin } from "@/lib/session";

export const metadata: Metadata = { title: "Negocios — Panel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NegociosPage() {
  const user = await requireSuperadmin();
  const businesses = await listBusinessSummaries();
  return <PlatformPage user={sessionUser(user)} businesses={businesses} activeId={await activeBusinessId(user, businesses)} />;
}
