import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function requireAdmin() {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        return null;
    }

    return user;
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const supabaseAdmin = getSupabaseAdmin();

        // Delete from auth (this cascades if DB foreign key is set, otherwise delete profile manually)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Also delete profile row in case cascade is not configured
        await supabaseAdmin.from('profiles').delete().eq('id', id);

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to delete user';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, role, phone, password } = body;

        const supabaseAdmin = getSupabaseAdmin();

        // Update profile in DB
        const profileUpdates: Record<string, unknown> = {};
        if (name !== undefined) profileUpdates.name = name;
        if (role !== undefined) profileUpdates.role = role;
        if (phone !== undefined) profileUpdates.phone = phone;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', id);

            if (profileError) {
                return NextResponse.json({ error: profileError.message }, { status: 400 });
            }
        }

        // Sync role to auth user metadata (and update password if provided)
        const authUpdates: Record<string, unknown> = {};
        if (role !== undefined || name !== undefined) {
            authUpdates.user_metadata = {
                ...(name !== undefined ? { name } : {}),
                ...(role !== undefined ? { role } : {}),
            };
        }
        if (password) {
            authUpdates.password = password;
        }

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);

            if (authError) {
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        }

        // Return updated profile
        const { data: updatedProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({
            id: updatedProfile?.id ?? id,
            name: updatedProfile?.name,
            email: updatedProfile?.email,
            phone: updatedProfile?.phone ?? null,
            role: updatedProfile?.role,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to update user';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
