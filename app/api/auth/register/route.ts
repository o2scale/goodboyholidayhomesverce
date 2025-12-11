import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/data';
import { SignJWT } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_secret_key_change_me'
);

export async function POST(request: Request) {
    try {
        const { name, email, password, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newUser = await createUser({
            name,
            email,
            passwordHash: password, // Ideally hash this
            role: 'customer',
            phone
        });

        // Auto-login after register
        const token = await new SignJWT({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(SECRET_KEY);

        const response = NextResponse.json({ success: true });

        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24
        });

        return response;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
