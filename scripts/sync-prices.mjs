/**
 * sync-prices.mjs
 * Pre-warms the Blob image cache for every product/variant in your Gelato
 * store ahead of a deploy, so the first real visitor never pays the
 * download+upload latency for a brand-new preview image.
 *
 * Pricing and the product catalog itself are no longer cached to a local
 * file — the live site fetches them through lib/gelato-data.ts (an
 * unstable_cache wrapper, invalidated by the Gelato product webhook), which
 * works correctly on Vercel's read-only production filesystem. This script
 * is purely a deploy-time optimization, not a required step.
 *
 * Usage:  node scripts/sync-prices.mjs
 *   or:   npm run sync-prices
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchAllProductsWithPricesAndImages } from "../lib/gelato-sync.mjs";

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

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("❌  BLOB_READ_WRITE_TOKEN must be set in .env");
  process.exit(1);
}

async function main() {
  console.log("🔄  Pre-warming Gelato product images on Blob…\n");

  const results = await fetchAllProductsWithPricesAndImages({
    apiKey: API_KEY,
    storeId: STORE_ID,
    onLog: (msg) => console.log(msg),
  });

  console.log(`\n✅  Pre-warmed ${results.length} product(s).`);
}

main().catch((err) => {
  console.warn("⚠️  Gelato pre-warm failed (non-fatal — the live site fetches its own data):", err.message);
  process.exit(0);
});
