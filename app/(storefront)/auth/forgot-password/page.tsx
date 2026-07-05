"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Image src="/shokoshoplogo.svg" alt="ShokoShop" width={36} height={36} className="dark:invert" />
            <span className={`${bebas.className} text-2xl text-gray-900 dark:text-white`}>ShokoShop</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">We&apos;ll email you a link to reset it</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 dark:bg-gray-900 dark:border-gray-800">
          {submitted ? (
            <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
              password reset link. Please check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-200">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link href="/auth/login" className="text-brand font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
