# Story 5.3: Verify build and deployment readiness

Status: ready-for-dev

## Story

As the admin,
I want to confirm the migration is complete and the app deploys correctly,
so that the site runs reliably in production.

## Acceptance Criteria

1. **Given** all migration stories are complete
   **When** I run `npm run build`
   **Then** the build passes with zero type errors and zero ESLint errors
   **And** all 17+ routes compile successfully

2. **Given** all Supabase env vars are set in Vercel
   **When** a deployment is triggered
   **Then** the site deploys successfully
   **And** login, registration, property browsing, booking creation, admin dashboard, and user management all function correctly

3. **Given** images were previously lost on deploy
   **When** a new Vercel deployment completes
   **Then** all property images are still visible (served from Supabase Storage CDN)

## Tasks / Subtasks

- [ ] Run lint check (AC: #1)
  - [ ] Run `npm run lint`
  - [ ] Fix any ESLint errors (unused imports, missing types, etc.)
- [ ] Run type check (AC: #1)
  - [ ] Run `npx tsc --noEmit` to check types without building
  - [ ] Fix any TypeScript errors
- [ ] Run full build (AC: #1)
  - [ ] Run `npm run build`
  - [ ] Verify all routes compile:
    - `app/page.tsx` (homepage)
    - `app/properties/page.tsx` (properties listing)
    - `app/properties/[id]/page.tsx` (property detail)
    - `app/login/page.tsx`
    - `app/register/page.tsx`
    - `app/dashboard/page.tsx`
    - `app/admin/page.tsx`
    - `app/about/page.tsx`
    - `app/contact/page.tsx`
    - `app/api/properties/route.ts`
    - `app/api/bookings/route.ts`
    - `app/api/bookings/[id]/route.ts`
    - `app/api/users/route.ts`
    - `app/api/users/[id]/route.ts`
  - [ ] Fix any build errors
- [ ] Verify environment variable completeness (AC: #2)
  - [ ] Confirm `.env.local` has: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_PASSWORD`
  - [ ] Confirm `JWT_SECRET` is NOT referenced anywhere
  - [ ] Document Vercel env vars that need to be set
- [ ] Manual smoke test checklist (AC: #2, #3)
  - [ ] Register a new user -> verify profile created
  - [ ] Log in -> verify session persists on refresh
  - [ ] Browse properties on homepage -> verify images load
  - [ ] View property detail -> verify gallery and booking form
  - [ ] Create a booking -> verify it appears in dashboard
  - [ ] Log in as admin -> verify admin dashboard loads
  - [ ] Approve/reject a booking -> verify conflict detection
  - [ ] Create/edit a property with image upload -> verify Supabase Storage
  - [ ] Manage users (create, update role, delete)
  - [ ] Log out -> verify session cleared
  - [ ] Verify protected routes redirect unauthenticated users

## Dev Notes

- **This is a verification story, not a coding story** — the goal is to confirm all previous stories work together.
- **Build errors are expected** if previous stories left type mismatches. Fix them here.
- **Common issues to look for**:
  - Unused imports from deleted `@/lib/data`
  - Missing type exports from `@/lib/types`
  - Mismatched property names (snake_case leaked into TypeScript)
  - `jose` still imported somewhere
  - `generateStaticParams` referencing deleted functions
  - `next/image` hostname errors (fixed by Story 2.5)
- **Vercel deployment**: After local build passes, push to trigger Vercel deploy. Verify the deployed site works end-to-end.
- **Supabase Storage images**: The key test is that property images uploaded via Supabase Storage survive a Vercel redeploy (unlike the old `public/uploads/` approach).
- **First admin setup**: Remember that a first admin must be created manually via Supabase dashboard, then their profile role set to 'admin'.

### Project Structure Notes

- No new files created
- Fixes applied to any files with build errors
- This story touches whatever files have issues

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Architecture Validation Results]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/prd.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
