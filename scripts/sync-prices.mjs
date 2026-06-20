/**
 * sync-prices.mjs
 * Fetches real retail prices for every product/variant in your Gelato store
 * and writes them to .local-products.json.
 *
 * Usage:  node scripts/sync-prices.mjs
 *   or:   npm run sync-prices
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env manually (Next.js doesn't load it for plain node scripts)
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const API_KEY = process.env.GELATO_API_KEY;
const STORE_ID = process.env.GELATO_STORE_ID;

if (!API_KEY || !STORE_ID) {
  console.error("❌  GELATO_API_KEY and GELATO_STORE_ID must be set in .env");
  process.exit(1);
}

const HEADERS = { "X-API-KEY": API_KEY, "Content-Type": "application/json" };
const BASE = `https://ecommerce.gelatoapis.com/v1/stores/${STORE_ID}`;

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function getGbpRate() {
  try {
    const data = await fetch("https://api.exchangerate-api.com/v4/latest/EUR").then(r => r.json());
    return data.rates.GBP ?? 0.864;
  } catch {
    console.warn("⚠️  Could not fetch exchange rate, using fallback 0.864");
    return 0.864;
  }
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("🔄  Syncing Gelato prices…\n");

  const gbpRate = await getGbpRate();
  console.log(`EUR → GBP rate: ${gbpRate}\n`);

  // Load existing local products so we can merge (preserve manual overrides)
  const localPath = path.join(ROOT, ".local-products.json");
  let existing = [];
  try {
    if (fs.existsSync(localPath)) {
      existing = JSON.parse(fs.readFileSync(localPath, "utf-8") || "[]");
    }
  } catch { /* ignore */ }

  // Fetch all store products
  const { products = [] } = await get(`${BASE}/products?limit=100`);
  console.log(`Found ${products.length} product(s) in store.\n`);

  const results = [];

  for (const product of products) {
    const pid = product.id;
    const name = product.title ?? product.name ?? "Untitled";
    const slug = toSlug(name);

    console.log(`📦  ${name}`);

    // Get full detail for variants list
    const detail = await get(`${BASE}/products/${pid}`);
    const variants = detail.variants ?? [];

    // Collect images from the detail response
    const images = [];
    for (const field of ["previewUrl", "externalPreviewUrl", "externalThumbnailUrl"]) {
      const url = detail[field];
      if (typeof url === "string" && url.length > 0 && !images.includes(url)) {
        images.push(url);
      }
    }

    // Check if we already have prices for all variants (skip re-fetch if so)
    const existingEntry = existing.find(e => e.gelatoProductId === pid);
    const existingVP = existingEntry?.variantPrices ?? {};
    const missingVariants = variants.filter(v => !(v.id in existingVP));

    if (missingVariants.length === 0 && Object.keys(existingVP).length > 0) {
      console.log(`  ✅ Already priced (${variants.length} variants) — skipping\n`);
      results.push({ ...existingEntry, images });
      continue;
    }

    // Fetch price per variant
    const variantPrices = { ...existingVP };
    for (const v of variants) {
      if (v.id in variantPrices) continue; // don't overwrite existing
      const vdata = await get(`${BASE}/products/${pid}/variants/${v.id}`);
      const priceEur = vdata.price ?? 0;
      const priceGbpPence = Math.round(priceEur * gbpRate * 100);
      console.log(`  ${vdata.title ?? v.id}: EUR ${priceEur} → ${priceGbpPence}p (£${(priceGbpPence/100).toFixed(2)})`);
      variantPrices[v.id] = priceGbpPence;
    }

    const minPrice = Math.min(...Object.values(variantPrices));

    results.push({
      gelatoProductId: pid,
      name,
      slug,
      price: minPrice,
      variantPrices,
      images,
    });
    console.log(`  → From £${(minPrice / 100).toFixed(2)}\n`);
  }

  fs.writeFileSync(localPath, JSON.stringify(results, null, 2));
  console.log(`✅  Saved ${results.length} product(s) to .local-products.json`);
}

main().catch(err => {
  console.error("❌ ", err.message);
  process.exit(1);
});
