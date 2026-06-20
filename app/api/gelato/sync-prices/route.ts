import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const API_KEY = process.env.GELATO_API_KEY!;
const STORE_ID = process.env.GELATO_STORE_ID!;
const BASE = `https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}`;
const HEADERS = { "X-API-KEY": API_KEY, "Content-Type": "application/json" };

async function gelatoGet(url: string) {
  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function getGbpRate(): Promise<number> {
  try {
    const data = await fetch("https://api.exchangerate-api.com/v4/latest/EUR").then(r => r.json());
    return data.rates?.GBP ?? 0.864;
  } catch {
    return 0.864;
  }
}

export async function POST() {
  if (!API_KEY || !STORE_ID) {
    return NextResponse.json({ error: "Gelato not configured" }, { status: 500 });
  }

  try {
    const gbpRate = await getGbpRate();

    const localPath = path.resolve(process.cwd(), ".local-products.json");
    let existing: any[] = [];
    try {
      if (fs.existsSync(localPath)) {
        existing = JSON.parse(fs.readFileSync(localPath, "utf-8") || "[]");
      }
    } catch { /* ignore */ }

    const { products = [] } = await gelatoGet(`${BASE}/products?limit=100`);
    const results: any[] = [];
    const log: string[] = [];

    for (const product of products) {
      const pid = product.id;
      const name = product.title ?? product.name ?? "Untitled";
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const detail = await gelatoGet(`${BASE}/products/${pid}`);
      const variants: any[] = detail.variants ?? [];

      const existingEntry = existing.find((e: any) => e.gelatoProductId === pid);
      const existingVP: Record<string, number> = existingEntry?.variantPrices ?? {};
      const missing = variants.filter(v => !(v.id in existingVP));

      if (missing.length === 0 && Object.keys(existingVP).length > 0) {
        results.push(existingEntry);
        log.push(`${name}: already priced, skipped`);
        continue;
      }

      const variantPrices: Record<string, number> = { ...existingVP };
      for (const v of variants) {
        if (v.id in variantPrices) continue;
        const vdata = await gelatoGet(`${BASE}/products/${pid}/variants/${v.id}`);
        const priceEur = vdata.price ?? 0;
        variantPrices[v.id] = Math.round(priceEur * gbpRate * 100);
      }

      const minPrice = Math.min(...Object.values(variantPrices));
      results.push({ gelatoProductId: pid, name, slug, price: minPrice, variantPrices });
      log.push(`${name}: synced ${Object.keys(variantPrices).length} variants, from £${(minPrice / 100).toFixed(2)}`);
    }

    fs.writeFileSync(localPath, JSON.stringify(results, null, 2));

    return NextResponse.json({ ok: true, synced: results.length, log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
