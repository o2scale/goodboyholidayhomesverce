import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, phone, message } = await request.json();

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'goodboyholidayhomes@gmail.com',
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: '"Goodboy Holiday Homes" <goodboyholidayhomes@gmail.com>',
        to: 'goodboyholidayhomes@gmail.com',
        replyTo: email,
        subject: `Contact form: ${firstName}${lastName ? ' ' + lastName : ''}`,
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName ?? ''}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone ?? '(not provided)'}</p>
          <p><strong>Message:</strong></p>
          <p>${String(message).replace(/\n/g, '<br/>')}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
