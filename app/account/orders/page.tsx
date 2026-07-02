import Link from "next/link";
import { Package, ChevronRight, Search } from "lucide-react";
import { getOrdersByEmail } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "My Orders – ShokoShop",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 10;

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function pageHref(q: string | undefined, status: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/account/orders${qs ? `?${qs}` : ""}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const user = await getCurrentUser();
  const allOrders = user ? await getOrdersByEmail(user.email) : []; // newest first

  const filtered = allOrders.filter((order) => {
    if (status && order.status !== status) return false;
    if (q) {
      const query = q.trim().toLowerCase();
      const displayId = order.id.slice(-8).toLowerCase();
      const matchesItem = order.items.some((item) => item.name.toLowerCase().includes(query));
      if (
        !order.id.toLowerCase().includes(query) &&
        !displayId.includes(query) &&
        !matchesItem
      ) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
      <p className="text-gray-500 mb-8">
        View and track all your previous orders.
      </p>

      {allOrders.length > 0 && (
        <form action="/account/orders" method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search order # or item…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-xl border border-gray-200 bg-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="text-sm font-medium px-4 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            Filter
          </button>
          {(q || status) && (
            <Link
              href="/account/orders"
              className="text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-brand transition-colors text-center"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {allOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-brand font-medium hover:underline"
          >
            Start shopping →
          </Link>
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders match your search.</p>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-brand font-medium hover:underline"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((order) => (
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
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(q, status, page - 1)}
                    className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-brand transition-colors"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-100 text-gray-300">
                    Previous
                  </span>
                )}
                {page < totalPages ? (
                  <Link
                    href={pageHref(q, status, page + 1)}
                    className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-brand transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-100 text-gray-300">
                    Next
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
