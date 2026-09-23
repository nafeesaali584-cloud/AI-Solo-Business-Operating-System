import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth";

// Known protected application route prefixes
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/clients",
  "/import",
  "/proposals",
  "/invoices",
  "/settings",
  "/onboarding",
  "/documents",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/favicon.jpg" ||
    pathname.startsWith("/api/auth") || // Auth endpoints (login, logout, session check)
    pathname === "/api/health"          // Uptime monitoring health check
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

  // 4. Handle root path "/"
  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Protected API routes check
  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to SoloDeskOS." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 6. Protected app page routes check
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 7. All other routes (e.g. /cart, /admin, /blog, /contact, /order, /pricing):
  // Let Next.js handle them to return a genuine HTTP 404 status code via app/not-found.tsx
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
