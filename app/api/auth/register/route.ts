import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'customer' },
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? 'Registration failed' },
        { status: 400 }
      );
    }

    if (phone) {
      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', data.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
