import { NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/data';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default_secret_key_change_me'
);

async function isAdmin(request: Request) {
    const token = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0];
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload.role === 'admin';
    } catch {
        return false;
    }
}

export async function GET(request: Request) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const users = await getUsers();
    return NextResponse.json(users);
}

export async function POST(request: Request) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        // Force password hash or plain text as per current implementation
        const newUser = await createUser({
            ...body,
            passwordHash: body.password,
            // Allow role to be set, default to customer if not provided
            role: body.role || 'customer'
        });
        return NextResponse.json(newUser);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 400 });
    }
}
