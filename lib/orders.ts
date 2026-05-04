import { Order } from "@/types";

// In-memory store for demo. Replace with a real database in production.
const orders: Map<string, Order> = new Map();

export function createOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

export function getOrderById(id: string): Order | undefined {
  return orders.get(id);
}

export function getOrdersByEmail(email: string): Order[] {
  return Array.from(orders.values()).filter(
    (o) => o.customerEmail === email
  );
}

export function updateOrder(id: string, update: Partial<Order>): Order | null {
  const existing = orders.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
}

export function getAllOrders(): Order[] {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
