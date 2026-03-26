# Story 5.1: Create shared lib/types.ts and update all component imports

Status: ready-for-dev

## Story

As a developer,
I want centralized TypeScript types that reflect Supabase data shapes,
so that all components use consistent, accurate type definitions.

## Acceptance Criteria

1. **Given** `lib/data.ts` currently exports `Property`, `Booking`, and `User` interfaces
   **When** I create `lib/types.ts`
   **Then** it exports `Property`, `Booking`, and `Profile` interfaces matching the Supabase schema
   **And** `Profile` replaces `User` (no `passwordHash` field; includes `email` from auth.users)
   **And** all camelCase field names are used (matching the API response mapping)

2. **Given** multiple components import types from `@/lib/data`
   **When** all type imports are updated
   **Then** `components/property-card.tsx`, `components/booking-form.tsx`, and `app/admin/page.tsx` import from `@/lib/types`
   **And** no component imports from `@/lib/data`

## Tasks / Subtasks

- [ ] Create `lib/types.ts` with all interfaces (AC: #1)
  - [ ] Export `Property` interface:
    - `id: string` (UUID)
    - `title: string`
    - `description: string`
    - `price: number`
    - `location: string`
    - `images: string[]`
    - `rating: number`
    - `maxGuests: number`
    - `amenities: string[]`
    - `createdAt: string`
    - `updatedAt: string`
  - [ ] Export `Booking` interface:
    - `id: string` (UUID)
    - `propertyId: string`
    - `userId: string | null`
    - `startDate: string`
    - `endDate: string`
    - `guestCount: number`
    - `status: 'pending' | 'confirmed' | 'rejected' | 'blocked'`
    - `customerName: string`
    - `customerEmail: string`
    - `customerPhone: string | null`
    - `includeMeals: boolean`
    - `createdAt: string`
    - `updatedAt: string`
  - [ ] Export `Profile` interface (replaces old `User`):
    - `id: string` (UUID)
    - `name: string`
    - `email: string` (joined from auth.users, not in profiles table)
    - `phone: string | null`
    - `role: 'admin' | 'customer'`
    - `createdAt: string`
    - `updatedAt: string`
- [ ] Update all component type imports (AC: #2)
  - [ ] `components/property-card.tsx`: change `@/lib/data` to `@/lib/types`
  - [ ] `components/booking-form.tsx`: change `@/lib/data` to `@/lib/types`
  - [ ] `app/admin/page.tsx`: change `@/lib/data` to `@/lib/types`, rename `User` to `Profile` if applicable
  - [ ] Search all files for `from '@/lib/data'` or `from "@/lib/data"` — update every occurrence
  - [ ] Any file that imported `User` type should now import `Profile`

## Dev Notes

- **All field names are camelCase** — these types represent the API response shape AFTER snake_case to camelCase mapping. They do NOT match the raw DB columns.
- **`Profile` replaces `User`**: The old `User` type had `passwordHash`. The new `Profile` has no password field (Supabase Auth manages passwords). `Profile` includes `email` which comes from `auth.users`, not the `profiles` table — it is joined in API routes.
- **`status` is a union type**: `'pending' | 'confirmed' | 'rejected' | 'blocked'` — not just a string.
- **`price`**: The DB stores as `numeric(10,2)` but Supabase returns it as a number in JS. Type as `number`.
- **If this story runs AFTER earlier stories** that already created a minimal `lib/types.ts`, replace that file with the complete version.
- **If this story runs BEFORE other stories**, components may still import from `@/lib/data` for function calls (like `getProperties()`). Only update TYPE imports here — function imports will be removed in their respective stories.

### Project Structure Notes

- New file: `lib/types.ts`
- Files modified: `components/property-card.tsx`, `components/booking-form.tsx`, `app/admin/page.tsx`, and any other file importing types from `@/lib/data`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — TypeScript/API Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns — lib/types.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Schema columns mapped to camelCase]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
