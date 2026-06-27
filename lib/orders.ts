import { get, put } from "@vercel/blob";
import { Order } from "@/types";

const ORDERS_PATH = "orders/orders.json";

async function readOrders(): Promise<Map<string, Order>> {
  const result = await get(ORDERS_PATH, { access: "private" }).catch(() => null);
  if (!result?.stream) return new Map();
  try {
    const text = await new Response(result.stream).text();
    const raw = JSON.parse(text || "{}") as Record<string, Order>;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

async function persist(orders: Map<string, Order>): Promise<void> {
  await put(ORDERS_PATH, JSON.stringify(Object.fromEntries(orders), null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function createOrder(order: Order): Promise<Order> {
  const orders = await readOrders();
  orders.set(order.id, order);
  await persist(orders);
  return order;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return (await readOrders()).get(id);
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  return Array.from((await readOrders()).values()).filter(
    (o) => o.customerEmail === email
  );
}

export async function updateOrder(id: string, update: Partial<Order>): Promise<Order | null> {
  const orders = await readOrders();
  const existing = orders.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  await persist(orders);
  return updated;
}

export async function getAllOrders(): Promise<Order[]> {
  return Array.from((await readOrders()).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
