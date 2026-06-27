"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, PackageX, User, LogOut, ChevronRight } from "lucide-react";

const MENU = [
  {
    href: "/account/orders",
    icon: Package,
    label: "My Orders",
    desc: "View and track your orders",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    href: "/account/returns",
    icon: PackageX,
    label: "Returns & Refunds",
    desc: "Manage return requests",
    color: "text-red-500",
    bg: "bg-red-50",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setUser(data.user); setLoading(false); })
      .catch(() => { router.replace("/auth/login"); });
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/auth/login");
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center shrink-0">
          <User className="h-7 w-7 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name ?? "My Account"}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {MENU.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group"
          >
            <div className={`p-3 rounded-xl ${bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand transition-colors shrink-0" />
          </Link>
        ))}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group text-left"
        >
          <div className="p-3 rounded-xl bg-gray-100 shrink-0">
            <LogOut className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Sign Out</p>
            <p className="text-sm text-gray-500">Sign out of your account</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors shrink-0" />
        </button>
      </div>
    </div>
  );
}
