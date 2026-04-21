import { NextResponse } from 'next/server';
import { createEmailTransporter, sendEmailNotification } from '@/lib/email';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Diagnostic endpoint for email delivery. Admin-only.
 *
 *   GET  /api/debug/email-check   verifies SMTP config (no send)
 *   POST /api/debug/email-check   sends a test email to the admin inbox
 *
 * Returns detailed error info so we can diagnose production issues.
 */

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

  const hasPassword = !!process.env.EMAIL_PASSWORD;
  const passwordLength = (process.env.EMAIL_PASSWORD ?? '').length;

  if (!hasPassword) {
    return NextResponse.json({
      ok: false,
      reason: 'EMAIL_PASSWORD env var is not set on this deployment.',
      env: { hasPassword, passwordLength },
    });
  }

  try {
    const t = createEmailTransporter();
    await t.verify();
    return NextResponse.json({
      ok: true,
      smtpVerified: true,
      env: { hasPassword, passwordLength },
    });
  } catch (e) {
    const err = e as Error & { code?: string; response?: string; responseCode?: number };
    return NextResponse.json({
      ok: false,
      smtpVerified: false,
      env: { hasPassword, passwordLength },
      error: {
        code: err.code,
        responseCode: err.responseCode,
        response: err.response,
        message: err.message,
      },
    });
  }
}

export async function POST() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sent = await sendEmailNotification({
    to: 'goodboyholidayhomes@gmail.com',
    subject: 'Goodboy email diagnostic',
    html: `<p>This is a diagnostic test email sent at ${new Date().toISOString()}.</p><p>If you received this, SMTP from production is working correctly.</p>`,
    text: `Diagnostic test at ${new Date().toISOString()}. If you received this, SMTP from production is working.`,
  });

  return NextResponse.json({
    sent,
    hint: sent
      ? 'Email accepted by SMTP. Check your inbox (and spam folder).'
      : 'Email send failed. Check Vercel runtime logs for [email] SEND FAILED entries.',
  });
}
