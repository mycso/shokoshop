import { UserCog } from "lucide-react";
import { prisma } from "@/lib/db";
import DeleteUserButton from "@/components/admin/DeleteUserButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users – Admin | ShokoShop" };

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <UserCog className="h-6 w-6 text-brand" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {users.length} registered account{users.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center text-gray-500 dark:text-gray-400">
          No accounts yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Verified
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-light text-brand-dark font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {user.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {user.emailVerified ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                    {user.createdAt.toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DeleteUserButton userId={user.id} userEmail={user.email} />
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
