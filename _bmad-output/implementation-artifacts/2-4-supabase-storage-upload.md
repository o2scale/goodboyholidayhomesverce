# Story 2.4: Replace /api/upload with direct Supabase Storage upload

Status: ready-for-dev

## Story

As an admin,
I want to upload property images directly to Supabase Storage from the browser,
so that images persist across Vercel deploys and are served via CDN.

## Acceptance Criteria

1. **Given** `components/admin/property-form.tsx` currently uploads to `/api/upload`
   **When** I rewrite the upload handler to use `createSupabaseBrowserClient()`
   **Then** files are uploaded via `supabase.storage.from('property-images').upload(path, file)`
   **And** the public URL is obtained via `supabase.storage.from('property-images').getPublicUrl(path)`
   **And** the public URL is added to the images array

2. **Given** a file is selected for upload
   **When** the upload completes successfully
   **Then** a thumbnail preview appears immediately using the Supabase Storage CDN URL

3. **Given** the 15-image limit
   **When** the user tries to upload beyond 15 images
   **Then** an alert message prevents the upload
   **And** the count display shows "X / 15 images"

4. **Given** `app/api/upload/route.ts` is no longer needed
   **When** this story is complete
   **Then** the `/api/upload` route file is deleted

## Tasks / Subtasks

- [ ] Rewrite upload handler in `components/admin/property-form.tsx` (AC: #1, #2)
  - [ ] Import `createSupabaseBrowserClient` from `@/lib/supabase/client`
  - [ ] Create Supabase browser client instance
  - [ ] Replace fetch to `/api/upload` with direct Supabase Storage upload:
    - Generate unique file path: e.g., `${Date.now()}-${file.name}`
    - Upload: `supabase.storage.from('property-images').upload(path, file)`
    - Get public URL: `supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl`
  - [ ] Add the public URL to the images array state
  - [ ] Show thumbnail preview using the CDN URL
- [ ] Enforce 15-image limit (AC: #3)
  - [ ] Before upload, check `images.length >= 15`
  - [ ] If at limit, show alert and return early
  - [ ] Display "X / 15 images" count in the UI
- [ ] Delete `app/api/upload/route.ts` (AC: #4)
  - [ ] Remove the file entirely
  - [ ] Verify no other code references `/api/upload`

## Dev Notes

- **This is a Client Component** (`"use client"`) — use `createSupabaseBrowserClient()`, not the server client.
- **Upload flow change**:
  - Old: `PropertyForm` -> `POST /api/upload` -> server writes to `public/uploads/` -> returns `/uploads/filename`
  - New: `PropertyForm` -> `supabase.storage.from('property-images').upload(path, file)` -> returns Supabase public URL
- **File path naming**: Use `${Date.now()}-${file.name}` to avoid collisions. Do not include slashes/subdirectories unless intentional.
- **Public bucket**: The `property-images` bucket must be set as public in Supabase dashboard for `getPublicUrl()` to work. This is a manual setup step, not code.
- **Storage RLS**: Public read (anyone), admin-only insert/delete. The browser client authenticates as the admin user, so uploads will work for admins.
- **URL format**: Supabase Storage public URLs look like `https://<project-ref>.supabase.co/storage/v1/object/public/property-images/filename.jpg`
- **Error handling**: If upload fails, show an error message. Do not crash the form.
- **Image removal**: If the existing form supports removing images, that should also use `supabase.storage.from('property-images').remove([path])`.

### Project Structure Notes

- File modified: `components/admin/property-form.tsx`
- File deleted: `app/api/upload/route.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Upload flow change]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Property Image Upload]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries — PropertyForm uses browser client]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
