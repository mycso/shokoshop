import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";

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
  const order = getOrderById(id);
  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500">
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
              ? "bg-green-100 text-green-700"
              : order.status === "shipped"
              ? "bg-brand-light text-brand-dark"
              : order.status === "processing"
              ? "bg-purple-100 text-purple-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Customer</h2>
          <p className="font-medium text-gray-800">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-1">Shipping</p>
            <p className="text-sm text-gray-500">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p className="text-sm text-gray-500">{order.shippingAddress.line2}</p>
            )}
            <p className="text-sm text-gray-500">
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Fulfilment</h2>
          {order.gelatoOrderId && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">
                Gelato Order ID
              </p>
              <p className="font-mono text-sm text-gray-700">{order.gelatoOrderId}</p>
            </div>
          )}
          {order.trackingNumber && (
            <div className="flex items-center gap-2 bg-brand-light px-3 py-2 rounded-xl">
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
          {!order.gelatoOrderId && (
            <p className="text-sm text-gray-400">Not yet sent to Gelato.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                {item.variantName && (
                  <p className="text-xs text-gray-500">{item.variantName}</p>
                )}
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-gray-900 mt-4 pt-4 border-t border-gray-100">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
