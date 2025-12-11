import { NextResponse } from 'next/server';
import { getProperties, createProperty, updateProperty } from '@/lib/data';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const properties = await getProperties();

    // ... existing filtering logic logic ...

    // Since we filtered in the page component in the previous structure, 
    // this API might be returning all or we can move logic here. 
    // The previous implementation was:
    // export async function GET() { return NextResponse.json(await getProperties()); }
    // Let's keep it simple as it was likely returning all properties.
    return NextResponse.json(properties);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.title || !body.description || !body.price || !body.location) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newProperty = await createProperty({
            title: body.title,
            description: body.description,
            price: Number(body.price),
            location: body.location,
            images: body.images || [], // Handle array
            rating: 0, // Default for new
            maxGuests: Number(body.maxGuests) || 2,
            amenities: body.amenities || []
        });

        return NextResponse.json(newProperty, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();

        if (!body.id || !body.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedProperty = await updateProperty({
            id: body.id,
            title: body.title,
            description: body.description,
            price: Number(body.price),
            location: body.location,
            images: body.images || [],
            rating: body.rating || 0,
            maxGuests: Number(body.maxGuests),
            amenities: body.amenities || []
        });

        return NextResponse.json(updatedProperty);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
}
