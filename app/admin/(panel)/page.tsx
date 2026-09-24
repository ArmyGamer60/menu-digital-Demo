import { OverviewPage } from "@/components/dashboard/pages/OverviewPage";

// El template del layout no aplica a la página del mismo segmento.
export const metadata = { title: { absolute: "Overview — Panel" } };

export default function Page() {
  return <OverviewPage />;
}
