# Story 3.3: Rebuild customer dashboard with Supabase session and user-scoped queries

Status: ready-for-dev

## Story

As a customer,
I want to see only my own bookings in my dashboard,
so that my booking information is private and accurate.

## Acceptance Criteria

1. **Given** `app/dashboard/page.tsx` currently uses `jose` to read the JWT and filters bookings by email
   **When** I rewrite it to use `createSupabaseServerClient()`
   **Then** it gets the user via `supabase.auth.getUser()`
   **And** queries bookings with `.eq('user_id', user.id)` (Supabase RLS also enforces this)

2. **Given** the user has bookings
   **When** the dashboard loads
   **Then** each booking card shows property title, dates, guest count, and status badge
   **And** property names are resolved by querying the properties table with the booking's property IDs

3. **Given** the user has no bookings
   **When** the dashboard loads
   **Then** an empty state message is shown with a link to browse properties

4. **Given** no user is logged in
   **When** `getUser()` returns null
   **Then** the user is redirected to `/login`

## Tasks / Subtasks

- [ ] Rewrite `app/dashboard/page.tsx` user authentication (AC: #1, #4)
  - [ ] Remove all `jose` imports and JWT parsing logic
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Import `redirect` from `next/navigation`
  - [ ] Get user: `const { data: { user } } = await supabase.auth.getUser()`
  - [ ] If no user, call `redirect('/login')`
- [ ] Fetch user's bookings from Supabase (AC: #1, #2)
  - [ ] Query: `supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false })`
  - [ ] Map results from snake_case to camelCase
- [ ] Resolve property names for bookings (AC: #2)
  - [ ] Extract unique `propertyId` values from bookings
  - [ ] Query properties: `supabase.from('properties').select('id, title').in('id', propertyIds)`
  - [ ] Create a lookup map: `{ [id]: title }`
  - [ ] Pass property titles to booking cards
- [ ] Handle empty state (AC: #3)
  - [ ] If bookings array is empty, show message with link to `/properties`
  - [ ] Preserve existing empty state UI if it exists, or create a simple one
- [ ] Update type imports
  - [ ] Replace any `@/lib/data` imports with `@/lib/types`
  - [ ] Ensure `Booking` type includes all needed fields

## Dev Notes

- **This page may be a Server Component or Client Component** — check the existing code. If it's a Server Component, use `createSupabaseServerClient()`. If it's a Client Component, it should fetch via API routes.
- **RLS double enforcement**: The query uses `.eq('user_id', user.id)` explicitly, AND Supabase RLS also limits reads to own bookings. Belt and suspenders.
- **Property title resolution**: Bookings store `property_id` but the UI needs property titles. Fetch properties by ID and create a lookup map rather than making N+1 queries.
- **Status badge colors** (from UX spec): pending = amber, confirmed = green, rejected = muted red, blocked = grey.
- **Booking field mapping**:
  - `property_id` -> `propertyId`
  - `start_date` -> `startDate`
  - `end_date` -> `endDate`
  - `guest_count` -> `guestCount`
  - `customer_name` -> `customerName`
- **Redirect pattern**: Use `redirect('/login')` from `next/navigation` for server-side redirect (not `NextResponse.redirect`).

### Project Structure Notes

- File modified: `app/dashboard/page.tsx`
- Removes dependency on `jose` library from this file
- No new files created

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Auth state]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
