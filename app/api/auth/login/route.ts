import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/data';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_secret_key_change_me'
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const user = await getUserByEmail(email);

        // In production, use bcrypt.compare(password, user.passwordHash)
        if (!user || user.passwordHash !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create JWT
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(SECRET_KEY);

        const response = NextResponse.json({ success: true, role: user.role });

        // Set Cookie
        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
