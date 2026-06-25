import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and login API through
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!password || session !== password) {
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
