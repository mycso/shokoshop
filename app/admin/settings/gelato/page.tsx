"use client";

import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";

export default function GelatoSettingsPage() {
  const [form, setForm] = useState({
    apiKey: "",
    storeId: "",
    webhookSecret: "",
    defaultShipmentMethod: "standard",
  });
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Gelato Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Configure your Gelato API integration for print-on-demand fulfilment.
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="whsec_xxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Webhook endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/api/gelato/webhook</code>
            </p>
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
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
