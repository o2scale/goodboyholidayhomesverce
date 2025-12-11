import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_secret_key_change_me'
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAdminRoute = pathname.startsWith('/admin');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (!isAdminRoute && !isDashboardRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get('session')?.value;

    if (!token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(url);
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const userRole = payload.role;

        if (isAdminRoute && userRole !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (isDashboardRoute && userRole !== 'customer') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    } catch (e) {
        // Invalid token
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: ['/admin/:path*', '/dashboard/:path*'],
};
