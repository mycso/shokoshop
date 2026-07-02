import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders – Admin | ShokoShop" };

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

const PAGE_SIZE = 20;

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
  return `/admin/orders${qs ? `?${qs}` : ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const allOrders = await getAllOrders(); // newest first

  const filtered = allOrders.filter((order) => {
    if (status && order.status !== status) return false;
    if (q) {
      const query = q.trim().toLowerCase();
      const displayId = order.id.slice(-8).toLowerCase();
      if (
        !order.id.toLowerCase().includes(query) &&
        !displayId.includes(query) &&
        !order.customerName.toLowerCase().includes(query) &&
        !order.customerEmail.toLowerCase().includes(query)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm">
          {filtered.length === allOrders.length
            ? `${allOrders.length} total orders`
            : `${filtered.length} of ${allOrders.length} orders`}
        </p>
      </div>

      <form action="/admin/orders" method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search order #, customer name or email…"
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
            href="/admin/orders"
            className="text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-brand transition-colors text-center"
          >
            Clear
          </Link>
        )}
      </form>

      {paged.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">
            {allOrders.length === 0 ? "No orders yet." : "No orders match your search."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-gray-400 hover:text-brand transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
