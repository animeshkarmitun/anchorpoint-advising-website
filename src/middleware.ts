import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_COOKIE_NAME, PORTAL_AUTH_PATHS, ADMIN_AUTH_PATHS } from '@/lib/constants';

const PORTAL_PUBLIC = new Set<string>(PORTAL_AUTH_PATHS);
const ADMIN_PUBLIC = new Set<string>(ADMIN_AUTH_PATHS);

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ── Customer portal ──────────────────────────────────────────────────────
    if (pathname.startsWith('/portal')) {
        if (PORTAL_PUBLIC.has(pathname)) return NextResponse.next();

        // The backend sets one httpOnly refresh cookie for all roles.
        // Role-based routing happens post-login in useLogin().
        const session = req.cookies.get(REFRESH_COOKIE_NAME);
        if (!session) {
            const url = req.nextUrl.clone();
            url.pathname = '/portal/login';
            url.searchParams.set('next', pathname);
            return NextResponse.redirect(url);
        }
    }

    // ── Admin panel ───────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
        if (ADMIN_PUBLIC.has(pathname)) return NextResponse.next();

        // Same cookie — role enforcement is done server-side on each API call.
        const session = req.cookies.get(REFRESH_COOKIE_NAME);
        if (!session) {
            const url = req.nextUrl.clone();
            url.pathname = '/admin/login';
            url.searchParams.set('next', pathname);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/portal/:path*', '/admin/:path*'],
};
