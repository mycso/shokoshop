import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/session";

export async function POST(request: Request) {
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
