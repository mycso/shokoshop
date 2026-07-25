import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const allowed = await checkRateLimit(`admin-login:${getClientIp(request)}`, 10, 15 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const token = await signAdminSession();
  setAdminSessionCookie(res, token);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAdminSessionCookie(res);
  return res;
}
