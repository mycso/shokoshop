import { randomInt } from "crypto";
import { generate, generateSecret, generateURI, verify } from "otplib";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const ISSUER = "ShokoShop";
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(secret: string, email: string): string {
  return generateURI({ issuer: ISSUER, label: email, secret });
}

export async function generateTotpToken(secret: string): Promise<string> {
  return generate({ secret });
}

export async function verifyTotpToken(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token, epochTolerance: 30 });
  return result.valid;
}

export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = (len: number) =>
      Array.from({ length: len }, () => BACKUP_CODE_CHARSET[randomInt(BACKUP_CODE_CHARSET.length)]).join("");
    codes.push(`${part(4)}-${part(4)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): Promise<string> {
  return hashPassword(code.toUpperCase());
}

export function verifyBackupCode(code: string, codeHash: string): Promise<boolean> {
  return verifyPassword(code.toUpperCase(), codeHash);
}
