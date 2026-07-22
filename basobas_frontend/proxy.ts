import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ['/login', '/register', '/forget-password', '/reset-password'];
const adminRoutes = ['/admin'];
const userRoutes = ['/user'];

const matches = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);
const parseUser = (raw?: string | null) => {
    if (!raw) return null;
    try {
        return JSON.parse(decodeURIComponent(raw));
    } catch {
        return null;
    }
};
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const user = parseUser(request.cookies.get("user_data")?.value ?? null);

    const isPublic = publicRoutes.some(route => matches(pathname, route));
    const isAdminPath = adminRoutes.some(route => matches(pathname, route));
    const isUserPath = userRoutes.some(route => matches(pathname, route));

    // The token lives in a server-set HttpOnly cookie that this middleware
    // cannot read; the real auth check happens server-side on every API call.
    // This guard only uses the non-sensitive user_data hint for UX redirects.
    const hasUserRole = Boolean(user?.role);
    const isAuthenticated = hasUserRole;
    if (!isAuthenticated && (isAdminPath || isUserPath)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    if (isAuthenticated) {
        if (isAdminPath && user!.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        if (isUserPath && !['user', 'admin'].includes(user!.role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }
    return NextResponse.next();
}
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets|api/.*).*)',
    ],
};