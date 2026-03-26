/**
 * One-time script to migrate existing Unsplash image URLs to Supabase Storage.
 *
 * Usage: npx tsx scripts/migrate-images.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'property';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Run with: npx tsx -r dotenv/config scripts/migrate-images.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`  ⚠ Failed to download: ${url} (${res.status})`);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
  } catch (e) {
    console.warn(`  ⚠ Download error for ${url}:`, (e as Error).message);
    return null;
  }
}

async function uploadToStorage(buffer: Buffer, contentType: string, path: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.warn(`  ⚠ Upload error for ${path}:`, error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function migrate() {
  console.log('Fetching properties...');
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, title, images');

  if (error || !properties) {
    console.error('Failed to fetch properties:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${properties.length} properties.\n`);

  for (const prop of properties) {
    console.log(`📦 ${prop.title} (${prop.images.length} images)`);
    const newUrls: string[] = [];

    for (let i = 0; i < prop.images.length; i++) {
      const url = prop.images[i];

      // Skip if already a Supabase URL
      if (url.includes('supabase.co/storage')) {
        console.log(`  ✓ Image ${i} already on Supabase, skipping`);
        newUrls.push(url);
        continue;
      }

      console.log(`  ↓ Downloading image ${i}...`);
      const downloaded = await downloadImage(url);
      if (!downloaded) {
        console.log(`  ✗ Skipping image ${i} (download failed), keeping original URL`);
        newUrls.push(url);
        continue;
      }

      const ext = downloaded.contentType.includes('png') ? 'png' : 'jpg';
      const storagePath = `${prop.id}/image-${i}.${ext}`;

      console.log(`  ↑ Uploading to ${storagePath} (${(downloaded.buffer.length / 1024).toFixed(0)}KB)...`);
      const publicUrl = await uploadToStorage(downloaded.buffer, downloaded.contentType, storagePath);

      if (publicUrl) {
        console.log(`  ✓ Uploaded: ${publicUrl}`);
        newUrls.push(publicUrl);
      } else {
        console.log(`  ✗ Upload failed, keeping original URL`);
        newUrls.push(url);
      }
    }

    // Update the property with new URLs
    const { error: updateError } = await supabase
      .from('properties')
      .update({ images: newUrls })
      .eq('id', prop.id);

    if (updateError) {
      console.error(`  ✗ Failed to update property: ${updateError.message}`);
    } else {
      console.log(`  ✅ Updated ${prop.title} with ${newUrls.length} images\n`);
    }
  }

  console.log('🎉 Migration complete!');
}

migrate();
