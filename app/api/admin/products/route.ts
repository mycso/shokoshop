import { unstable_cache } from "next/cache";
import { GELATO_PRODUCTS_TAG, getGelatoProducts } from "@/lib/gelato-data";

const API_KEY  = process.env.GELATO_API_KEY!;
const STORE_ID = process.env.GELATO_STORE_ID!;

/**
 * Gelato product list (id, title, status, thumbnail) — cached with the same
 * tag as getGelatoProducts so the webhook invalidates both together.
 */
const getStoreProductList = unstable_cache(
  async () => {
    const res = await fetch(
      `https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}/products?limit=100&order=desc&orderBy=createdAt`,
      { headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []) as any[];
  },
  ["admin-product-list"],
  { tags: [GELATO_PRODUCTS_TAG], revalidate: 3600 }
);

/**
 * Single endpoint for the admin products list page.
 * Merges live Gelato status/thumbnail with cached local prices and category.
 * Both sources are Next.js Data Cache — cache miss only on first load or after
 * the product webhook fires revalidateTag(GELATO_PRODUCTS_TAG).
 */
export async function GET() {
  try {
    const [storeList, localProducts] = await Promise.all([
      getStoreProductList(),
      getGelatoProducts(),
    ]);

    function toSlug(name: string) {
      return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    const products = storeList.map((p: any) => {
      const name: string = p.title ?? p.name ?? "Untitled";
      const slug = toSlug(name);
      const local = localProducts.find(
        (l) => l.gelatoProductId === p.id || (l as any).slug === slug
      );
      const variantPrices: Record<string, number> = local?.variantPrices ?? {};
      const vals = Object.values(variantPrices) as number[];
      let price = vals.length > 0 ? Math.min(...vals) : (local?.price ?? 0);

      if (price === 0) {
        const eurPrices: number[] = (p.variants ?? [])
          .map((v: any) => v.price ?? v.retailPrice ?? 0)
          .filter((n: number) => n > 0);
        const minEur = eurPrices.length > 0 ? Math.min(...eurPrices) : (p.price ?? p.retailPrice ?? 0);
        if (minEur > 0) price = Math.round(minEur * 0.86 * 100);
      }

      return {
        id: p.id,
        name,
        slug,
        status: p.status ?? "unknown",
        price,
        category: local?.category ?? (p as any).category ?? "",
        thumbnail: p.previewUrl ?? p.externalPreviewUrl ?? p.externalThumbnailUrl ?? null,
      };
    });

    return Response.json({ products });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
