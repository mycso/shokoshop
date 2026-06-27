import Link from "next/link";
import { cookies } from "next/headers";
import { PackageX, Clock } from "lucide-react";
import { getReturnsByEmail } from "@/lib/returns";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Returns – ShokoShop" };

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  refunded: "bg-green-100 text-green-700",
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
  const cookieStore = await cookies();
  const raw = cookieStore.get("user_session")?.value;
  const session = raw
    ? (() => {
        try {
          return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as {
            email: string;
          };
        } catch {
          return null;
        }
      })()
    : null;

  const returns = session?.email ? await getReturnsByEmail(session.email) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">My Returns</h1>
      </div>
      <p className="text-gray-500 mb-8">Track your return and refund requests.</p>

      {returns.length === 0 ? (
        <div className="text-center py-20">
          <PackageX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No return requests yet.</p>
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
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-gray-500">
                      #{r.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 font-medium">
                    {REASON_LABELS[r.reason] ?? r.reason}
                    <span className="font-normal text-gray-400"> · </span>
                    <span className="text-gray-500">{RESOLUTION_LABELS[r.resolution] ?? r.resolution}</span>
                  </p>

                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
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
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>

                  {r.description && (
                    <p className="text-xs text-gray-500 mt-2 italic">
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
