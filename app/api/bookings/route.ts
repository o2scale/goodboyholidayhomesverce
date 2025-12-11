import { NextResponse } from 'next/server';
import { getBookings, createBooking } from '@/lib/data';

export async function GET() {
    try {
        const bookings = await getBookings();
        return NextResponse.json(bookings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { propertyId, startDate, endDate, guestCount, customerName, customerEmail, customerPhone } = body;

        if (!propertyId || !startDate || !endDate || !customerName || !customerPhone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const booking = await createBooking({
            propertyId,
            startDate,
            endDate,
            guestCount,
            customerName,
            customerEmail: customerEmail || "", // Optional if user wants just phone
            customerPhone
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
