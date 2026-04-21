import nodemailer from 'nodemailer';

/**
 * Shared nodemailer transporter for Gmail SMTP.
 *
 * Uses explicit host/port/secure settings instead of `service: 'gmail'`
 * shorthand because some serverless environments (Vercel/Fly/AWS Lambda)
 * have flaky behavior with the shorthand — explicit STARTTLS on 587 is
 * the most compatible setup.
 *
 * Requires EMAIL_PASSWORD env var (Gmail App Password, 16 chars).
 */
export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS upgrade (not implicit TLS on 465)
    auth: {
      user: 'goodboyholidayhomes@gmail.com',
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send an email and log any failures verbosely to the server console
 * so they surface in Vercel / other deployment logs. Never throws —
 * returns true on success, false on failure. Callers can decide what
 * to do with the result; typically the parent request should NOT fail
 * just because the email failed.
 */
export async function sendEmailNotification(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
}): Promise<boolean> {
  if (!process.env.EMAIL_PASSWORD) {
    console.error('[email] EMAIL_PASSWORD not set — skipping send to', options.to);
    return false;
  }

  try {
    const transporter = createEmailTransporter();
    const info = await transporter.sendMail({
      from: `"${options.fromName ?? 'Goodboy Holiday Homes'}" <goodboyholidayhomes@gmail.com>`,
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('[email] sent', { to: options.to, subject: options.subject, messageId: info.messageId, accepted: info.accepted });
    return true;
  } catch (e) {
    const err = e as Error & { code?: string; response?: string; responseCode?: number };
    console.error('[email] SEND FAILED', {
      to: options.to,
      subject: options.subject,
      code: err.code,
      responseCode: err.responseCode,
      response: err.response,
      message: err.message,
    });
    return false;
  }
}
