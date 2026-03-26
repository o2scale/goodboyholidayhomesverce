# Story 4.1: Rewrite users API routes with Supabase Admin API

Status: ready-for-dev

## Story

As an admin,
I want to manage users through Supabase,
so that user data is stored securely and role changes take effect immediately.

## Acceptance Criteria

1. **Given** GET `/api/users` is called by an admin
   **When** the route uses `getSupabaseAdmin()` to query profiles
   **Then** all profiles are returned with email joined from `supabaseAdmin.auth.admin.listUsers()`

2. **Given** POST `/api/users` is called with name, email, password, role
   **When** the route calls `admin.auth.admin.createUser()` with `email_confirm: true`
   **Then** a new auth user is created
   **And** the `handle_new_user` trigger creates a profile row
   **And** if phone is provided, the profile is updated

3. **Given** PATCH `/api/users/[id]` is called to change a user's role
   **When** the route updates `profiles.role`
   **Then** it ALSO calls `admin.auth.admin.updateUserById(id, { user_metadata: { role } })` to sync the role
   **And** middleware immediately reads the new role on the next request

4. **Given** DELETE `/api/users/[id]` is called
   **When** the route calls `admin.auth.admin.deleteUser(id)`
   **Then** the auth user is deleted
   **And** the profiles row is cascade-deleted via the foreign key

5. **Given** a non-admin user calls any users endpoint
   **When** `requireAdmin()` checks the current Supabase session
   **Then** the route returns status 401

6. **Given** `app/admin/page.tsx` imports `Booking, Property` from `@/lib/data`
   **When** I update the import
   **Then** it imports from `@/lib/types`

## Tasks / Subtasks

- [ ] Create admin auth check helper (AC: #5)
  - [ ] In the users route file (or shared utility), create `requireAdmin()` function
  - [ ] Uses `createSupabaseServerClient()` to get user via `supabase.auth.getUser()`
  - [ ] Checks `user.user_metadata.role === 'admin'`
  - [ ] Returns user if admin, throws/returns 401 if not
- [ ] Rewrite `app/api/users/route.ts` GET handler (AC: #1)
  - [ ] Import `getSupabaseAdmin` from `@/lib/supabase/admin`
  - [ ] Call `requireAdmin()` first
  - [ ] Get admin client: `const admin = getSupabaseAdmin()`
  - [ ] Query profiles: `admin.from('profiles').select('*')`
  - [ ] Get auth users: `admin.auth.admin.listUsers()`
  - [ ] Join email from auth users to profiles by matching `id`
  - [ ] Map to camelCase and return
- [ ] Rewrite `app/api/users/route.ts` POST handler (AC: #2)
  - [ ] Call `requireAdmin()` first
  - [ ] Parse body: `name`, `email`, `password`, `role`, `phone`
  - [ ] Create auth user: `admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role } })`
  - [ ] If phone provided, update profile: `admin.from('profiles').update({ phone }).eq('id', user.id)`
  - [ ] Return created user with status 201
- [ ] Rewrite `app/api/users/[id]/route.ts` PATCH handler (AC: #3)
  - [ ] Call `requireAdmin()` first
  - [ ] Parse body: `name`, `phone`, `role`
  - [ ] Update profile: `admin.from('profiles').update({ name, phone, role }).eq('id', id)`
  - [ ] **CRITICAL**: If role changed, ALSO sync to auth metadata: `admin.auth.admin.updateUserById(id, { user_metadata: { role } })`
  - [ ] Return updated user
- [ ] Rewrite `app/api/users/[id]/route.ts` DELETE handler (AC: #4)
  - [ ] Call `requireAdmin()` first
  - [ ] Delete auth user: `admin.auth.admin.deleteUser(id)`
  - [ ] Profile cascade-deletes automatically via FK constraint
  - [ ] Return `{ success: true }`
- [ ] Update `app/admin/page.tsx` type imports (AC: #6)
  - [ ] Change `import { Booking, Property } from '@/lib/data'` to `import { Booking, Property } from '@/lib/types'`
  - [ ] Update any `User` type references to `Profile`

## Dev Notes

- **CRITICAL: Dual role sync** — When updating a user's role, you MUST update BOTH:
  1. `profiles.role` (source of truth for DB queries)
  2. `auth.users.raw_user_meta_data.role` (read by middleware from JWT)
  If you only update profiles, the middleware will read the OLD role from the JWT until the user re-authenticates.
- **Use `getSupabaseAdmin()` (admin client)** for ALL operations in users routes — this bypasses RLS and has elevated permissions to manage auth users.
- **Do NOT use `createSupabaseServerClient()`** for the actual data operations in this route. The server client respects RLS, but admin needs to read ALL profiles and manage ALL users.
- **However, use `createSupabaseServerClient()`** for the `requireAdmin()` check — this reads the current user's session to verify they are an admin.
- **Email join**: Auth users have email, profiles do not. To return a complete user object, fetch both and join on `id`.
- **`email_confirm: true`**: Skip email verification for admin-created users.
- **Profile field mapping**: `created_at` -> `createdAt`, `updated_at` -> `updatedAt`. Other fields (name, phone, role) are the same in both conventions.
- **Remove the old `isAdmin()` helper** that split cookies manually.

### Project Structure Notes

- Files modified: `app/api/users/route.ts`, `app/api/users/[id]/route.ts`, `app/admin/page.tsx`
- Remove old `isAdmin()` helper if it exists in these files
- No new files created

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Role storage dual location]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — Admin API pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries — API Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
