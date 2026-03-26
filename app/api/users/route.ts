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

export async function GET() {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*');

    if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Get auth users to join emails
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const authMap = new Map(authUsers.map(u => [u.id, u]));

    const users = (profiles ?? []).map(p => ({
        id: p.id,
        name: p.name,
        email: authMap.get(p.id)?.email ?? p.email ?? '',
        phone: p.phone ?? null,
        role: p.role,
    }));

    return NextResponse.json(users);
}

export async function POST(request: Request) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email, password, role, phone } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields (name, email, password)' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: role || 'customer' },
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Create profile row
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                name,
                email,
                phone: phone || null,
                role: role || 'customer',
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
        }

        return NextResponse.json({
            id: authData.user.id,
            name,
            email,
            phone: phone || null,
            role: role || 'customer',
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to create user';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
