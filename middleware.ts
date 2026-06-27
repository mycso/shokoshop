import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const COOKIE = "admin_session";

function makeSessionToken(password: string): string {
  return createHmac("sha256", "shokoshop-admin-v1").update(password).digest("hex");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If already authenticated as admin, skip the login page
  if (pathname === "/admin/login") {
    const session = request.cookies.get(COOKIE)?.value;
    const password = process.env.ADMIN_PASSWORD;
    if (password && session === makeSessionToken(password)) {
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

  if (!password || session !== makeSessionToken(password)) {
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
