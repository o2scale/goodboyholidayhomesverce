# Story 1.4: Rewrite middleware for Supabase SSR session management

Status: ready-for-dev

## Story

As a user,
I want protected routes to enforce authentication and role-based access,
so that only admins access /admin/* and only customers access /dashboard/*.

## Acceptance Criteria

1. **Given** `middleware.ts` currently uses `jose` for JWT verification
   **When** I rewrite it to use `createServerClient` from `@supabase/ssr`
   **Then** it creates a Supabase client with request/response cookie handlers
   **And** calls `supabase.auth.getUser()` to refresh and validate the session

2. **Given** an unauthenticated user visits `/admin/anything` or `/dashboard/anything`
   **When** `getUser()` returns no user
   **Then** they are redirected to `/login?callbackUrl=<encoded-url>`

3. **Given** a customer visits `/admin/anything`
   **When** `user.user_metadata.role` is not `'admin'`
   **Then** they are redirected to `/`

4. **Given** an admin visits `/dashboard/anything`
   **When** `user.user_metadata.role` is not `'customer'`
   **Then** they are redirected to `/`

5. **Given** a valid user visits a non-protected route
   **When** the path does not start with `/admin` or `/dashboard`
   **Then** the middleware passes through without checks

6. **Given** the old middleware imported from `jose`
   **When** the rewrite is complete
   **Then** `jose` is no longer imported in `middleware.ts`

## Tasks / Subtasks

- [ ] Rewrite `middleware.ts` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Remove all `jose` imports and `JWT_SECRET` references
  - [ ] Import `createServerClient` from `@supabase/ssr`
  - [ ] Import `NextResponse` and `NextRequest` from `next/server`
  - [ ] Create Supabase client with request/response cookie handlers:
    - `getAll()` reads from `request.cookies.getAll()`
    - `setAll()` sets on both `request.cookies` and `supabaseResponse.cookies`
  - [ ] Call `supabase.auth.getUser()` to get current user
  - [ ] Read role from `user?.user_metadata?.role`
  - [ ] Implement route protection logic:
    - `/admin/*`: redirect to login if no user, redirect to `/` if not admin
    - `/dashboard/*`: redirect to login if no user, redirect to `/` if not customer
  - [ ] Return `supabaseResponse` for all non-protected or authorized requests
  - [ ] Export `config.matcher` as `['/admin/:path*', '/dashboard/:path*']`

## Dev Notes

- **Do NOT use `createSupabaseServerClient()` from `lib/supabase/server.ts`** in middleware. The middleware uses `createServerClient` directly with request/response cookie handlers because middleware does not have access to `cookies()` from `next/headers`. This is a distinct pattern from the server client.
- **The architecture doc provides the complete middleware implementation** — follow it exactly as specified.
- **Cookie handling in middleware** is different from Server Components:
  - `getAll()` reads from `request.cookies`
  - `setAll()` must update BOTH `request.cookies` (for downstream) and `supabaseResponse.cookies` (for the browser)
  - A new `supabaseResponse = NextResponse.next({ request })` must be created inside `setAll()` to propagate updated cookies
- **Role is read from JWT metadata** (`user.user_metadata.role`), not from a DB query. This is why role must be synced to both `profiles.role` and `auth.users.raw_user_meta_data.role`.
- **`callbackUrl` parameter**: When redirecting to login, encode the full URL so the login page can redirect back after auth.

### Project Structure Notes

- File modified: `middleware.ts` (root level)
- No new files created
- Removes dependency on `jose` library from this file

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Middleware rewrite]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Role storage dual location]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
