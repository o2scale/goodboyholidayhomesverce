# Story 2.3: Update property detail page to fetch from Supabase

Status: ready-for-dev

## Story

As a customer,
I want to view a specific property's full details, gallery, and booking form,
so that I can decide whether to book.

## Acceptance Criteria

1. **Given** `app/properties/[id]/page.tsx` currently calls `getProperty(id)` and `getBookings()`
   **When** I rewrite it to use Supabase
   **Then** it queries `supabase.from('properties').select('*').eq('id', id).single()` for the property
   **And** queries `supabase.from('bookings').select('start_date, end_date').eq('property_id', id).in('status', ['confirmed', 'blocked'])` for blocked dates

2. **Given** the property ID does not exist in Supabase
   **When** the query returns null
   **Then** `notFound()` is called (404 page)

3. **Given** `generateStaticParams()` currently calls `getProperties()`
   **When** I remove it (properties now have UUID IDs and should be dynamic)
   **Then** the page renders dynamically for all property UUIDs

## Tasks / Subtasks

- [ ] Rewrite `app/properties/[id]/page.tsx` data fetching (AC: #1)
  - [ ] Remove `getProperty` and `getBookings` imports from `@/lib/data`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Fetch property: `supabase.from('properties').select('*').eq('id', id).single()`
  - [ ] Map property from snake_case to camelCase
  - [ ] Fetch blocked dates: `supabase.from('bookings').select('start_date, end_date').eq('property_id', id).in('status', ['confirmed', 'blocked'])`
  - [ ] Map booking dates from snake_case to camelCase (`start_date` -> `startDate`, `end_date` -> `endDate`)
  - [ ] Pass property and blocked dates to child components as before
- [ ] Handle 404 for missing properties (AC: #2)
  - [ ] Import `notFound` from `next/navigation`
  - [ ] If property query returns null/error, call `notFound()`
- [ ] Remove `generateStaticParams()` (AC: #3)
  - [ ] Delete the `generateStaticParams` export entirely
  - [ ] Properties now use UUID IDs — static generation is not practical
  - [ ] The page will render dynamically (default Next.js behavior without `generateStaticParams`)

## Dev Notes

- **This is a Server Component** — use `createSupabaseServerClient()`.
- **The `id` parameter is now a UUID** (not a numeric string). The Supabase `.eq('id', id)` query handles UUIDs natively.
- **Params in Next.js 16**: The `params` object may need to be awaited: `const { id } = await params`. Check the existing code pattern.
- **Blocked dates** are used by the `BookingForm` component to disable booked dates in the date picker. Only `confirmed` and `blocked` status bookings count as unavailable.
- **Do NOT change the visual layout** — the property detail page's gallery, amenities list, and booking form should render identically.
- **snake_case mapping**: `start_date` -> `startDate`, `end_date` -> `endDate`, `max_guests` -> `maxGuests`, etc.

### Project Structure Notes

- File modified: `app/properties/[id]/page.tsx`
- No new files created

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
