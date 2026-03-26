import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Property } from '@/lib/types';

/* ── snake_case row → camelCase Property ── */
function toProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    price: row.price as number,
    location: row.location as string,
    images: (row.images as string[]) ?? [],
    rating: (row.rating as number) ?? 0,
    maxGuests: row.max_guests as number,
    amenities: (row.amenities as string[]) ?? [],
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('properties').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(toProperty));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.description || body.price === undefined || !body.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('properties')
      .insert({
        title: body.title,
        description: body.description,
        price: Number(body.price),
        location: body.location,
        images: body.images || [],
        rating: 0,
        max_guests: Number(body.maxGuests) || 2,
        amenities: body.amenities || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toProperty(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('properties')
      .update({
        title: body.title,
        description: body.description,
        price: Number(body.price),
        location: body.location,
        images: body.images || [],
        rating: body.rating ?? 0,
        max_guests: Number(body.maxGuests),
        amenities: body.amenities || [],
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toProperty(data));
  } catch {
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}
