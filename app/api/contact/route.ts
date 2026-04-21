import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ContactMessage } from '@/lib/types';
import { siteConfig } from '@/lib/site-config';
import { sendEmailNotification } from '@/lib/email';

function toMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: (row.last_name as string) ?? null,
    email: row.email as string,
    phone: (row.phone as string) ?? null,
    message: row.message as string,
    isRead: (row.is_read as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

async function requireAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.user_metadata?.role === 'admin';
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(toMessage));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, phone, message } = await request.json();

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Save to DB first — using admin client to bypass RLS for anonymous submissions
    const admin = getSupabaseAdmin();
    const { data, error: dbError } = await admin
      .from('contact_messages')
      .insert({
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone: phone || null,
        message,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save contact message:', dbError);
      return NextResponse.json({ error: 'Failed to save your message. Please try again.' }, { status: 500 });
    }

    // Fire-and-forget email notification (must not fail the request)
    await sendEmailNotification({
      to: siteConfig.contact.email,
      replyTo: email,
      fromName: siteConfig.name,
      subject: `Contact form: ${firstName}${lastName ? ' ' + lastName : ''}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName ?? ''}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone ?? '(not provided)'}</p>
        <p><strong>Message:</strong></p>
        <p>${String(message).replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p style="color:#888;font-size:12px">Saved to admin dashboard at <a href="https://goodboyholidayhomes.com/admin">/admin → Messages</a></p>
      `,
    });

    return NextResponse.json(toMessage(data), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
