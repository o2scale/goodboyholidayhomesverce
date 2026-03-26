# Story 1.1: Install Supabase packages and create client utilities

Status: ready-for-dev

## Story

As a developer,
I want Supabase client libraries installed and three client utility files created,
so that all subsequent stories have the foundation to interact with Supabase.

## Acceptance Criteria

1. **Given** the existing Next.js 16 project
   **When** I run `npm install @supabase/supabase-js @supabase/ssr`
   **Then** both packages appear in `package.json` dependencies
   **And** `package-lock.json` is updated

2. **Given** the project needs three Supabase client patterns
   **When** I create `lib/supabase/server.ts`
   **Then** it exports `createSupabaseServerClient()` using `createServerClient` from `@supabase/ssr` with cookie handling via `await cookies()`

3. **Given** admin API routes need to bypass RLS
   **When** I create `lib/supabase/admin.ts`
   **Then** it exports `getSupabaseAdmin()` as a lazy singleton using `createClient` with `SUPABASE_SERVICE_ROLE_KEY`
   **And** the client is only instantiated on first call (not at module load) to prevent build-time failures

4. **Given** Client Components need a browser-side Supabase client
   **When** I create `lib/supabase/client.ts`
   **Then** it exports `createSupabaseBrowserClient()` using `createBrowserClient` from `@supabase/ssr`

5. **Given** developers need to know which env vars to set
   **When** I create `.env.local.example`
   **Then** it contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_PASSWORD`

## Tasks / Subtasks

- [ ] Install npm packages (AC: #1)
  - [ ] Run `npm install @supabase/supabase-js @supabase/ssr`
  - [ ] Verify both appear in `package.json` dependencies
- [ ] Create `lib/supabase/server.ts` (AC: #2)
  - [ ] Import `createServerClient` from `@supabase/ssr`
  - [ ] Import `cookies` from `next/headers`
  - [ ] Export async function `createSupabaseServerClient()` with cookie `getAll`/`setAll` handlers
  - [ ] Wrap `setAll` in try/catch (cookies() is read-only in Server Components)
- [ ] Create `lib/supabase/admin.ts` (AC: #3)
  - [ ] Import `createClient` from `@supabase/supabase-js`
  - [ ] Implement lazy singleton pattern — do NOT instantiate at module level
  - [ ] Export `getSupabaseAdmin()` function that creates client on first call
  - [ ] Use `SUPABASE_SERVICE_ROLE_KEY` env var
  - [ ] Set `auth: { autoRefreshToken: false, persistSession: false }`
- [ ] Create `lib/supabase/client.ts` (AC: #4)
  - [ ] Import `createBrowserClient` from `@supabase/ssr`
  - [ ] Export `createSupabaseBrowserClient()` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create `.env.local.example` (AC: #5)
  - [ ] Add all four env var placeholders with descriptive comments

## Dev Notes

- **Three distinct client patterns are critical** — each serves a different execution context:
  - `server.ts` — Server Components + API routes, respects RLS as signed-in user
  - `admin.ts` — API routes only, bypasses RLS with service role key
  - `client.ts` — Client Components only, anon key, browser-safe
- **Lazy singleton for admin client**: The architecture doc specifies `supabaseAdmin` as a direct export, but the epics specify a lazy singleton via `getSupabaseAdmin()`. Use the lazy singleton to prevent build-time initialization failures when env vars are not set.
- **NEVER import `lib/supabase/admin.ts` in any file with `"use client"`**
- **Cookie handler pattern for server client**: `cookieStore.set()` will throw in Server Components (read-only); the empty catch block is intentional.
- All subsequent stories depend on these three files — they must be created exactly as specified.

### Project Structure Notes

- New folder: `lib/supabase/` containing 3 files
- Aligns with existing convention of utility modules in `lib/`
- No changes to existing files in this story

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Supabase client patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment — Environment variables]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
