import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    const isAuthRecovery = 
        pathname === "/login" && 
        (request.nextUrl.searchParams.has('error') || request.nextUrl.searchParams.has('logout'));

    const isPublicAuthPage = pathname === '/' || pathname === '/login';
    
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/tour') || pathname.startsWith('/home');

    const verifiedToken = token ? await verifyAuth(token) : null;

    if (!verifiedToken && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (verifiedToken && isPublicAuthPage && !isAuthRecovery) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};