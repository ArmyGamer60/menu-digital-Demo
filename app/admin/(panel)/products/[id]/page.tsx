import { ProductEditor } from "@/components/dashboard/pages/ProductEditor";

export const metadata = { title: "Editar producto" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor key={id} productId={decodeURIComponent(id)} />;
}
