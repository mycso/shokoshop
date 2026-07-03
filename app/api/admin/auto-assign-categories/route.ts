import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getGelatoProducts, GELATO_PRODUCTS_TAG } from "@/lib/gelato-data";
import { getOverrides, setOverride } from "@/lib/gelato-overrides";
import { detectCategories } from "@/lib/categories";

export async function POST() {
  try {
    const products = await getGelatoProducts();
    const overrides = await getOverrides();

    let assigned = 0;
    for (const p of products) {
      // Skip if already has a category
      const existing = overrides.find((o) => o.gelatoProductId === p.gelatoProductId);
      if (existing?.categories?.length || existing?.category) continue;

      const text = `${p.name} ${p.description ?? ""}`;
      const categories = detectCategories(text);
      if (categories.length === 0) continue;

      await setOverride({ gelatoProductId: p.gelatoProductId, categories });
      assigned++;
    }

    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ ok: true, assigned, total: products.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
