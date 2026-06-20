import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return { title: `Order ${orderId.slice(-8).toUpperCase()} – ShokoShop` };
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { key: "processing", label: "Producing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "delivered"];

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getOrderById(orderId);
  if (!order) notFound();

  const currentStep = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
        <Link href="/account/orders" className="hover:text-gray-700">
          My Orders
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          #{order.id.slice(-8).toUpperCase()}
        </span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`inline-flex text-sm font-semibold px-3 py-1.5 rounded-full capitalize self-start sm:self-auto ${
            order.status === "delivered"
              ? "bg-green-100 text-green-700"
              : order.status === "shipped"
              ? "bg-blue-100 text-blue-700"
              : order.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-6">Order Progress</h2>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStep;
            const isCurrent = i === currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-brand text-white"
                        : "bg-gray-100 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-brand-light" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-16 ${
                      isCompleted ? "text-brand" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                      i < currentStep ? "bg-brand" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="bg-brand-light rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-brand-dark font-semibold mb-1">
                <Truck className="h-4 w-4" />
                Tracking Number
              </div>
              <p className="font-mono text-sm text-gray-700">
                {order.trackingNumber}
              </p>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-dark transition-colors"
              >
                Track Package
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                {item.image && (
                  <div
                    className="h-16 w-16 rounded-xl bg-gray-100 bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {item.name}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            Shipping Address
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">
              {order.shippingAddress.name}
            </p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p>{order.shippingAddress.line2}</p>
            )}
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state
                ? `, ${order.shippingAddress.state}`
                : ""}
            </p>
            <p>{order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Contact:{" "}
              <span className="text-gray-700">{order.customerEmail}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
