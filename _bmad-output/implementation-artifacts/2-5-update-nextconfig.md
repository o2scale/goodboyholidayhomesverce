# Story 2.5: Update next.config.ts for Supabase Storage

Status: ready-for-dev

## Story

As a developer,
I want `next/image` to accept Supabase Storage URLs,
so that property images render correctly with Next.js image optimization.

## Acceptance Criteria

1. **Given** `next.config.ts` currently allows only `images.unsplash.com`
   **When** I add a Supabase Storage remote pattern
   **Then** the config includes `{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }`
   **And** `next/image` renders Supabase Storage URLs without errors

## Tasks / Subtasks

- [ ] Update `next.config.ts` (AC: #1)
  - [ ] Open `next.config.ts`
  - [ ] Locate the existing `images.remotePatterns` array
  - [ ] Add new entry: `{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }`
  - [ ] Keep the existing `images.unsplash.com` entry (seed data uses Unsplash URLs)
  - [ ] Verify config syntax is valid TypeScript

## Dev Notes

- **Keep the existing Unsplash pattern** — the seed data properties use Unsplash image URLs, so both patterns must be present.
- **Wildcard hostname**: `*.supabase.co` covers any Supabase project reference (e.g., `abcdefgh.supabase.co`). This is more flexible than hardcoding a specific project ID.
- **Pathname pattern**: `/storage/v1/object/public/**` matches all public storage URLs.
- **This is a small change** but critical — without it, `next/image` will refuse to render Supabase Storage URLs and show a broken image or error.
- **Test by checking**: After this change, property images stored in Supabase Storage should render via `<Image>` without the "hostname not configured" error.

### Project Structure Notes

- File modified: `next.config.ts` (root level)
- No new files created

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Image URL changes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
