import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isOnDashboard) {
    if (isLoggedIn) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL("/login?callbackUrl=" + req.nextUrl.pathname, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
