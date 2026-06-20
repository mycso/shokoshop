import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.resolve(process.cwd(), '.local-products.json');

export async function GET() {
  try {
    if (!fs.existsSync(DATA_PATH)) return NextResponse.json([]);
    const raw = await fs.promises.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(raw || '[]');
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
        : null;

    const item = {
      gelatoProductId: body.gelatoProductId,
      name: body.name || null,
      description: body.description || null,
      price: basePrice,
      variantPrices,
      images: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      category: body.category || "Imported",
      inStock: body.inStock !== undefined ? !!body.inStock : true,
      variants: Array.isArray(body.variants) ? body.variants : [],
      id: body.id || `local_${Date.now()}`,
      slug: body.slug || (body.name ? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, "-") : String(body.gelatoProductId)),
    };

    let list: any[] = [];
    if (fs.existsSync(DATA_PATH)) {
      const raw = await fs.promises.readFile(DATA_PATH, 'utf-8');
      list = JSON.parse(raw || '[]');
    }
    // Upsert: replace existing entry for same gelatoProductId, otherwise prepend
    const idx = list.findIndex((l: any) => l.gelatoProductId === item.gelatoProductId);
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    await fs.promises.writeFile(DATA_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { gelatoProductId, variantPrices } = body;
    if (!gelatoProductId) return NextResponse.json({ error: 'gelatoProductId required' }, { status: 400 });

    let list: any[] = [];
    if (fs.existsSync(DATA_PATH)) {
      const raw = await fs.promises.readFile(DATA_PATH, 'utf-8');
      list = JSON.parse(raw || '[]');
    }

    const idx = list.findIndex((l: any) => l.gelatoProductId === gelatoProductId);
    const vp: Record<string, number> = variantPrices ?? {};
    const vpValues = Object.values(vp) as number[];
    const price = vpValues.length > 0 ? Math.min(...vpValues) : (body.price ?? (idx >= 0 ? list[idx].price : 0));

    if (idx >= 0) {
      list[idx] = { ...list[idx], variantPrices: vp, price };
    } else {
      list.unshift({ gelatoProductId, variantPrices: vp, price, id: `local_${Date.now()}` });
    }

    await fs.promises.writeFile(DATA_PATH, JSON.stringify(list, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error) ? err.message : String(err) }, { status: 500 });
  }
}
