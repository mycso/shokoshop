import { get, put } from "@vercel/blob";
import { ReturnRequest } from "@/types";

const RETURNS_PATH = "orders/returns.json";

async function readReturns(): Promise<Map<string, ReturnRequest>> {
  const result = await get(RETURNS_PATH, { access: "private" }).catch(() => null);
  if (!result?.stream) return new Map();
  try {
    const text = await new Response(result.stream).text();
    const raw = JSON.parse(text || "{}") as Record<string, ReturnRequest>;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

async function persist(returns: Map<string, ReturnRequest>): Promise<void> {
  await put(RETURNS_PATH, JSON.stringify(Object.fromEntries(returns), null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function createReturn(req: ReturnRequest): Promise<ReturnRequest> {
  const returns = await readReturns();
  returns.set(req.id, req);
  await persist(returns);
  return req;
}

export async function getReturnById(id: string): Promise<ReturnRequest | undefined> {
  return (await readReturns()).get(id);
}

export async function getReturnByOrderId(orderId: string): Promise<ReturnRequest | undefined> {
  return Array.from((await readReturns()).values()).find((r) => r.orderId === orderId);
}

export async function getReturnsByEmail(email: string): Promise<ReturnRequest[]> {
  return Array.from((await readReturns()).values())
    .filter((r) => r.customerEmail === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllReturns(): Promise<ReturnRequest[]> {
  return Array.from((await readReturns()).values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateReturn(id: string, update: Partial<ReturnRequest>): Promise<ReturnRequest | null> {
  const returns = await readReturns();
  const existing = returns.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  returns.set(id, updated);
  await persist(returns);
  return updated;
}

export function generateReturnId(): string {
  return `ret_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
