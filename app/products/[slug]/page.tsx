import { notFound } from "next/navigation";
import Link from "next/link";
import ProductView from "./ProductView";
import { getGelatoProducts } from "@/lib/gelato-data";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchGelatoProduct(slug: string) {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) return null;

  const headers = { "Content-Type": "application/json", "X-API-KEY": GELATO_API_KEY };
  const fetchOpts = { headers, next: { revalidate: 60 } } as const;
  const base = `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}`;

  // Step 1: resolve slug → product id from list
  const listRes = await fetch(`${base}/products?limit=100`, fetchOpts);
  if (!listRes.ok) return null;
  const listData = await listRes.json();
  const list: any[] = Array.isArray(listData.products) ? listData.products : [];
  const p = list.find((item: any) => titleToSlug(item.title ?? item.name ?? "") === slug);
  if (!p) return null;

  // Step 2: fetch detail for accurate variant IDs — list endpoint may omit them
  // or use different id formats. gelato-sync.mjs keys variantImages by detail-endpoint IDs,
  // so we must use the same source here to ensure the lookup aligns.
  const detailRes = await fetch(`${base}/products/${p.id}`, fetchOpts);
  const detail = detailRes.ok ? await detailRes.json() : p;

  const name = p.title ?? p.name ?? "Untitled product";
  const productVariants: any[] = detail.variants ?? p.variants ?? [];

  // Parse variantOptions from each variant's title: "Color - Size - PrintType"
  // e.g. "White - S - DTG (Direct-to-garment)" → { Color: "White", Size: "S" }
  function parseVariantTitle(title: string): Record<string, string> {
    const parts = title.split(" - ");
    if (parts.length >= 2) {
      return { Color: parts[0].trim(), Size: parts[1].trim() };
    }
    return {};
  }

  // Build option values from ACTUAL variants only (not productVariantOptions which may list unavailable colours)
  const optionMap: Record<string, Set<string>> = {};
  const variantOptionMap: Record<string, Record<string, string>> = {};
  for (const v of productVariants) {
    const parsed = parseVariantTitle(v.title ?? "");
    variantOptionMap[v.id] = parsed;
    for (const [key, val] of Object.entries(parsed)) {
      if (!optionMap[key]) optionMap[key] = new Set();
      optionMap[key].add(val);
    }
  }

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  function sizeRank(v: string) {
    const i = SIZE_ORDER.indexOf(v.toUpperCase());
    return i === -1 ? 99 : i;
  }

  // Order: Color first, then Size
  const OPTION_ORDER = ["Color", "Size"];
  const productVariantOptions = Object.entries(optionMap)
    .sort(([a], [b]) => {
      return (OPTION_ORDER.indexOf(a) === -1 ? 99 : OPTION_ORDER.indexOf(a)) -
             (OPTION_ORDER.indexOf(b) === -1 ? 99 : OPTION_ORDER.indexOf(b));
    })
    .map(([optName, values]) => ({
      name: optName,
      values: optName === "Size"
        ? Array.from(values).sort((a, b) => sizeRank(a) - sizeRank(b))
        : Array.from(values),
    }));

  // Images: prefer locally-saved URLs (from sync-prices), fall back to API fields
  const apiImages: string[] = [];
  const seen = new Set<string>();
  function addImg(u: unknown) {
    if (typeof u === "string" && u.length > 0 && !seen.has(u)) {
      seen.add(u); apiImages.push(u);
    }
  }
  // Prefer detail fields (richer data) then fall back to list fields
  addImg(detail.previewUrl ?? p.previewUrl);
  addImg(detail.externalPreviewUrl ?? p.externalPreviewUrl);
  addImg(detail.externalThumbnailUrl ?? p.externalThumbnailUrl);

  // Merge prices and images from the live Gelato/admin-overrides cache
  let price = 0;
  let variantPrices: Record<string, number> = {};
  let variantImages: Record<string, string[]> = {};
  let images: string[] = apiImages;
  try {
    const local = await getGelatoProducts();
    const localMatch = local.find(
      (l) => l.gelatoProductId === p.id || titleToSlug(l.name ?? "") === slug
    );
    if (localMatch) {
      variantPrices = localMatch.variantPrices ?? {};
      variantImages = localMatch.variantImages ?? {};
      const vpValues = Object.values(variantPrices) as number[];
      price = vpValues.length > 0 ? Math.min(...vpValues) : (localMatch.price ?? 0);
      if ((localMatch.images ?? []).length > 0) images = localMatch.images;
    }
  } catch { /* ignore */ }

  if (images.length === 0) images = ["/shokoshoplogo.svg"];

  return {
    id: p.id,
    slug: titleToSlug(name),
    name,
    description: detail.description ?? p.description ?? "",
    price,
    images,
    category: productVariantOptions.map((o) => o.name).join(" / ") || "Apparel",
    inStock: true,
    variants: productVariants.map((v: any) => ({
      id: v.id,
      name: v.title,
      price: variantPrices[v.id] ?? price,
      sku: v.productUid ?? v.id,
      productUid: v.productUid,
      variantOptions: variantOptionMap[v.id] ?? {},
    })),
    productVariantOptions,
    variantPrices,
    variantImages, // variantId → per-colour mockup image URLs
    gelatoProductId: p.id,
    status: p.status,
  };
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchGelatoProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} – ShokoShop`,
    description: (product.description ?? "").replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchGelatoProduct(slug);
  if (!product) notFound();

  // Strip HTML from description for plain-text display (used in metadata only now)
  void product.description; // consumed by ProductView

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700">Products</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <ProductView product={product as any} />
    </div>
  );
}
