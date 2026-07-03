import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import SendToGelatoButton from "./SendToGelatoButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `Order ${id.slice(-8).toUpperCase()} – Admin | ShokoShop` };
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`ml-auto text-sm font-semibold px-3 py-1.5 rounded-full capitalize ${
            order.status === "delivered"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : order.status === "shipped"
              ? "bg-brand-light text-brand-dark"
              : order.status === "processing"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
          <p className="font-medium text-gray-800 dark:text-gray-100">{order.customerName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerEmail}</p>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Shipping</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{order.shippingAddress.line2}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.shippingAddress.country}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Fulfilment</h2>
          {order.gelatoOrderId && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-1">
                Gelato Order ID
              </p>
              <p className="font-mono text-sm text-gray-700 dark:text-gray-200">{order.gelatoOrderId}</p>
            </div>
          )}
          {order.trackingNumber && (
            <div className="flex items-center gap-2 bg-brand-light px-3 py-2 rounded-xl mb-3">
              <Truck className="h-4 w-4 text-brand" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                  Tracking
                </p>
                <p className="font-mono text-sm text-gray-700">
                  {order.trackingNumber}
                </p>
              </div>
            </div>
          )}
          <SendToGelatoButton orderId={order.id} hasExisting={!!order.gelatoOrderId} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                {item.variantName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantName}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-gray-900 dark:text-white mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
