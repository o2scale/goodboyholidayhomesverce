import { NextResponse } from 'next/server';
import { sendEmailNotification, getEmailConfigStatus, createEmailTransporter } from '@/lib/email';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Admin-only email diagnostic endpoint.
 *   GET  /api/debug/email-check   reports which provider is configured
 *   POST /api/debug/email-check   sends a test email
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

  const status = getEmailConfigStatus();

  // If SMTP is the primary, also verify the connection (legacy check)
  let smtpVerified: boolean | null = null;
  let smtpError: unknown = null;
  if (status.primary === 'smtp' && status.hasSmtpPassword) {
    try {
      const t = createEmailTransporter();
      await t.verify();
      smtpVerified = true;
    } catch (e) {
      smtpVerified = false;
      const err = e as Error & { code?: string; response?: string; responseCode?: number };
      smtpError = {
        code: err.code,
        responseCode: err.responseCode,
        response: err.response,
        message: err.message,
      };
    }
  }

  return NextResponse.json({
    provider: status.primary,
    ...status,
    smtpVerified,
    smtpError,
  });
}

export async function POST() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = getEmailConfigStatus();
  const sent = await sendEmailNotification({
    to: 'goodboyholidayhomes@gmail.com',
    subject: `Goodboy email diagnostic (${status.primary})`,
    html: `<p>Diagnostic test email sent via <strong>${status.primary}</strong> at ${new Date().toISOString()}.</p><p>If you received this, the production email path is working.</p>`,
    text: `Diagnostic test via ${status.primary} at ${new Date().toISOString()}. If you received this, production email is working.`,
  });

  return NextResponse.json({
    sent,
    provider: status.primary,
    hint: sent
      ? `Email accepted by ${status.primary}. Check inbox (and spam folder).`
      : `Email failed. Check Vercel runtime logs for [email] ... entries.`,
  });
}
