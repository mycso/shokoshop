import { readFileSync, writeFileSync, existsSync, accessSync, constants } from "fs";
import { join } from "path";
import os from "os";
import { ReturnRequest } from "@/types";

const RETURNS_FILE = (() => {
  const envPath = process.env.RETURNS_FILE;
  if (envPath) return envPath;
  const projectPath = join(process.cwd(), ".returns.json");
  try {
    accessSync(process.cwd(), constants.W_OK);
    return projectPath;
  } catch {
    return join(os.tmpdir(), ".returns.json");
  }
})();

function readReturns(): Map<string, ReturnRequest> {
  if (!existsSync(RETURNS_FILE)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(RETURNS_FILE, "utf-8")) as Record<string, ReturnRequest>;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

function persist(returns: Map<string, ReturnRequest>): void {
  writeFileSync(RETURNS_FILE, JSON.stringify(Object.fromEntries(returns), null, 2));
}

export function createReturn(req: ReturnRequest): ReturnRequest {
  const returns = readReturns();
  returns.set(req.id, req);
  persist(returns);
  return req;
}

export function getReturnById(id: string): ReturnRequest | undefined {
  return readReturns().get(id);
}

export function getReturnByOrderId(orderId: string): ReturnRequest | undefined {
  return Array.from(readReturns().values()).find((r) => r.orderId === orderId);
}

export function getReturnsByEmail(email: string): ReturnRequest[] {
  return Array.from(readReturns().values())
    .filter((r) => r.customerEmail === email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllReturns(): ReturnRequest[] {
  return Array.from(readReturns().values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateReturn(id: string, update: Partial<ReturnRequest>): ReturnRequest | null {
  const returns = readReturns();
  const existing = returns.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
  returns.set(id, updated);
  persist(returns);
  return updated;
}

export function generateReturnId(): string {
  return `ret_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
