import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { setSessionCookie, signSession } from "@/lib/auth/session";
import { generateBackupCodes, hashBackupCode, verifyTotpToken } from "@/lib/auth/totp";

export const runtime = "nodejs";

const schema = z.object({
  secret: z.string().min(1),
  code: z.string().min(6).max(6),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const valid = await verifyTotpToken(parsed.data.secret, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  const backupCodes = generateBackupCodes();
  const backupCodeHashes = await Promise.all(backupCodes.map(hashBackupCode));

  const updated = await prisma.$transaction(async (tx) => {
    await tx.backupCode.deleteMany({ where: { userId: user.id } });
    await tx.backupCode.createMany({
      data: backupCodeHashes.map((codeHash) => ({ userId: user.id, codeHash })),
    });
    return tx.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: parsed.data.secret,
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

  const res = NextResponse.json({ ok: true, backupCodes });
  setSessionCookie(res, token);
  return res;
}
