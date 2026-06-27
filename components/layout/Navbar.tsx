"use client";

import Link from "next/link";
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { Bebas_Neue } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { CATEGORIES } from "@/lib/categories";

const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });

export default function Navbar() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setLoggedIn(false);
    setMobileOpen(false);
    router.push("/auth/login");
  }

  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/returns", label: "My Returns" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/shokoshoplogo.svg"
              alt="ShokoShop logo"
              className="h-8 w-8 object-contain"
            />
            <span className={`${bebas.className} text-xl font-bold text-gray-900`}>ShokoShop</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* Categories dropdown */}
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen((o) => !o)}
                onBlur={(e) => { if (!catRef.current?.contains(e.relatedTarget as Node)) setCatOpen(false); }}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Categories <ChevronDown className={`h-3.5 w-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
              </button>
              {catOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${encodeURIComponent(cat.label)}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
            {loggedIn ? (
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4" />
                Account
              </Link>
            )}
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              ))}
              {/* Categories accordion */}
              <button
                onClick={() => setMobileCatOpen((o) => !o)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileCatOpen && (
                <div className="pl-4 flex flex-col gap-0.5">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${encodeURIComponent(cat.label)}`}
                      onClick={() => { setMobileOpen(false); setMobileCatOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
              {loggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Account
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
