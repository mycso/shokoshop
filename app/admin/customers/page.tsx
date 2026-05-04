import { Users } from "lucide-react";

export const metadata = { title: "Customers – Admin | ShokoShop" };

const DEMO_CUSTOMERS = [
  {
    id: "cust_001",
    name: "Jane Smith",
    email: "jane@example.com",
    orders: 3,
    spent: 16496,
    joined: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust_002",
    name: "John Doe",
    email: "john@example.com",
    orders: 1,
    spent: 2999,
    joined: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cust_003",
    name: "Alice Brown",
    email: "alice@example.com",
    orders: 2,
    spent: 9997,
    joined: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function AdminCustomersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">
            {DEMO_CUSTOMERS.length} registered customers
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Orders
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Total Spent
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {DEMO_CUSTOMERS.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {customer.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 hidden sm:table-cell">
                  {customer.orders}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 hidden md:table-cell">
                  {formatPrice(customer.spent)}
                </td>
                <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">
                  {new Date(customer.joined).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
