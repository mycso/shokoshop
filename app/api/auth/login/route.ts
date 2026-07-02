import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  setPending2FACookie,
  setSessionCookie,
  signPending2FA,
  signSession,
} from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const allowed = await checkRateLimit(`login:${getClientIp(req)}:${email}`, 10, 15 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.twoFactorEnabled) {
    const pendingToken = await signPending2FA({ sub: user.id });
    const res = NextResponse.json({ twoFactorRequired: true });
    setPending2FACookie(res, pendingToken);
    return res;
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
