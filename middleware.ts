import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname.startsWith("/api/auth") // Allow auth endpoints (login, logout, session check)
  ) {
    return NextResponse.next();
  }

  // 2. Check session token from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionCookie);

  const isLoginPage = pathname === "/login";

  // 3. If authenticated user visits /login, forward to /dashboard
  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 4. If unauthenticated user tries to access protected resources:
  if (!session) {
    // For protected API endpoints, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to ClientPulse." },
        { status: 401 }
      );
    }

    // For protected web pages, redirect to /login
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/" && pathname !== "/dashboard") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. User is authenticated, allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static Next.js assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
