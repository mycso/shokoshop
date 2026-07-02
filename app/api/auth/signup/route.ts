import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie } from "@/lib/auth/session";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  password: z
    .string()
    .min(8)
    .refine((p) => /\d/.test(p), "Password must contain a number")
    .refine((p) => /[a-zA-Z]/.test(p), "Password must contain a letter"),
});

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(`signup:${getClientIp(req)}`, 5, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: parsed.data.name },
  });

  await sendWelcomeEmail(user.email, user.name).catch((err) =>
    console.error("Failed to send welcome email:", err)
  );

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
