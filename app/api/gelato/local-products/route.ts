import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getGelatoProducts, GELATO_PRODUCTS_TAG } from "@/lib/gelato-data";
import { setOverride } from "@/lib/gelato-overrides";

export async function GET() {
  try {
    const items = await getGelatoProducts();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const variantPrices: Record<string, number> = {};
    if (body.variantPrices && typeof body.variantPrices === "object") {
      for (const [k, v] of Object.entries(body.variantPrices)) {
        if (typeof v === "number") variantPrices[k] = v;
      }
    }
    const vpValues = Object.values(variantPrices) as number[];
    const basePrice =
      vpValues.length > 0
        ? Math.min(...vpValues)
        : typeof body.price === "number"
        ? body.price
        : 0;

    const item = {
      gelatoProductId: body.gelatoProductId,
      name: body.name || undefined,
      description: body.description || undefined,
      price: basePrice,
      variantPrices,
      images: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      category: body.category || "Imported",
      inStock: body.inStock !== undefined ? !!body.inStock : true,
      variants: Array.isArray(body.variants) ? body.variants : [],
      id: body.id || `local_${Date.now()}`,
      slug: body.slug || (body.name ? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, "-") : String(body.gelatoProductId)),
    };

    await setOverride(item);
    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { gelatoProductId, variantPrices } = body;
    if (!gelatoProductId) return NextResponse.json({ error: "gelatoProductId required" }, { status: 400 });

    const vp: Record<string, number> = variantPrices ?? {};
    const vpValues = Object.values(vp) as number[];
    const price = vpValues.length > 0 ? Math.min(...vpValues) : (body.price ?? 0);
    const category = body.category ? String(body.category) : undefined;
    const designFilename = body.designFilename ? String(body.designFilename) : undefined;

    await setOverride({ gelatoProductId, variantPrices: vp, price, ...(category ? { category } : {}), ...(designFilename ? { designFilename } : {}) });
    revalidateTag(GELATO_PRODUCTS_TAG, { expire: 0 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}
