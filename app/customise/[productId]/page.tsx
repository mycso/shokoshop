import { notFound } from "next/navigation";
import CustomiseClient from "./CustomiseClient";
import { Product } from "@/types";

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID;

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseVariantTitle(title: string): Record<string, string> {
  const parts = title.split(" - ");
  if (parts.length >= 2) return { Color: parts[0].trim(), Size: parts[1].trim() };
  return {};
}

async function fetchGelatoProduct(productId: string): Promise<Product | null> {
  if (!GELATO_API_KEY || !GELATO_STORE_ID) return null;

  const res = await fetch(
    `https://ecommerce.gelatoapis.com/v1/stores/${GELATO_STORE_ID}/products/${productId}`,
    {
      headers: { "Content-Type": "application/json", "X-API-KEY": GELATO_API_KEY },
      next: { revalidate: 60 },
    }
  );
  if (!res.ok) return null;

  const p = await res.json();

  const name: string = p.title ?? p.name ?? "Untitled product";
  const productVariants: any[] = p.variants ?? [];

  const variantOptionMap: Record<string, Record<string, string>> = {};
  for (const v of productVariants) {
    variantOptionMap[v.id] = parseVariantTitle(v.title ?? "");
  }

  const images: string[] = [];
  const seen = new Set<string>();
  function addImg(u: unknown) {
    if (typeof u === "string" && u.length > 0 && !seen.has(u)) {
      seen.add(u); images.push(u);
    }
  }
  addImg(p.previewUrl);
  addImg(p.externalPreviewUrl);
  addImg(p.externalThumbnailUrl);
  if (images.length === 0) images.push("/shokoshoplogo.svg");

  return {
    id: p.id,
    slug: titleToSlug(name),
    name,
    description: (p.description ?? "").replace(/<[^>]+>/g, ""),
    price: 0,
    images,
    category: "Print on Demand",
    inStock: true,
    variants: productVariants.map((v: any) => ({
      id: v.id,
      name: v.title,
      price: 0,
      sku: v.productUid ?? v.id,
      variantOptions: variantOptionMap[v.id] ?? {},
    })),
    gelatoProductId: p.id,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await fetchGelatoProduct(productId);
  if (!product) return {};
  return { title: `Customise ${product.name} – ShokoShop` };
}

export default async function CustomisePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await fetchGelatoProduct(productId);
  if (!product) notFound();

  return <CustomiseClient product={product} />;
}
