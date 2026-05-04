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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return { title: `Order ${orderId.slice(-8).toUpperCase()} – ShokoShop` };
}

// Demo order data
const DEMO_ORDERS: Record<string, object> = {
  ord_demo_001: {
    id: "ord_demo_001",
    customerEmail: "customer@example.com",
    customerName: "Jane Smith",
    status: "shipped",
    total: 5998,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    trackingNumber: "JD000340014700000000",
    trackingUrl: "https://track.gelato.com/demo",
    shippingAddress: {
      name: "Jane Smith",
      line1: "123 Example Street",
      city: "London",
      postalCode: "SW1A 1AA",
      country: "GB",
    },
    items: [
      {
        id: "ci_1",
        name: "Custom Print T-Shirt",
        variantName: "Medium",
        price: 2999,
        quantity: 2,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
      },
    ],
  },
  ord_demo_002: {
    id: "ord_demo_002",
    customerEmail: "customer@example.com",
    customerName: "Jane Smith",
    status: "delivered",
    total: 2999,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    trackingNumber: "JD000340014700000001",
    trackingUrl: "https://track.gelato.com/demo",
    shippingAddress: {
      name: "Jane Smith",
      line1: "123 Example Street",
      city: "London",
      postalCode: "SW1A 1AA",
      country: "GB",
    },
    items: [
      {
        id: "ci_2",
        name: "Custom Photo Mug",
        variantName: "11oz White",
        price: 1499,
        quantity: 2,
        image:
          "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200",
      },
    ],
  },
  ord_demo_003: {
    id: "ord_demo_003",
    customerEmail: "customer@example.com",
    customerName: "Jane Smith",
    status: "delivered",
    total: 7498,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    trackingNumber: "JD000340014700000002",
    trackingUrl: "https://track.gelato.com/demo",
    shippingAddress: {
      name: "Jane Smith",
      line1: "123 Example Street",
      city: "London",
      postalCode: "SW1A 1AA",
      country: "GB",
    },
    items: [
      {
        id: "ci_3",
        name: "Custom Art Poster",
        variantName: "A3",
        price: 2999,
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200",
      },
      {
        id: "ci_4",
        name: "Custom Print T-Shirt",
        variantName: "Large",
        price: 2999,
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
      },
      {
        id: "ci_5",
        name: "Custom Phone Case",
        variantName: "iPhone 15",
        price: 1500,
        quantity: 1,
        image:
          "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200",
      },
    ],
  },
};

interface OrderItem {
  id: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

interface OrderData {
  id: string;
  customerEmail: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { key: "processing", label: "Printing", icon: Package },
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

  // Try demo data first; in production, fetch from your DB
  const raw = DEMO_ORDERS[orderId];
  if (!raw) notFound();
  const order = raw as OrderData;

  const currentStep = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
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
              ? "bg-indigo-100 text-indigo-700"
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
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-indigo-100" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-16 ${
                      isCompleted ? "text-indigo-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                      i < currentStep ? "bg-indigo-600" : "bg-gray-200"
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
        <div className="bg-indigo-50 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-1">
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
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
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
                <div
                  className="h-16 w-16 rounded-xl bg-gray-100 bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
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
            <MapPin className="h-4 w-4 text-indigo-600" />
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
