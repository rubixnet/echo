import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth, type AppJWT } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRecovery =
    pathname === "/login" &&
    (request.nextUrl.searchParams.has("error") ||
      request.nextUrl.searchParams.has("logout"));

  const isPublicAuthPage = pathname === "/" || pathname === "/login";

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding");

  let verifiedToken: AppJWT | null = null;

  if (token) {
    try {
      verifiedToken = await verifyAuth(token);
    } catch {
      verifiedToken = null;
    }
  }

  const isLoggedIn = !!verifiedToken;

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isPublicAuthPage && !isAuthRecovery) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  if (isLoggedIn && verifiedToken) {
    if (pathname.startsWith("/onboarding") && verifiedToken.onboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard") && !verifiedToken.onboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};