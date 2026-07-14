import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth/session";

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await verifyAdminSession(token);
  return session !== null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If already authenticated as admin, skip the login page
  if (pathname === "/admin/login") {
    if (await isAdminAuthenticated(request)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Allow the login API through
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (!(await isAdminAuthenticated(request))) {
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
