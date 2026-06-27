"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SendToGelatoButton({ orderId, hasExisting = false }: { orderId: string; hasExisting?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSend() {
    setState("loading");
    try {
      const res = await fetch("/api/gelato/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, force: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to send to Gelato");
        setState("error");
      } else {
        setMessage(`Gelato order created: ${data.gelatoOrderId}`);
        setState("success");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-medium">
        <CheckCircle className="h-4 w-4 shrink-0" />
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSend}
        disabled={state === "loading"}
        className="flex items-center gap-2 bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {state === "loading" ? "Sending…" : hasExisting ? "Re-send to Gelato" : "Send to Gelato"}
      </button>
      {state === "error" && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}
