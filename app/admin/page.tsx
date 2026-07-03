import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  ArrowRight,
  PackageX,
} from "lucide-react";
import { getAllOrders } from "@/lib/orders";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard – ShokoShop" };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  shipped: "bg-brand-light text-brand-dark",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

async function getActiveProductCount(): Promise<number> {
  const apiKey = process.env.GELATO_API_KEY;
  const storeId = process.env.GELATO_STORE_ID;
  if (!apiKey || !storeId) return 0;

  try {
    const res = await fetch(
      `https://ecommerce.gelatoapis.com/v1/stores/${storeId}/products?limit=100`,
      {
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const products: { status?: string }[] = data.products ?? [];
    return products.filter((p) => p.status !== "inactive" && p.status !== "deleted").length;
  } catch {
    return 0;
  }
}

function isRevenue(order: Order) {
  return order.status !== "pending" && order.status !== "cancelled";
}

async function getDashboardData() {
  const [orders, productCount] = await Promise.all([getAllOrders(), getActiveProductCount()]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const revenue = orders.filter(isRevenue).reduce((sum, o) => sum + o.total, 0);
  const ordersThisMonth = orders.filter((o) => new Date(o.createdAt) >= startOfMonth).length;
  const revenueThisMonth = orders
    .filter((o) => isRevenue(o) && new Date(o.createdAt) >= startOfMonth)
    .reduce((sum, o) => sum + o.total, 0);

  const firstOrderByEmail = new Map<string, number>();
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime();
    const existing = firstOrderByEmail.get(o.customerEmail);
    if (existing === undefined || t < existing) firstOrderByEmail.set(o.customerEmail, t);
  }
  const newCustomersThisWeek = Array.from(firstOrderByEmail.values()).filter(
    (t) => t >= sevenDaysAgo.getTime()
  ).length;

  return {
    totalOrders: orders.length,
    ordersThisMonth,
    revenue,
    revenueThisMonth,
    productCount,
    customerCount: firstOrderByEmail.size,
    newCustomersThisWeek,
    recentOrders: orders.slice(0, 5),
  };
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  const stats = [
    {
      label: "Total Orders",
      value: String(data.totalOrders),
      change: `+${data.ordersThisMonth} this month`,
      icon: ShoppingBag,
      color: "text-brand",
      bg: "bg-brand-light",
    },
    {
      label: "Revenue",
      value: formatPrice(data.revenue),
      change: `+${formatPrice(data.revenueThisMonth)} this month`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
    {
      label: "Products",
      value: String(data.productCount),
      change: "Active listings",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
      label: "Customers",
      value: String(data.customerCount),
      change: `+${data.newCustomersThisWeek} this week`,
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5 dark:text-gray-400">
            Manage your ShokoShop store
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
          <Link
            href="/admin/settings/gelato"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5 dark:bg-gray-900 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">{label}</p>
            <p className="text-xs text-green-600 mt-1 font-medium dark:text-green-400">{change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-brand hover:text-branddark flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400 font-mono dark:text-gray-500">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(order.total)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-gray-400 hover:text-brand dark:text-gray-500"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 mb-5 dark:text-white">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/admin/products", label: "Manage Products", icon: Package },
              { href: "/admin/orders", label: "View Orders", icon: ShoppingBag },
              { href: "/admin/customers", label: "Customers", icon: Users },
              { href: "/admin/returns", label: "Returns & Refunds", icon: PackageX },
              {
                href: "/admin/settings/gelato",
                label: "Gelato Settings",
                icon: Settings,
              },
              {
                href: "/admin/settings/payments",
                label: "Payment Settings",
                icon: DollarSign,
              },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group dark:hover:bg-gray-800"
              >
                <Icon className="h-4 w-4 text-gray-500 group-hover:text-brand transition-colors dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
                  {label}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-300 ml-auto group-hover:text-brand transition-colors dark:text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
