import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!['confirmed', 'rejected', 'pending', 'blocked'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        // If confirming, check for booking conflicts via RPC
        if (status === 'confirmed') {
            // First get the booking to know its details
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('property_id, start_date, end_date')
                .eq('id', id)
                .single();

            if (fetchError || !booking) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }

            const { data: hasConflict, error: rpcError } = await supabase.rpc('check_booking_conflict', {
                p_property_id: booking.property_id,
                p_start_date: booking.start_date,
                p_end_date: booking.end_date,
                p_exclude_booking_id: id,
            });

            if (rpcError) {
                return NextResponse.json({ error: rpcError.message }, { status: 500 });
            }

            if (hasConflict) {
                return NextResponse.json({ error: 'Booking conflict: Dates are already booked.' }, { status: 409 });
            }
        }

        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update booking';
        if (message === 'Booking conflict: Dates are already booked.') {
            return NextResponse.json({ error: message }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
