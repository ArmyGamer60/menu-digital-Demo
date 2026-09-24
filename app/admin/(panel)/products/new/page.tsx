import { ProductEditor } from "@/components/dashboard/pages/ProductEditor";

export const metadata = { title: "Nuevo producto" };

export default function Page() {
  return <ProductEditor productId={null} />;
}
