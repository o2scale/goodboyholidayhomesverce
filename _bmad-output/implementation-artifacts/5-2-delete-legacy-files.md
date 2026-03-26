# Story 5.2: Delete legacy files and remove jose dependency

Status: ready-for-dev

## Story

As a developer,
I want all legacy code removed,
so that the codebase has no dead code or security vulnerabilities.

## Acceptance Criteria

1. **Given** all API routes, pages, and components now use Supabase
   **When** I delete `lib/data.ts`
   **Then** no file in the project imports from `@/lib/data`

2. **Given** `/api/upload` is replaced by direct Supabase Storage upload
   **When** I verify `app/api/upload/route.ts` was deleted in Epic 2
   **Then** no references to `/api/upload` remain in any component

3. **Given** `jose` is no longer used anywhere
   **When** I run `npm uninstall jose`
   **Then** `jose` is removed from `package.json` and `package-lock.json`
   **And** no file in the project imports from `jose`
   **And** `JWT_SECRET` env var is no longer referenced anywhere

## Tasks / Subtasks

- [ ] Verify no remaining imports from `@/lib/data` (AC: #1)
  - [ ] Search entire project for `from '@/lib/data'` and `from "@/lib/data"`
  - [ ] If any remain, update them to use `@/lib/types` or Supabase client calls
- [ ] Delete `lib/data.ts` (AC: #1)
  - [ ] Remove the file
  - [ ] Verify build still compiles
- [ ] Delete `data.json` (AC: #1)
  - [ ] Remove the root-level `data.json` file
  - [ ] Verify no code references `data.json` (it was only read by `lib/data.ts`)
- [ ] Verify `/api/upload` deletion (AC: #2)
  - [ ] Confirm `app/api/upload/route.ts` was deleted in Story 2.4
  - [ ] Search for any references to `/api/upload` in components — remove if found
- [ ] Delete auth API routes (AC: #3)
  - [ ] If auth routes were rewritten in Story 1.3 but the architecture says to DELETE them (since auth is now client-side), verify whether they are still called by login/register pages
  - [ ] If login/register pages now use Supabase browser client directly, delete: `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/auth/logout/route.ts`
  - [ ] If pages still call these routes via fetch, keep them (they were rewritten in Story 1.3)
- [ ] Uninstall jose (AC: #3)
  - [ ] Run `npm uninstall jose`
  - [ ] Verify `jose` is removed from `package.json`
- [ ] Remove JWT_SECRET references (AC: #3)
  - [ ] Search for `JWT_SECRET` in all files
  - [ ] Remove from any env files, .env.local.example, etc.
  - [ ] Remove from Vercel env vars (note in dev notes for manual step)
- [ ] Delete `public/uploads/` directory if it exists
  - [ ] Images are now in Supabase Storage — local uploads folder is dead code

## Dev Notes

- **This story runs LAST (or near-last)** — all other migration stories must be complete before deleting legacy files.
- **Verification before deletion**: Before deleting each file, search the codebase for imports/references. Do not delete files that are still imported.
- **`data.json`**: This was the file-based data store. It contained properties, bookings, and users. All data is now in Supabase PostgreSQL.
- **`lib/data.ts`**: This exported functions (`getProperties()`, `getBookings()`, `getUsers()`, etc.) and TypeScript interfaces. Functions are replaced by direct Supabase calls. Interfaces are replaced by `lib/types.ts`.
- **Auth route deletion is conditional**: Check whether login/register pages call API routes or use Supabase browser client directly. The architecture doc says to delete auth routes, but Story 1.3 rewrites them. Resolve based on how the login/register pages were implemented.
- **Manual step**: Remove `JWT_SECRET` from Vercel environment variables dashboard.
- **`public/uploads/`**: If this directory exists with old uploaded images, it can be deleted since images now live in Supabase Storage.

### Project Structure Notes

- Files deleted: `lib/data.ts`, `data.json`, possibly `app/api/auth/` routes, `public/uploads/`
- Package removed: `jose`
- Env var removed: `JWT_SECRET`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns — lib/data.ts deletion]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — Routes removed]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment — Variables removed after migration]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
