export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  gelatoProductId?: string;
  variants?: ProductVariant[];
  inStock: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string;
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
