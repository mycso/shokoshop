import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, signSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.backupCode.deleteMany({ where: { userId: user.id } });
    return tx.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  const token = await signSession({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    sessionVersion: updated.sessionVersion,
  });

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
}
