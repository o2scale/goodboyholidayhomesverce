# Story 1.5: Update root layout and Navbar to read Supabase session

Status: ready-for-dev

## Story

As a logged-in user,
I want the Navbar to display my name and role-appropriate links,
so that I know I'm authenticated and can navigate to the right areas.

## Acceptance Criteria

1. **Given** `app/layout.tsx` currently reads a `session` cookie with `jose`
   **When** I rewrite it to use `createSupabaseServerClient()`
   **Then** it calls `supabase.auth.getUser()` to get the current user
   **And** queries `profiles` table for `name` and `role`
   **And** passes `{ name, email, role }` to the `<Navbar>` component

2. **Given** no user is logged in
   **When** `getUser()` returns null
   **Then** `null` is passed to Navbar (existing Navbar handles this)

3. **Given** the old layout imported `jose` and `JWT_SECRET`
   **When** the rewrite is complete
   **Then** neither `jose` nor `JWT_SECRET` appear in `app/layout.tsx`

## Tasks / Subtasks

- [ ] Rewrite user session logic in `app/layout.tsx` (AC: #1, #2, #3)
  - [ ] Remove all `jose` imports and `JWT_SECRET` references
  - [ ] Remove any cookie-parsing logic for the `session` cookie
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] Call `const supabase = await createSupabaseServerClient()`
  - [ ] Call `const { data: { user } } = await supabase.auth.getUser()`
  - [ ] If user exists, read `name` and `role` from `user.user_metadata` (fast path, no DB query needed)
  - [ ] Alternatively, query profiles table: `supabase.from('profiles').select('name, role').eq('id', user.id).single()`
  - [ ] Build `currentUser = { name, email: user.email!, role }` or `null`
  - [ ] Pass `currentUser` to `<Navbar>` as the user prop
- [ ] Update Navbar logout handler if needed (AC: #1)
  - [ ] Verify `components/navbar.tsx` logout calls POST `/api/auth/logout` — if so, no change needed (Story 1.3 rewrote that route)
  - [ ] If Navbar handles logout client-side, ensure it uses `createSupabaseBrowserClient()` and calls `supabase.auth.signOut()`

## Dev Notes

- **Layout is a Server Component** — use `createSupabaseServerClient()`, not the browser client.
- **Two approaches for user data**: The architecture doc shows reading from `user.user_metadata` directly (fast, no DB query). The epics mention querying the profiles table. Either works — `user_metadata` is simpler and faster since it avoids a DB round-trip. Use `user.user_metadata.name` and `user.user_metadata.role`.
- **The Navbar component** likely already accepts a user prop with `{ name, email, role }` shape. Verify the existing prop interface before changing.
- **Do NOT change** the Navbar's visual design or link structure — only update the data source.
- **Error handling**: If `getUser()` fails, treat as no user (pass `null`). Do not crash the layout.

### Project Structure Notes

- File modified: `app/layout.tsx`
- Possibly modified: `components/navbar.tsx` (only if logout needs updating)
- No new files created

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Auth state in layout]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
