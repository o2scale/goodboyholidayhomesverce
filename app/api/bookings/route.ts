import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Booking } from '@/lib/types';
import nodemailer from 'nodemailer';

/* ── snake_case row → camelCase Booking ── */
function toBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    userId: (row.user_id as string) ?? null,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    guestCount: row.guest_count as number,
    status: row.status as Booking['status'],
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    customerPhone: (row.customer_phone as string) ?? null,
    includeMeals: (row.include_meals as boolean) ?? false,
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('bookings').select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(toBooking));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, startDate, endDate, guestCount, customerName, customerEmail, customerPhone, includeMeals } = body;

    if (!propertyId || !startDate || !endDate || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Try to get the current user for user_id (optional — anonymous bookings allowed)
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // No authenticated user — that is fine
    }

    // Use admin client for insert to bypass RLS (anonymous bookings must be allowed)
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('bookings')
      .insert({
        property_id: propertyId,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        guest_count: guestCount,
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        include_meals: includeMeals ?? false,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const booking = toBooking(data);

    // Send Email Notification (inner try/catch — must not fail parent request)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'goodboyholidayhomes@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'your-app-password-here',
        },
      });

      await transporter.sendMail({
        from: '"Goodboy Holiday Homes" <goodboyholidayhomes@gmail.com>',
        to: 'goodboyholidayhomes@gmail.com',
        subject: `New Booking Request: ${customerName}`,
        text: `
          New booking request received!

          Property ID: ${propertyId}
          Customer: ${customerName}
          Phone: ${customerPhone}
          Email: ${customerEmail}
          Guests: ${guestCount}
          Dates: ${startDate} to ${endDate}
          Meals Included: ${includeMeals ? 'Yes' : 'No'}
        `,
        html: `
          <h2>New Booking Request</h2>
          <p><strong>Property ID:</strong> ${propertyId}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Guests:</strong> ${guestCount}</p>
          <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
          <p><strong>Meals Included:</strong> ${includeMeals ? 'Yes' : 'No'}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
