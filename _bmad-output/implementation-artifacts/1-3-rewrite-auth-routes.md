# Story 1.3: Rewrite auth API routes to use Supabase Auth

Status: ready-for-dev

## Story

As a user,
I want to register, log in, and log out using Supabase Auth,
so that my credentials are securely managed and my session persists.

## Acceptance Criteria

1. **Given** a user submits valid email and password to POST `/api/auth/register`
   **When** the route calls `supabase.auth.signUp()` with `user_metadata: { name, role: 'customer' }`
   **Then** a new auth user is created in Supabase
   **And** the `handle_new_user` trigger creates a profiles row
   **And** if phone is provided, it is saved to the profiles table
   **And** the response is `{ success: true }`

2. **Given** a user submits valid credentials to POST `/api/auth/login`
   **When** the route calls `supabase.auth.signInWithPassword()`
   **Then** Supabase sets session cookies automatically via the server client
   **And** the response includes `{ success: true, role }`
   **And** the role is read from `user.user_metadata.role`

3. **Given** a logged-in user calls POST `/api/auth/logout`
   **When** the route calls `supabase.auth.signOut()`
   **Then** the session cookies are cleared
   **And** the response is `{ success: true }`

4. **Given** invalid credentials are submitted to login
   **When** Supabase returns an error
   **Then** the route returns `{ error: 'Invalid credentials' }` with status 401

5. **Given** registration is attempted with an existing email
   **When** Supabase returns an error
   **Then** the route returns the Supabase error message with status 400

## Tasks / Subtasks

- [ ] Rewrite `app/api/auth/register/route.ts` (AC: #1, #5)
  - [ ] Remove all imports from `@/lib/data` and `jose`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] POST handler: parse body for `name`, `email`, `password`, `phone`
  - [ ] Call `supabase.auth.signUp({ email, password, options: { data: { name, role: 'customer' } } })`
  - [ ] If phone provided, update profiles table: `supabase.from('profiles').update({ phone }).eq('id', user.id)`
  - [ ] Return `{ success: true }` on success
  - [ ] Return Supabase error message with status 400 on failure
- [ ] Rewrite `app/api/auth/login/route.ts` (AC: #2, #4)
  - [ ] Remove all imports from `@/lib/data` and `jose`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] POST handler: parse body for `email`, `password`
  - [ ] Call `supabase.auth.signInWithPassword({ email, password })`
  - [ ] On success: return `{ success: true, role: user.user_metadata.role }`
  - [ ] On error: return `{ error: 'Invalid credentials' }` with status 401
- [ ] Rewrite `app/api/auth/logout/route.ts` (AC: #3)
  - [ ] Remove all imports from `jose`
  - [ ] Import `createSupabaseServerClient` from `@/lib/supabase/server`
  - [ ] POST handler: call `supabase.auth.signOut()`
  - [ ] Return `{ success: true }`

## Dev Notes

- **Architecture note**: The architecture doc says to DELETE auth routes and handle auth client-side. However, the epics explicitly say to REWRITE these routes to use Supabase Auth. Follow the epics — keep the routes but replace the implementation. The existing login/register pages call these API routes via fetch, so they must continue to exist.
- **Server client, not browser client**: Auth routes use `createSupabaseServerClient()` — the server client correctly sets cookies on the response.
- **Phone handling**: The `handle_new_user()` trigger only sets `name` and `role` from user metadata. Phone must be updated separately after signup.
- **Error handling pattern**: Always wrap in try/catch, return `NextResponse.json({ error: message }, { status: code })`.
- **Do NOT remove the route files** — rewrite them in place.
- **Do NOT import from `@/lib/data`** — that module will be deleted in Story 5.2.

### Project Structure Notes

- Files modified: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- No new files created
- Remove all `jose` and `@/lib/data` imports from these files

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Login/Register/Logout patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
