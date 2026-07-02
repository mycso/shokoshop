import { jwtVerify, SignJWT } from "jose";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "user_session";
export const PENDING_2FA_COOKIE = "pending_2fa_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const PENDING_2FA_MAX_AGE = 60 * 5; // 5 minutes

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  sessionVersion: number;
}

export interface Pending2FAPayload {
  sub: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function signToken(
  payload: object,
  typ: "session" | "pending_2fa",
  maxAgeSeconds: number
): Promise<string> {
  return new SignJWT({ ...payload, typ })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(getSecretKey());
}

async function verifyToken(
  token: string,
  expectedTyp: "session" | "pending_2fa"
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.typ !== expectedTyp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return signToken(payload, "session", SESSION_MAX_AGE);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const payload = await verifyToken(token, "session");
  if (!payload) return null;
  return payload as unknown as SessionPayload;
}

export async function signPending2FA(payload: Pending2FAPayload): Promise<string> {
  return signToken(payload, "pending_2fa", PENDING_2FA_MAX_AGE);
}

export async function verifyPending2FA(token: string): Promise<Pending2FAPayload | null> {
  const payload = await verifyToken(token, "pending_2fa");
  if (!payload) return null;
  return payload as unknown as Pending2FAPayload;
}

export function setSessionCookie(res: NextResponse, payload: string): void {
  res.cookies.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete(SESSION_COOKIE);
}

export function setPending2FACookie(res: NextResponse, payload: string): void {
  res.cookies.set(PENDING_2FA_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_2FA_MAX_AGE,
    path: "/",
  });
}

export function clearPending2FACookie(res: NextResponse): void {
  res.cookies.delete(PENDING_2FA_COOKIE);
}
