import ProductListing from "@/components/ProductListing";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  return <ProductListing categorySlug={resolvedParams.slug} searchParams={resolvedSearchParams} />;
}
