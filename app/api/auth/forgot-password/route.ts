import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const allowed = await checkRateLimit(`forgot-password:${getClientIp(req)}:${email}`, 5, 60 * 60);
  if (!allowed) {
    // Still respond generically to avoid leaking rate-limit state as a signal.
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl).catch((err) =>
      console.error("Failed to send password reset email:", err)
    );
  }

  // Always the same response, whether or not the email exists.
  return NextResponse.json({ ok: true });
}
