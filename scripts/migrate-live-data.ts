/**
 * One-time script to migrate live Vercel properties + images to Supabase.
 * Downloads images from goodboyholidayhomes.com, uploads to Supabase Storage,
 * and replaces seed data with real properties.
 *
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-live-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'property';
const LIVE_SITE = 'https://goodboyholidayhomes.com';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface LiveProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  rating: number;
  maxGuests: number;
  amenities: string[];
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`  ⚠ Failed to download: ${url} (${res.status})`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn(`  ⚠ Download error:`, (e as Error).message);
    return null;
  }
}

async function migrate() {
  // 1. Fetch live properties
  console.log('Fetching live properties from Vercel...');
  const res = await fetch(`${LIVE_SITE}/api/properties`);
  const liveProperties: LiveProperty[] = await res.json();
  console.log(`Found ${liveProperties.length} properties.\n`);

  // 2. Delete existing seed properties in Supabase
  console.log('Clearing seed data from Supabase...');
  const { error: deleteError } = await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Failed to clear seed data:', deleteError.message);
    // Continue anyway — inserts may still work
  }

  // 3. Process each property
  for (const prop of liveProperties) {
    console.log(`\n📦 ${prop.title} (${prop.images.length} images)`);

    // Insert property first to get the UUID
    const { data: inserted, error: insertError } = await supabase
      .from('properties')
      .insert({
        title: prop.title,
        description: prop.description,
        price: prop.price,
        location: prop.location,
        images: [], // will update after uploading
        rating: prop.rating,
        max_guests: prop.maxGuests,
        amenities: prop.amenities,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error(`  ✗ Failed to insert property: ${insertError?.message}`);
      continue;
    }

    const propertyId = inserted.id;
    console.log(`  ✓ Created property with UUID: ${propertyId}`);

    // Upload images
    const newImageUrls: string[] = [];
    for (let i = 0; i < prop.images.length; i++) {
      const imagePath = prop.images[i];
      const fullUrl = imagePath.startsWith('http') ? imagePath : `${LIVE_SITE}${imagePath}`;

      console.log(`  ↓ Downloading image ${i}: ${imagePath.split('/').pop()}...`);
      const buffer = await downloadImage(fullUrl);
      if (!buffer) {
        console.log(`  ✗ Skipping image ${i}`);
        continue;
      }

      const ext = imagePath.includes('.png') ? 'png' : 'jpeg';
      const storagePath = `${propertyId}/image-${i}.${ext}`;

      console.log(`  ↑ Uploading (${(buffer.length / 1024).toFixed(0)}KB)...`);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) {
        console.warn(`  ⚠ Upload failed: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      newImageUrls.push(urlData.publicUrl);
      console.log(`  ✓ Uploaded`);
    }

    // Update property with Supabase Storage URLs
    const { error: updateError } = await supabase
      .from('properties')
      .update({ images: newImageUrls })
      .eq('id', propertyId);

    if (updateError) {
      console.error(`  ✗ Failed to update images: ${updateError.message}`);
    } else {
      console.log(`  ✅ ${prop.title}: ${newImageUrls.length}/${prop.images.length} images migrated`);
    }
  }

  // Also fetch and migrate bookings
  console.log('\n\nFetching live bookings...');
  try {
    const bookingsRes = await fetch(`${LIVE_SITE}/api/bookings`);
    const liveBookings = await bookingsRes.json();
    if (Array.isArray(liveBookings) && liveBookings.length > 0) {
      console.log(`Found ${liveBookings.length} bookings (not migrating — old IDs won't match new property UUIDs)`);
    } else {
      console.log('No bookings to migrate.');
    }
  } catch {
    console.log('Could not fetch bookings (auth required or none exist).');
  }

  console.log('\n🎉 Live data migration complete!');
}

migrate();
