import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  twoFactorEnabled: boolean;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  // Invalidates already-issued JWTs after a password change or 2FA toggle
  if (user.sessionVersion !== payload.sessionVersion) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    twoFactorEnabled: user.twoFactorEnabled,
  };
});
