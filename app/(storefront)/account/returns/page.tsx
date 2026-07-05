import Link from "next/link";
import { PackageX, Clock } from "lucide-react";
import { getReturnsByEmail } from "@/lib/returns";
import { getCurrentUser } from "@/lib/auth/dal";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Returns – ShokoShop" };

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  refunded: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const REASON_LABELS: Record<string, string> = {
  damaged:          "Item arrived damaged",
  wrong_item:       "Wrong item received",
  not_as_described: "Not as described",
  changed_mind:     "Changed my mind",
  other:            "Other",
};

const RESOLUTION_LABELS: Record<string, string> = {
  refund:       "Full refund",
  exchange:     "Exchange",
  store_credit: "Store credit",
};

export default async function ReturnsPage() {
  const user = await getCurrentUser();
  const returns = user ? await getReturnsByEmail(user.email) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Returns</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Track your return and refund requests.</p>

      {returns.length === 0 ? (
        <div className="text-center py-20">
          <PackageX className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No return requests yet.</p>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-brand font-medium hover:underline"
          >
            View orders →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                      #{r.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                    {REASON_LABELS[r.reason] ?? r.reason}
                    <span className="font-normal text-gray-400 dark:text-gray-500"> · </span>
                    <span className="text-gray-500 dark:text-gray-400">{RESOLUTION_LABELS[r.resolution] ?? r.resolution}</span>
                  </p>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Submitted{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.items.map((item) => (
                      <span
                        key={item.itemId}
                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>

                  {r.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      &ldquo;{r.description}&rdquo;
                    </p>
                  )}
                </div>

                <Link
                  href={`/account/orders/${r.orderId}`}
                  className="text-xs font-medium text-brand hover:underline shrink-0"
                >
                  View order →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
