import { NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/data';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { status } = await request.json();

        if (!['confirmed', 'rejected', 'pending'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await updateBookingStatus(params.id, status);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Booking conflict: Dates are already booked.") {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
