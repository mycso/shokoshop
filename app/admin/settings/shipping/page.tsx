"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";

export default function ShippingSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    freeShippingThreshold: "5000",
    standardRate: "395",
    expressRate: "795",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Shipping Settings
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Configure your shipping rates and thresholds.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Free Shipping Threshold (pence)
            </label>
            <input
              type="number"
              min="0"
              value={form.freeShippingThreshold}
              onChange={(e) =>
                setForm({ ...form, freeShippingThreshold: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
            <p className="text-xs text-gray-400 mt-1">
              Orders above this amount get free shipping. 5000 = £50.00
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Standard Shipping Rate (pence)
            </label>
            <input
              type="number"
              min="0"
              value={form.standardRate}
              onChange={(e) =>
                setForm({ ...form, standardRate: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Express Shipping Rate (pence)
            </label>
            <input
              type="number"
              min="0"
              value={form.expressRate}
              onChange={(e) =>
                setForm({ ...form, expressRate: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
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
