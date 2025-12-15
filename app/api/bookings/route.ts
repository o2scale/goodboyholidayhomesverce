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

import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { propertyId, startDate, endDate, guestCount, customerName, customerEmail, customerPhone, includeMeals } = body;

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
            customerPhone,
            includeMeals
        });

        // Send Email Notification
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'goodboyholidayhomes@gmail.com',
                    pass: process.env.EMAIL_PASSWORD || 'your-app-password-here' // Needs App Password
                }
            });

            await transporter.sendMail({
                from: '"Goodboy Holiday Homes" <goodboyholidayhomes@gmail.com>',
                to: "goodboyholidayhomes@gmail.com",
                subject: `New Booking Request: ${customerName}`,
                text: `
                    New booking request received!
                    
                    Property ID: ${propertyId}
                    Customer: ${customerName}
                    Phone: ${customerPhone}
                    Email: ${customerEmail}
                    Guests: ${guestCount}
                    Dates: ${startDate} to ${endDate}
                    Meals Included: ${includeMeals ? "Yes" : "No"}
                `,
                html: `
                    <h2>New Booking Request</h2>
                    <p><strong>Property ID:</strong> ${propertyId}</p>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Phone:</strong> ${customerPhone}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Guests:</strong> ${guestCount}</p>
                    <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Meals Included:</strong> ${includeMeals ? "Yes" : "No"}</p>
                `
            });
        } catch (emailError) {
            console.error("Failed to send email notification:", emailError);
            // Don't fail the request, just log the error
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
