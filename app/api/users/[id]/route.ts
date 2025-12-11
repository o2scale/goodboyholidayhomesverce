import { NextResponse } from 'next/server';
import { deleteUser, updateUser } from '@/lib/data';
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { id } = await params;
        await deleteUser(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 400 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { id } = await params;
        const body = await request.json();

        const updates: any = { ...body };
        // If password is being updated, map it to passwordHash
        if (updates.password) {
            updates.passwordHash = updates.password;
            delete updates.password;
        }

        const updatedUser = await updateUser(id, updates);
        return NextResponse.json(updatedUser);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 400 });
    }
}
