import { Users } from "lucide-react";
import { getAllOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers – Admin | ShokoShop" };

interface Customer {
  name: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
}

async function getCustomers(): Promise<Customer[]> {
  const orders = await getAllOrders(); // newest first

  const byEmail = new Map<string, Customer>();
  for (const order of orders) {
    const isRevenue = order.status !== "pending" && order.status !== "cancelled";
    const existing = byEmail.get(order.customerEmail);
    if (!existing) {
      byEmail.set(order.customerEmail, {
        name: order.customerName,
        email: order.customerEmail,
        orders: 1,
        spent: isRevenue ? order.total : 0,
        joined: order.createdAt,
      });
    } else {
      existing.orders += 1;
      if (isRevenue) existing.spent += order.total;
      if (new Date(order.createdAt) < new Date(existing.joined)) existing.joined = order.createdAt;
    }
  }

  return Array.from(byEmail.values()).sort((a, b) => b.spent - a.spent);
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-6 w-6 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {customers.length} registered customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center text-gray-500 dark:text-gray-400">
          No customers yet — they&apos;ll show up here once orders come in.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Orders
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Total Spent
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {customers.map((customer) => (
                <tr
                  key={customer.email}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-light text-brand-dark font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {customer.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white hidden md:table-cell">
                    {formatPrice(customer.spent)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {new Date(customer.joined).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
