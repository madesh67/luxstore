import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

// Configuration for route classifications
const GUEST_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify",
];

const AUTHENTICATED_ROUTES = [
  "/account",
];

const ADMIN_ROUTES = [
  "/admin",
];

const SUPERADMIN_ROUTES = [
  "/superadmin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. CSRF Protection: Verify headers on modification requests
  const method = request.method;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  
  if (isMutation && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const appDomain = new URL(appUrl).host;

    let requestDomain = "";
    if (origin) {
      requestDomain = new URL(origin).host;
    } else if (referer) {
      requestDomain = new URL(referer).host;
    }

    // Block the request if domains do not match (except in development tests without origin/referer headers)
    if (requestDomain && requestDomain !== appDomain) {
      return new NextResponse(
        JSON.stringify({ success: false, error: { message: "CSRF verification failed" } }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Read Access Token from secure cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  let userPayload = null;

  if (accessToken) {
    userPayload = await verifyAccessToken(accessToken);
  }

  // 3. Routing Guard Rules
  const isLoggedIn = !!userPayload;

  // Guest-Only Routes: If user is logged in, redirect them to account dashboard
  if (GUEST_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  // Authenticated-Only Routes: Redirect guest users to login screen
  if (AUTHENTICATED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      // Clean stale tokens if any
      response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
      return response;
    }
  }

  // Admin-Only Routes: Redirect non-admins to homepage
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const role = userPayload?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // SuperAdmin-Only Routes: Redirect non-superadmins to homepage
  if (SUPERADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const role = userPayload?.role;
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. Inject Secure Security Headers to response
  const response = NextResponse.next();
  
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com;"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Apply middleware to all routes except internal Next.js visual assets and static items
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
