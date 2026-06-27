import { NextRequest, NextResponse } from "next/server";

const COOKIE = "user_session";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return NextResponse.json({ user: null }, { status: 401 });
  try {
    const user = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
