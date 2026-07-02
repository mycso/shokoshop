"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";

type Status = "loading" | "disabled" | "enabled";
type View = "idle" | "enrolling" | "backupCodes" | "disabling";

export default function AccountSecurityPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [view, setView] = useState<View>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Enrollment state
  const [secret, setSecret] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Disable state
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setStatus(data.user.twoFactorEnabled ? "enabled" : "disabled"))
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  async function startEnroll() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSecret(data.secret);
    setQrCodeDataUrl(data.qrCodeDataUrl);
    setView("enrolling");
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Incorrect code. Please try again.");
      return;
    }
    setBackupCodes(data.backupCodes);
    setStatus("enabled");
    setView("backupCodes");
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Incorrect password.");
      return;
    }
    setPassword("");
    setStatus("disabled");
    setView("idle");
  }

  function finishEnrollment() {
    setView("idle");
    setSecret("");
    setQrCodeDataUrl("");
    setCode("");
    setBackupCodes([]);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Security</h1>
      <p className="text-gray-500 mb-8">Manage two-factor authentication for your account</p>

      {status === "loading" && <div className="text-gray-400">Loading…</div>}

      {status !== "loading" && view === "idle" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-xl shrink-0 ${status === "enabled" ? "bg-green-50" : "bg-gray-100"}`}>
              {status === "enabled" ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldOff className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Two-factor authentication</p>
              <p className="text-sm text-gray-500">
                {status === "enabled" ? "Enabled — your account has an extra layer of protection" : "Not enabled"}
              </p>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          {status === "disabled" ? (
            <button
              onClick={startEnroll}
              disabled={loading}
              className="bg-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors text-sm"
            >
              {loading ? "Loading…" : "Enable two-factor authentication"}
            </button>
          ) : (
            <button
              onClick={() => {
                setError(null);
                setView("disabling");
              }}
              className="border border-red-200 text-red-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Disable two-factor authentication
            </button>
          )}
        </div>
      )}

      {view === "disabling" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-semibold text-gray-900 mb-1">Disable two-factor authentication</p>
          <p className="text-sm text-gray-500 mb-4">Confirm your password to continue.</p>
          <form onSubmit={confirmDisable} className="space-y-4">
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="Current password"
            />
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? "Disabling…" : "Disable"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassword("");
                  setError(null);
                  setView("idle");
                }}
                className="px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {view === "enrolling" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-semibold text-gray-900 mb-1">Scan this QR code</p>
          <p className="text-sm text-gray-500 mb-4">
            Use an authenticator app (Google Authenticator, Authy, 1Password, etc.) to scan the code below, or
            enter the setup key manually.
          </p>
          {qrCodeDataUrl && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- runtime-generated data URL */}
              <img src={qrCodeDataUrl} alt="Two-factor QR code" width={200} height={200} />
            </div>
          )}
          <p className="text-center text-xs text-gray-400 font-mono break-all mb-6">{secret}</p>

          <form onSubmit={confirmEnroll} className="space-y-4">
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="123456"
              maxLength={6}
            />
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? "Verifying…" : "Verify & enable"}
              </button>
              <button
                type="button"
                onClick={finishEnrollment}
                className="px-5 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {view === "backupCodes" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-semibold text-gray-900 mb-1">Save your backup codes</p>
          <p className="text-sm text-gray-500 mb-4">
            Each code can be used once to sign in if you lose access to your authenticator app. Save them
            somewhere safe — <span className="font-medium">they won&apos;t be shown again</span>.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 font-mono text-sm text-gray-800 mb-4">
            {backupCodes.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyBackupCodes}
              className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy codes"}
            </button>
            <button
              onClick={finishEnrollment}
              className="bg-brand text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors text-sm"
            >
              I&apos;ve saved these — done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
