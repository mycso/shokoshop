import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  PENDING_2FA_COOKIE,
  clearPending2FACookie,
  setSessionCookie,
  signSession,
  verifyPending2FA,
} from "@/lib/auth/session";
import { verifyBackupCode, verifyTotpToken } from "@/lib/auth/totp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z
  .object({
    code: z.string().length(6).optional(),
    backupCode: z.string().min(1).optional(),
  })
  .refine((v) => v.code || v.backupCode, "A code or backup code is required");

export async function POST(req: NextRequest) {
  const pendingToken = req.cookies.get(PENDING_2FA_COOKIE)?.value;
  if (!pendingToken) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const pending = await verifyPending2FA(pendingToken);
  if (!pending) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const allowed = await checkRateLimit(`2fa-verify:${pending.sub}:${getClientIp(req)}`, 10, 15 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: pending.sub } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "Two-factor authentication is not enabled" }, { status: 400 });
  }

  let ok = false;

  if (parsed.data.code) {
    ok = await verifyTotpToken(user.twoFactorSecret, parsed.data.code);
  } else if (parsed.data.backupCode) {
    const unusedCodes = await prisma.backupCode.findMany({
      where: { userId: user.id, usedAt: null },
    });
    for (const backupCode of unusedCodes) {
      if (await verifyBackupCode(parsed.data.backupCode, backupCode.codeHash)) {
        await prisma.backupCode.update({
          where: { id: backupCode.id },
          data: { usedAt: new Date() },
        });
        ok = true;
        break;
      }
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  clearPending2FACookie(res);
  return res;
}
