import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

async function makeSessionToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode("shokoshop-admin-v1"),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(password));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If already authenticated as admin, skip the login page
  if (pathname === "/admin/login") {
    const session = request.cookies.get(COOKIE)?.value;
    const password = process.env.ADMIN_PASSWORD;
    if (password && session === (await makeSessionToken(password))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Allow the login API through
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!password || session !== (await makeSessionToken(password))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
