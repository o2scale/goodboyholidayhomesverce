import { Resend } from 'resend';
import nodemailer from 'nodemailer';

/**
 * Email sending — two-track strategy:
 *
 * Primary: Resend (HTTP API)
 *   - Works on Vercel serverless without SMTP headaches.
 *   - Uses RESEND_API_KEY env var.
 *   - Without a verified domain on Resend, the 'from' address must be
 *     the `onboarding@resend.dev` default, and sends are only allowed
 *     to the Resend account owner's email. Verify a custom domain to
 *     send from goodboyholidayhomes.com and to any recipient.
 *
 * Fallback: Gmail SMTP (nodemailer)
 *   - Used if RESEND_API_KEY is not configured.
 *   - Known to be unreliable on Vercel serverless.
 *
 * Either way, failures never throw — they log and return false so the
 * parent request (booking / contact form save) succeeds regardless.
 */

const RECIPIENT = 'goodboyholidayhomes@gmail.com';

// Sender address — uses the verified goodboyholidayhomes.com domain on Resend.
// Replies go to either the customer (when replyTo is set) or this inbox.
const FROM_ADDRESS = 'noreply@goodboyholidayhomes.com';

interface EmailOptions {
    to?: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    fromName?: string;
}

let _resend: Resend | null = null;
function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
    return _resend;
}

async function sendViaResend(opts: EmailOptions): Promise<boolean> {
    const resend = getResend();
    if (!resend) return false;

    const fromName = opts.fromName ?? 'Goodboy Holiday Homes';
    const from = `${fromName} <${FROM_ADDRESS}>`;

    try {
        const { data, error } = await resend.emails.send({
            from,
            to: opts.to ?? RECIPIENT,
            replyTo: opts.replyTo,
            subject: opts.subject,
            html: opts.html,
            text: opts.text,
        });

        if (error) {
            console.error('[email] RESEND FAILED', {
                to: opts.to ?? RECIPIENT,
                subject: opts.subject,
                error,
            });
            return false;
        }

        console.log('[email] resend sent', { to: opts.to ?? RECIPIENT, subject: opts.subject, id: data?.id });
        return true;
    } catch (e) {
        const err = e as Error;
        console.error('[email] RESEND THREW', { message: err.message });
        return false;
    }
}

async function sendViaSmtp(opts: EmailOptions): Promise<boolean> {
    if (!process.env.EMAIL_PASSWORD) {
        console.error('[email] no RESEND_API_KEY and no EMAIL_PASSWORD — email not sent');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'goodboyholidayhomes@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: `"${opts.fromName ?? 'Goodboy Holiday Homes'}" <goodboyholidayhomes@gmail.com>`,
            to: opts.to ?? RECIPIENT,
            replyTo: opts.replyTo,
            subject: opts.subject,
            html: opts.html,
            text: opts.text,
        });
        console.log('[email] smtp sent', { to: opts.to ?? RECIPIENT, messageId: info.messageId });
        return true;
    } catch (e) {
        const err = e as Error & { code?: string; response?: string; responseCode?: number };
        console.error('[email] SMTP FAILED', {
            to: opts.to ?? RECIPIENT,
            subject: opts.subject,
            code: err.code,
            responseCode: err.responseCode,
            response: err.response,
            message: err.message,
        });
        return false;
    }
}

/**
 * Send an email notification. Tries Resend first (HTTP, serverless-friendly),
 * falls back to Gmail SMTP if Resend is not configured. Never throws.
 */
export async function sendEmailNotification(opts: EmailOptions): Promise<boolean> {
    if (process.env.RESEND_API_KEY) {
        return sendViaResend(opts);
    }
    return sendViaSmtp(opts);
}

/**
 * Diagnostic helper exposed to the /api/debug/email-check route.
 * Reports which provider is configured and which env vars are set.
 */
export function getEmailConfigStatus() {
    return {
        primary: process.env.RESEND_API_KEY ? 'resend' : 'smtp',
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: (process.env.RESEND_API_KEY ?? '').length,
        hasSmtpPassword: !!process.env.EMAIL_PASSWORD,
        smtpPasswordLength: (process.env.EMAIL_PASSWORD ?? '').length,
    };
}

// Keep the old SMTP transporter helper for the existing diagnostic endpoint
export function createEmailTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'goodboyholidayhomes@gmail.com',
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}
