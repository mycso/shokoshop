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
} from "lucide-react";

export const metadata = { title: "Admin Dashboard – ShokoShop" };

const STATS = [
  {
    label: "Total Orders",
    value: "128",
    change: "+12% this month",
    icon: ShoppingBag,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Revenue",
    value: "£3,842",
    change: "+8% this month",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Products",
    value: "6",
    change: "Active listings",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Customers",
    value: "94",
    change: "+5 this week",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const RECENT_ORDERS = [
  { id: "ord_demo_001", customer: "Jane Smith", status: "shipped", total: 5998 },
  { id: "ord_demo_002", customer: "John Doe", status: "processing", total: 2999 },
  { id: "ord_demo_003", customer: "Alice Brown", status: "delivered", total: 7498 },
];

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your ShokoShop store
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
          <Link
            href="/admin/settings/gelato"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <TrendingUp className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">{change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_ORDERS.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customer}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      order.status === "shipped"
                        ? "bg-indigo-100 text-indigo-700"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/admin/products", label: "Manage Products", icon: Package },
              { href: "/admin/orders", label: "View Orders", icon: ShoppingBag },
              { href: "/admin/customers", label: "Customers", icon: Users },
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
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <Icon className="h-4 w-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {label}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-300 ml-auto group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
