import { readFileSync, writeFileSync, existsSync, accessSync, constants } from "fs";
import { join } from "path";
import os from "os";
import { Order } from "@/types";

// File-based persistence. On serverless hosts (Vercel, AWS Lambda) the project
// root may be read-only. Respect an explicit `ORDERS_FILE` env var first. If
// that's not set, try writing to the project root; if that's not writable,
// fall back to the OS temp directory (which is writable on serverless).
const ORDERS_FILE = (() => {
  const envPath = process.env.ORDERS_FILE;
  if (envPath) return envPath;

  const projectPath = join(process.cwd(), ".orders.json");
  try {
    // If we can write to the current working directory, use the project file.
    accessSync(process.cwd(), constants.W_OK);
    return projectPath;
  } catch {
    // Fallback to OS temp directory (e.g. /tmp on Linux-based serverless)
    return join(os.tmpdir(), ".orders.json");
  }
})();

function readOrders(): Map<string, Order> {
  if (!existsSync(ORDERS_FILE)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(ORDERS_FILE, "utf-8")) as Record<string, Order>;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

function persist(orders: Map<string, Order>): void {
  writeFileSync(ORDERS_FILE, JSON.stringify(Object.fromEntries(orders), null, 2));
}

export function createOrder(order: Order): Order {
  const orders = readOrders();
  orders.set(order.id, order);
  persist(orders);
  return order;
}

export function getOrderById(id: string): Order | undefined {
  return readOrders().get(id);
}

export function getOrdersByEmail(email: string): Order[] {
  return Array.from(readOrders().values()).filter(
    (o) => o.customerEmail === email
  );
}

export function updateOrder(id: string, update: Partial<Order>): Order | null {
  const orders = readOrders();
  const existing = orders.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  persist(orders);
  return updated;
}

export function getAllOrders(): Order[] {
  return Array.from(readOrders().values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
