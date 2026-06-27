export interface ProductVariantOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number; // lowest variant price (pence), 0 if unset
  images: string[];
  category: string;
  gelatoProductId?: string;
  variants?: ProductVariant[];
  productVariantOptions?: ProductVariantOption[];
  variantPrices?: Record<string, number>; // variantId → price in pence
  variantImages?: Record<string, string[]>;  // variantId → mockup image URLs (front/back/side when Gelato has them)
  inStock: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string;
  variantOptions?: Record<string, string>; // e.g. { Color: "White", Size: "M" }
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variantId?: string;
  variantName?: string;
  customDesignUrl?: string;
  gelatoProductId?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  gelatoOrderId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt: string;
}

export type ReturnReason =
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "other";

export type ReturnResolution = "refund" | "exchange" | "store_credit";
export type ReturnStatus = "pending" | "approved" | "rejected" | "refunded";

export interface ReturnRequestItem {
  itemId: string;
  name: string;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerEmail: string;
  items: ReturnRequestItem[];
  reason: ReturnReason;
  description: string;
  resolution: ReturnResolution;
  status: ReturnStatus;
  refundAmount?: number;          // pence — calculated at submission time
  stripePaymentIntentId?: string; // retrieved from the Stripe session at submission
  stripeRefundId?: string;        // set after Stripe refund is issued
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GelatoOrderPayload {
  orderReferenceId: string;
  customerReferenceId: string;
  currency: string;
  items: GelatoOrderItem[];
  shipmentMethodUid: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postCode: string;
    country: string;
    email: string;
    phone?: string;
  };
}

export interface GelatoOrderItem {
  itemReferenceId: string;
  productUid: string;
  files: { type: string; url: string }[];
  quantity: number;
}
