# Story 3.2: Update booking form and property page for Supabase availability data

Status: ready-for-dev

## Story

As a customer,
I want the booking date picker to show which dates are already taken,
so that I can choose available dates without guessing.

## Acceptance Criteria

1. **Given** the property detail page passes `blockedDates` to `BookingForm`
   **When** blocked dates are fetched from Supabase (confirmed + blocked bookings for this property)
   **Then** the date picker shows these dates as disabled/greyed out

2. **Given** `BookingForm` currently imports `Property` from `@/lib/data`
   **When** I update the import
   **Then** it imports from `@/lib/types`

## Tasks / Subtasks

- [ ] Verify blocked dates data flow from Story 2.3 (AC: #1)
  - [ ] Confirm `app/properties/[id]/page.tsx` fetches confirmed + blocked bookings and passes them to `BookingForm`
  - [ ] Verify the date format matches what BookingForm expects (ISO date strings)
  - [ ] Ensure the property detail page maps `start_date` -> `startDate`, `end_date` -> `endDate` before passing to BookingForm
- [ ] Update `BookingForm` type imports (AC: #2)
  - [ ] Change `import { Property } from '@/lib/data'` to `import { Property } from '@/lib/types'`
  - [ ] Verify `Booking` type import if used — update similarly
- [ ] Verify date picker integration (AC: #1)
  - [ ] Confirm the date picker component receives blocked date ranges
  - [ ] Verify disabled dates render correctly (greyed out / not selectable)
  - [ ] No changes needed if the existing date picker logic works with the same data shape

## Dev Notes

- **This story is primarily about wiring** — Story 2.3 already fetches the blocked dates from Supabase. This story ensures the `BookingForm` component receives and uses that data correctly.
- **Blocked dates** include both `confirmed` and `blocked` status bookings. The query in Story 2.3 handles this: `.in('status', ['confirmed', 'blocked'])`.
- **Type import update**: If `lib/types.ts` does not exist yet, create a minimal version with the `Property` interface (or ensure Story 5.1 runs first).
- **Do NOT change the BookingForm's visual design** — only update data source and type imports.
- **The BookingForm is a Client Component** (`"use client"`) — it receives data as props from the Server Component parent (property detail page).

### Project Structure Notes

- File modified: `components/booking-form.tsx`
- Dependency on Story 2.3 (property detail page fetches data)
- Dependency on Story 5.1 (lib/types.ts) or creates minimal types

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
