# Story 2.1: Rewrite properties API routes to use Supabase

Status: ready-for-dev

## Story

As an admin,
I want to create and edit properties stored in Supabase PostgreSQL,
so that property data persists reliably across deployments.

## Acceptance Criteria

1. **Given** GET `/api/properties` is called
   **When** the route queries `supabase.from('properties').select('*')`
   **Then** all properties are returned with `snake_case` to `camelCase` mapping (e.g. `max_guests` to `maxGuests`)

2. **Given** POST `/api/properties` is called with valid property data
   **When** the route inserts into the `properties` table
   **Then** a new property is created with all fields mapped from camelCase to snake_case
   **And** the response returns the created property with status 201

3. **Given** PUT `/api/properties` is called with an id and updated fields
   **When** the route updates the matching `properties` row
   **Then** the property is updated and returned

4. **Given** the old route imported from `@/lib/data`
   **When** the rewrite is complete
   **Then** `lib/data` is not imported; `createSupabaseServerClient()` is used instead

## Tasks / Subtasks

- [ ] Rewrite `app/api/properties/route.ts` GET handler (AC: #1, #4)
  - [ ] Remove `@/lib/data` imports
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Query `supabase.from('properties').select('*')`
  - [ ] Check for error: `if (error) throw error`
  - [ ] Map each row from snake_case to camelCase before returning
  - [ ] Return `NextResponse.json(mappedProperties)`
- [ ] Rewrite `app/api/properties/route.ts` POST handler (AC: #2, #4)
  - [ ] Parse request body (camelCase fields from frontend)
  - [ ] Map camelCase fields to snake_case for DB insert:
    - `maxGuests` -> `max_guests`
    - `title`, `description`, `price`, `location`, `images`, `amenities` (same in both)
  - [ ] Insert: `supabase.from('properties').insert({ ... }).select().single()`
  - [ ] Map response back to camelCase
  - [ ] Return with status 201
- [ ] Rewrite `app/api/properties/route.ts` PUT handler (AC: #3, #4)
  - [ ] Parse request body including `id`
  - [ ] Map camelCase to snake_case
  - [ ] Update: `supabase.from('properties').update({ ... }).eq('id', id).select().single()`
  - [ ] Map response back to camelCase
  - [ ] Return updated property
- [ ] Create snake_case/camelCase mapping helper (AC: #1, #2, #3)
  - [ ] Create `mapPropertyFromDb(row)` — converts DB row to TypeScript Property
  - [ ] Create `mapPropertyToDb(data)` — converts TypeScript Property to DB row
  - [ ] Place in the route file or in a shared utility

## Dev Notes

- **Field mapping is critical**. The DB uses `snake_case` and the frontend/API response uses `camelCase`. Every query result must be mapped before returning. Every insert/update must be mapped before writing.
- **Mapping fields for properties**:
  - `max_guests` <-> `maxGuests`
  - `created_at` <-> `createdAt`
  - `updated_at` <-> `updatedAt`
  - All other fields (`title`, `description`, `price`, `location`, `images`, `rating`, `amenities`) are single words and identical in both conventions.
- **RLS enforces admin-only writes** — the server client runs as the authenticated user, so only admins can INSERT/UPDATE/DELETE. No manual admin check needed in the route.
- **Error handling**: Wrap in try/catch, return `NextResponse.json({ error: message }, { status: 500 })`.
- **API response format**: Direct data, no wrapper object.
- **Always use `.select()` after `.insert()` or `.update()`** to get the returned row.

### Project Structure Notes

- File modified: `app/api/properties/route.ts`
- No new files created (mapping helpers go in the route file)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — DB column to TypeScript field mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — Routes updated]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — Supabase query error pattern]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
