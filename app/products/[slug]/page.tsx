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

  // Fetch prices and images from the cache FIRST so we can filter unavailable variants
  let price = 0;
  let variantPrices: Record<string, number> = {};
  let variantImages: Record<string, string[]> = {};

  // Images: prefer locally-saved URLs (from sync-prices), fall back to API fields
  const apiImages: string[] = [];
  const seen = new Set<string>();
  function addImg(u: unknown) {
    if (typeof u === "string" && u.length > 0 && !seen.has(u)) {
      seen.add(u); apiImages.push(u);
    }
  }
  addImg(detail.previewUrl ?? p.previewUrl);
  addImg(detail.externalPreviewUrl ?? p.externalPreviewUrl);
  addImg(detail.externalThumbnailUrl ?? p.externalThumbnailUrl);

  let images: string[] = apiImages;
  try {
    const local = await getGelatoProducts();
    const localMatch = local.find(
      (l) => l.gelatoProductId === p.id || titleToSlug(l.name ?? "") === slug
    );
    if (localMatch) {
      variantPrices = localMatch.variantPrices ?? {};
      variantImages = localMatch.variantImages ?? {};
      const vpValues = (Object.values(variantPrices) as number[]).filter((n) => n > 0);
      price = vpValues.length > 0 ? Math.min(...vpValues) : (localMatch.price ?? 0);
      if ((localMatch.images ?? []).length > 0) images = localMatch.images;
    }
  } catch { /* ignore */ }

  // Add ALL non-primary productImages from the live Gelato API to product.images
  // so they appear in the carousel for every colour, not just the one that Gelato
  // has them scoped to (Gelato resets productVariantIds to a single colour after
  // every dashboard save). The updated imageKey in ProductView extracts the shared
  // UUID from both blob URLs and signed Gelato CDN URLs so the carousel's seen-set
  // correctly treats them as the same image and never shows a duplicate.
  {
    // stableId mirrors persistImageToBlob's stableImageName: extracts the UUID
    // from Gelato CDN URLs, or the blob inner path for existing proxy URLs.
    const stableId = (u: string): string => {
      try {
        const p = new URL(u, "http://localhost");
        if (p.pathname === "/api/blob-image") {
          const inner = p.searchParams.get("path") ?? "";
          const m = inner.match(/gelato-previews\/([a-f0-9-]+)/i);
          return m ? m[1] : inner;
        }
        const m = p.pathname.match(/store_product_image\/([a-f0-9-]+)/i);
        if (m) return m[1];
        return p.pathname;
      } catch { return u.split("?")[0]; }
    };

    // Build covered-ID set from images already gathered (sync blob URLs + apiImages)
    const covered = new Set<string>([
      ...images.map(stableId),
      ...Object.values(variantImages).flat().map(stableId),
    ]);

    const extras: string[] = [];
    for (const img of (detail.productImages ?? []) as any[]) {
      const url: string = img.fileUrl ?? img.url ?? img.previewUrl ?? "";
      if (!url || img.isPrimary) continue;
      const id = stableId(url);
      if (!covered.has(id)) { covered.add(id); extras.push(url); }
    }
    if (extras.length > 0) images = [...images, ...extras];

    // Also fill variantImages for any variant the sync left empty, so colour-
    // specific step in the carousel has something to show (new products, etc.).
    if (extras.length > 0 || Object.keys(variantImages).length === 0) {
      const merged: Record<string, string[]> = { ...variantImages };
      for (const v of productVariants) {
        if (!merged[v.id] || merged[v.id].length === 0) {
          merged[v.id] = extras.length > 0 ? extras : [];
        }
      }
      variantImages = merged;
    }
  }

  // Use the API's productVariantOptions to determine option names in order,
  // then parse each variant title by splitting on " - " and matching positionally.
  // e.g. apparel: options=["Color","Size"], title="White - M - DTG" → {Color:"White",Size:"M"}
  // e.g. poster:  options=["Size","Coating"],  title="30x40 cm - Matte"  → {Size:"30x40 cm",Coating:"Matte"}
  const apiOptionNames: string[] = (detail.productVariantOptions ?? []).map((o: any) => String(o.name));

  function parseVariantTitle(title: string): Record<string, string> {
    const parts = title.split(" - ");
    if (apiOptionNames.length > 0) {
      const result: Record<string, string> = {};
      apiOptionNames.forEach((name, i) => {
        if (parts[i] !== undefined) result[name] = parts[i].trim();
      });
      return result;
    }
    // Fallback when API doesn't return option names
    if (parts.length >= 2) return { Color: parts[0].trim(), Size: parts[1].trim() };
    return {};
  }

  const hasPriceData = Object.keys(variantPrices).length > 0;

  // Build option values — skip variants with an explicit price of 0 (unavailable)
  const optionMap: Record<string, Set<string>> = {};
  const variantOptionMap: Record<string, Record<string, string>> = {};
  for (const v of productVariants) {
    const parsed = parseVariantTitle(v.title ?? "");
    variantOptionMap[v.id] = parsed;
    // If we have price data and this variant is explicitly £0, exclude it from options
    if (hasPriceData && (variantPrices[v.id] ?? -1) === 0) continue;
    for (const [key, val] of Object.entries(parsed)) {
      if (!optionMap[key]) optionMap[key] = new Set();
      optionMap[key].add(val);
    }
  }

  const APPAREL_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  function sizeRank(v: string) {
    const i = APPAREL_SIZE_ORDER.indexOf(v.toUpperCase());
    if (i !== -1) return i;
    // Dimension sort for poster sizes like "21x29.7 cm", "30x40 cm" — sort by area
    const dim = v.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
    if (dim) return parseFloat(dim[1]) * parseFloat(dim[2]);
    return 99;
  }

  // Preserve the API's declared option order; fall back to Color-first for apparel
  const OPTION_ORDER = apiOptionNames.length > 0 ? apiOptionNames : ["Color", "Size"];
  const productVariantOptions = Object.entries(optionMap)
    .sort(([a], [b]) => {
      const ai = OPTION_ORDER.indexOf(a); const bi = OPTION_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([optName, values]) => ({
      name: optName,
      values: Array.from(values).sort((a, b) => sizeRank(a) - sizeRank(b)),
    }));

  if (images.length === 0) images = ["/shokoshoplogo.svg"];

  return {
    id: p.id,
    slug: titleToSlug(name),
    name,
    description: detail.description ?? p.description ?? "",
    price,
    images,
    category: productVariantOptions.map((o) => o.name).join(" / ") || "Apparel",
    inStock: productVariants.some((v: any) => v.connectionStatus === "connected"),
    variants: productVariants
      .filter((v: any) => !hasPriceData || (variantPrices[v.id] ?? -1) !== 0)
      .map((v: any) => ({
        id: v.id,
        name: v.title,
        price: variantPrices[v.id] ?? price,
        sku: v.productUid ?? v.id,
        productUid: v.productUid,
        variantOptions: variantOptionMap[v.id] ?? {},
        inStock: v.connectionStatus === "connected",
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
