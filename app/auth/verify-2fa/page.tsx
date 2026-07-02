"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(useBackupCode ? { backupCode: code } : { code }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Incorrect code. Please try again.");
      setLoading(false);
      return;
    }
    router.push("/account");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Image src="/shokoshoplogo.svg" alt="ShokoShop" width={36} height={36} />
            <span className={`${bebas.className} text-2xl text-gray-900`}>ShokoShop</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-factor authentication</h1>
          <p className="text-gray-500 mt-1">
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                {useBackupCode ? "Backup code" : "Authentication code"}
              </label>
              <input
                id="code"
                type="text"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-light"
                placeholder={useBackupCode ? "XXXX-XXXX" : "123456"}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
                setError(null);
              }}
              className="text-brand font-medium hover:underline"
            >
              {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
            </button>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/auth/login" className="hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
