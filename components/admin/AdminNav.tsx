"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bebas_Neue } from "next/font/google";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  PackageX,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";

const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/returns", label: "Returns", icon: PackageX },
];

const SETTINGS_LINKS = [
  { href: "/admin/settings/gelato", label: "Gelato" },
  { href: "/admin/settings/payments", label: "Payments" },
  { href: "/admin/settings/shipping", label: "Shipping" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsActive = pathname.startsWith("/admin/settings");

  if (pathname === "/admin/login") return null;

  async function handleSignOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <img
              src="/shokoshoplogo.svg"
              alt="ShokoShop logo"
              className="h-8 w-8 object-contain dark:invert"
            />
            <span className={`${bebas.className} text-xl font-bold text-gray-900 dark:text-white`}>
              ShokoShop <span className="text-brand">Admin</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  isActive(pathname, href)
                    ? "bg-brand-light text-brand"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="relative">
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                onBlur={(e) => {
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setSettingsOpen(false);
                }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  settingsActive
                    ? "bg-brand-light text-brand"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1.5 z-50">
                  {SETTINGS_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSettingsOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X className="h-5 w-5 dark:text-gray-200" /> : <Menu className="h-5 w-5 dark:text-gray-200" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(pathname, href)
                      ? "bg-brand-light text-brand"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  settingsActive
                    ? "bg-brand-light text-brand"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              </button>
              {settingsOpen && (
                <div className="pl-9 flex flex-col gap-0.5">
                  {SETTINGS_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => { setMobileOpen(false); setSettingsOpen(false); }}
                      className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 text-left"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
