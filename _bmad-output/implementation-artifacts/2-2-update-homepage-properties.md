# Story 2.2: Update homepage and properties listing to fetch from Supabase

Status: ready-for-dev

## Story

As a customer,
I want to browse properties on the homepage and properties page,
so that I can discover available holiday homes.

## Acceptance Criteria

1. **Given** `app/page.tsx` currently calls `getProperties()` from `lib/data`
   **When** I rewrite it to use `createSupabaseServerClient()`
   **Then** it queries `supabase.from('properties').select('*')` and maps results to `Property[]`
   **And** properties display in the same grid layout with `PropertyCard` and `FadeIn`

2. **Given** `app/properties/page.tsx` currently calls `getProperties()` and `getBookings()`
   **When** I rewrite it to use Supabase server client
   **Then** properties are fetched from Supabase
   **And** bookings are fetched with `status != 'rejected'` for availability filtering
   **And** location, guest count, and date availability filters work correctly

3. **Given** `PropertyCard` currently imports `Property` from `@/lib/data`
   **When** I update the import
   **Then** it imports `Property` from `@/lib/types` (shared types file)

## Tasks / Subtasks

- [ ] Update `app/page.tsx` to fetch from Supabase (AC: #1)
  - [ ] Remove `getProperties` import from `@/lib/data`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Query: `const { data, error } = await supabase.from('properties').select('*')`
  - [ ] Map results from snake_case to camelCase (same mapping as Story 2.1)
  - [ ] Preserve existing `PropertyCard` + `FadeIn` grid layout — do not change UI
- [ ] Update `app/properties/page.tsx` to fetch from Supabase (AC: #2)
  - [ ] Remove `getProperties` and `getBookings` imports from `@/lib/data`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Fetch properties: `supabase.from('properties').select('*')`
  - [ ] Fetch bookings for availability: `supabase.from('bookings').select('*').neq('status', 'rejected')`
  - [ ] Map both result sets from snake_case to camelCase
  - [ ] Preserve existing filter logic (location, guest count, date availability)
- [ ] Update `PropertyCard` type import (AC: #3)
  - [ ] Change `import { Property } from '@/lib/data'` to `import { Property } from '@/lib/types'`
  - [ ] Note: `lib/types.ts` is created in Story 5.1 — if not yet created, create a minimal version here with just the `Property` interface

## Dev Notes

- **These are Server Components** — use `createSupabaseServerClient()`, not the browser client.
- **snake_case to camelCase mapping** must happen for every property row. Reuse or copy the mapping logic from Story 2.1.
- **Booking availability filtering**: The existing code checks if dates overlap with non-rejected bookings. The Supabase query should filter server-side where possible: `.neq('status', 'rejected')` fetches only relevant bookings.
- **Do NOT change the visual layout** — preserve `PropertyCard`, `FadeIn`, grid classes, and any existing animations.
- **If `lib/types.ts` does not exist yet** (Story 5.1), create a minimal file with just the `Property` interface to unblock this story. Story 5.1 will expand it.
- **No intermediate data layer** — call Supabase directly in the Server Component, do not create wrapper functions.

### Project Structure Notes

- Files modified: `app/page.tsx`, `app/properties/page.tsx`, `components/property-card.tsx`
- Possibly created (if Story 5.1 not done yet): `lib/types.ts` (minimal)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns — No intermediate abstraction layer]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — DB column to TypeScript field mapping]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
