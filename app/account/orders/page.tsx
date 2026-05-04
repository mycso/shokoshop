import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";

export const metadata = {
  title: "My Orders – ShokoShop",
};

const DEMO_ORDERS = [
  {
    id: "ord_demo_001",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "shipped",
    total: 5998,
    itemCount: 2,
  },
  {
    id: "ord_demo_002",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered",
    total: 2999,
    itemCount: 1,
  },
  {
    id: "ord_demo_003",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "delivered",
    total: 7498,
    itemCount: 3,
  },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function OrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
      <p className="text-gray-500 mb-8">
        View and track all your previous orders.
      </p>

      {DEMO_ORDERS.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-indigo-600 font-medium hover:underline"
          >
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {DEMO_ORDERS.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-500">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Placed{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.itemCount}{" "}
                    {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
