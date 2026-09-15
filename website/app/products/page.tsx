import ProductListing from "@/components/ProductListing";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const resolved = await searchParams;
  return <ProductListing searchParams={resolved} />;
}
