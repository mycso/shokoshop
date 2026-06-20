"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";

export default function GelatoSettingsPage() {
  const [form, setForm] = useState({
    apiKey: "",
    storeId: "",
    webhookSecret: "",
    defaultShipmentMethod: "standard",
    catalogUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [manual, setManual] = useState({ gelatoProductId: '', name: '', image: '', price: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // save via API
    try {
      const res = await fetch('/api/gelato/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogUrl: form.catalogUrl }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Failed to save Gelato config', await res.text());
      }
    } catch (err) {
      console.error('Failed to save Gelato config', err);
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/gelato/local-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gelatoProductId: manual.gelatoProductId,
          name: manual.name,
          image: manual.image,
          price: manual.price ? Number(manual.price) : undefined,
        }),
      });
      if (res.ok) {
        setManual({ gelatoProductId: '', name: '', image: '', price: '' });
        alert('Product saved locally — it will appear on /products');
      } else {
        alert('Failed to save product');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gelato Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
  Configure your Gelato API integration for production & fulfilment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gelato API Key
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="gel_live_xxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Find your API key in the Gelato dashboard under API Access.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Store ID
            </label>
            <input
              type="text"
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="your-store-id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Webhook Secret
            </label>
            <input
              type="password"
              value={form.webhookSecret}
              onChange={(e) =>
                setForm({ ...form, webhookSecret: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="whsec_xxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Webhook endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/api/gelato/webhook</code>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gelato Catalog URL
            </label>
            <input
              type="text"
              value={form.catalogUrl}
              onChange={(e) => setForm({ ...form, catalogUrl: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="https://catalog.gelatoapis.com/v1/your-account/products"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Optional: paste your account-specific Gelato catalog URL here so the site can fetch your exact products.
            </p>
          </div>
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Quick add product (manual)</h3>
            <form onSubmit={handleAddManual} className="space-y-3">
              <div>
                <input value={manual.gelatoProductId} onChange={(e) => setManual({ ...manual, gelatoProductId: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Product UID (e.g. apparel_product_...)" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Name (optional)" />
                <input value={manual.image} onChange={(e) => setManual({ ...manual, image: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Image URL (optional)" />
              </div>
              <div className="flex items-center gap-2">
                <input value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} className="w-32 border rounded-xl px-3 py-2 text-sm" placeholder="Price (cents)" />
                <button type="submit" className="bg-brand text-white px-4 py-2 rounded-xl text-sm">Add to local products</button>
              </div>
            </form>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Default Shipment Method
            </label>
            <select
              value={form.defaultShipmentMethod}
              onChange={(e) =>
                setForm({ ...form, defaultShipmentMethod: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
