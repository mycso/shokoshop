const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

function normalize(list) {
  return list.map((p) => {
    const id = p.id || p.uid || p.productUid || String(Math.random()).slice(2);
    const name = p.name || p.title || p.productName || p.productUid || 'Untitled product';
    const description = p.description || p.longDescription || '';
    const category = p.categoryName || p.category || (p.tags && p.tags[0]) || 'Uncategorized';

    let images = [];
    if (Array.isArray(p.images) && p.images.length) images = p.images.map(i => typeof i === 'string' ? i : i.url || i.src).filter(Boolean);
    else if (Array.isArray(p.files) && p.files.length) images = p.files.map(f => f.url || f.src).filter(Boolean);
    else if (p.image) images = [p.image];

    let priceRaw = p.price || p.retailPrice || p.defaultPrice || p.minPrice || 0;
    if (!priceRaw && Array.isArray(p.prices) && p.prices[0]) priceRaw = p.prices[0].amount || p.prices[0].price || priceRaw;
    const priceIsCents = typeof priceRaw === 'number' && priceRaw > 1000;
    const price = Math.round((priceRaw || 0) * (priceIsCents ? 1 : 100));

    let variants = [];
    if (Array.isArray(p.variants) && p.variants.length) {
      variants = p.variants.map(v => ({ id: v.id || v.uid || v.sku, name: v.name || v.title || v.option || '', price: Math.round((v.price || priceRaw || 0) * (typeof (v.price || priceRaw) === 'number' && (v.price || priceRaw) > 1000 ? 1 : 100)) }));
    }

    const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return {
      id: String(id),
      slug,
      name,
      description,
      price,
      images: images.length ? images : ['/shokoshoplogo.svg'],
      category,
      inStock: p.available || p.inStock || true,
      variants,
      gelatoProductId: p.id || p.uid || p.productUid || null,
    };
  });
}

async function run() {
  const cfgPath = path.resolve(process.cwd(), '.gelato.config.json');
  let catalogUrl;
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8') || '{}');
    catalogUrl = cfg.catalogUrl;
  }

  let raw; let data;
  if (catalogUrl) {
    try {
      console.log('Fetching catalog from', catalogUrl);
      const res = await fetch(catalogUrl, { headers: { 'X-API-KEY': process.env.GELATO_API_KEY || '' } });
      if (!res.ok) {
        console.warn('Catalog fetch failed', res.status);
      } else {
        data = await res.json();
      }
    } catch (err) {
      console.warn('Catalog fetch error', err.message || err);
    }
  }

  if (!data) {
    console.log('Falling back to fixtures/gelato-sample.json');
    const fixture = path.resolve(process.cwd(), 'fixtures/gelato-sample.json');
    raw = fs.readFileSync(fixture, 'utf-8');
    data = JSON.parse(raw);
  }

  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data.products)) list = data.products;
  else if (Array.isArray(data.items)) list = data.items;
  else list = Array.isArray(data.results) ? data.results : [data];

  const normalized = normalize(list);

  console.log('Found', normalized.length, 'products — printing first 20:');
  console.log(normalized.slice(0,20).map(p => ({ id: p.id, name: p.name, slug: p.slug, price: p.price, images: p.images.slice(0,2) })));

  const search = normalized.filter(p => /michael|thriller/i.test(p.name + ' ' + (p.description || '')));
  console.log('\nSearch results for Michael/Thriller:', search.map(s => ({ id: s.id, name: s.name, gelatoProductId: s.gelatoProductId })));
}

run().catch(err => { console.error(err); process.exit(1); });
