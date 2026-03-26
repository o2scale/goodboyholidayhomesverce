# Story 3.1: Rewrite bookings API routes with Supabase and atomic conflict detection

Status: ready-for-dev

## Story

As a customer,
I want to submit a booking request that is reliably stored,
so that my booking is not lost due to file system issues.

## Acceptance Criteria

1. **Given** POST `/api/bookings` is called with valid booking data
   **When** the route inserts into the `bookings` table
   **Then** a new booking is created with `status = 'pending'`
   **And** `user_id` is set to the current Supabase user's ID (if logged in) or null
   **And** all field names are mapped from camelCase to snake_case

2. **Given** the email notification pattern
   **When** a booking is created successfully
   **Then** an email is sent to `goodboyholidayhomes@gmail.com` via nodemailer
   **And** if the email fails, the booking still succeeds (inner try/catch)

3. **Given** GET `/api/bookings` is called
   **When** the route queries Supabase
   **Then** all bookings are returned with snake_case to camelCase mapping
   **And** sorted by `created_at` descending

4. **Given** PATCH `/api/bookings/[id]` is called to confirm a booking
   **When** the route sets `status = 'confirmed'`
   **Then** it first calls `supabase.rpc('check_booking_conflict', { ... })` to check for overlapping confirmed bookings
   **And** if a conflict exists, returns status 409 with error message
   **And** if no conflict, updates the booking status

5. **Given** PATCH `/api/bookings/[id]` is called with `status = 'blocked'`
   **When** the admin blocks a date range
   **Then** the status is accepted as valid (in addition to pending/confirmed/rejected)

## Tasks / Subtasks

- [ ] Rewrite `app/api/bookings/route.ts` GET handler (AC: #3)
  - [ ] Remove `@/lib/data` imports
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Query: `supabase.from('bookings').select('*').order('created_at', { ascending: false })`
  - [ ] Map results from snake_case to camelCase
  - [ ] Return `NextResponse.json(mappedBookings)`
- [ ] Rewrite `app/api/bookings/route.ts` POST handler (AC: #1, #2)
  - [ ] Parse request body (camelCase fields)
  - [ ] Get current user: `supabase.auth.getUser()` — set `user_id` if logged in, null otherwise
  - [ ] Map camelCase to snake_case:
    - `propertyId` -> `property_id`
    - `startDate` -> `start_date`
    - `endDate` -> `end_date`
    - `guestCount` -> `guest_count`
    - `customerName` -> `customer_name`
    - `customerEmail` -> `customer_email`
    - `customerPhone` -> `customer_phone`
    - `includeMeals` -> `include_meals`
  - [ ] Insert with `status: 'pending'`
  - [ ] After successful insert, send email via nodemailer (inner try/catch)
  - [ ] Return created booking with status 201
- [ ] Rewrite `app/api/bookings/[id]/route.ts` PATCH handler (AC: #4, #5)
  - [ ] Remove `@/lib/data` imports
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Parse request body for `status` (and optionally other fields)
  - [ ] If `status === 'confirmed'`:
    - [ ] First fetch the booking to get `property_id`, `start_date`, `end_date`
    - [ ] Call `supabase.rpc('check_booking_conflict', { p_property_id, p_start_date, p_end_date, p_exclude_id: id })`
    - [ ] If conflict exists (returns true), return `{ error: 'Booking conflicts with existing confirmed booking' }` with status 409
  - [ ] Update booking: `supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()`
  - [ ] Map response from snake_case to camelCase
  - [ ] Return updated booking

## Dev Notes

- **Field mapping for bookings** (DB snake_case to TypeScript camelCase):
  - `property_id` <-> `propertyId`
  - `user_id` <-> `userId`
  - `start_date` <-> `startDate`
  - `end_date` <-> `endDate`
  - `guest_count` <-> `guestCount`
  - `customer_name` <-> `customerName`
  - `customer_email` <-> `customerEmail`
  - `customer_phone` <-> `customerPhone`
  - `include_meals` <-> `includeMeals`
  - `created_at` <-> `createdAt`
  - `updated_at` <-> `updatedAt`
- **Conflict detection is atomic**: The `check_booking_conflict()` PostgreSQL function runs server-side and checks for overlapping date ranges with status = 'confirmed'. The `p_exclude_id` parameter excludes the booking being confirmed from the conflict check.
- **RPC call format**: `supabase.rpc('check_booking_conflict', { p_property_id: ..., p_start_date: ..., p_end_date: ..., p_exclude_id: ... })`
- **Email notification**: Keep the existing nodemailer logic. Wrap in inner try/catch so email failure never blocks booking creation.
- **Error handling**: Outer try/catch for the whole handler. Return `NextResponse.json({ error }, { status })`.
- **Blocked status**: Admin can set `status = 'blocked'` to block date ranges. This is a valid status alongside pending/confirmed/rejected.

### Project Structure Notes

- Files modified: `app/api/bookings/route.ts`, `app/api/bookings/[id]/route.ts`
- No new files created
- Nodemailer logic is preserved, not rewritten

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — check_booking_conflict() function]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — DB column to TypeScript field mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Booking Creation and Admin Confirms Booking]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
