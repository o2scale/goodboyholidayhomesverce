---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-goals', 'step-04-requirements', 'step-05-ux', 'step-06-nfr', 'step-07-constraints', 'step-08-risks', 'step-09-milestones', 'step-10-review', 'step-11-complete']
inputDocuments: ['_bmad-output/project-context.md']
workflowType: 'prd'
status: 'complete'
completedAt: '2026-03-21'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
---

# Product Requirements Document — Goodboy Holiday Homes

**Author:** Good Boy
**Date:** 2026-03-21
**Version:** 1.0
**Type:** Brownfield Migration + Infrastructure Upgrade

---

## 1. Executive Summary

Goodboy Holiday Homes is an operational Next.js 16 holiday rental platform for 4 properties in Kerala/Tamil Nadu, India. The platform was built rapidly ("vibecoded") without formal architecture standards, resulting in three critical infrastructure deficiencies:

1. **Data layer:** A flat JSON file (`data.json`) acting as the database — not scalable, not concurrent-safe, not production-grade
2. **Authentication:** Custom JWT implementation using `jose` with plain-text password storage — a serious security vulnerability
3. **File storage:** Local `public/uploads/` directory — files are destroyed on every Vercel deploy (ephemeral filesystem)

This PRD defines the requirements to migrate all three layers to **Supabase** (PostgreSQL database, Supabase Auth, Supabase Storage) while preserving 100% of the existing user-facing functionality and improving security posture.

---

## 2. Problem Statement

### 2.1 Current Pain Points

| Problem | Impact | Severity |
|---|---|---|
| Passwords stored as plain text | Security breach risk — any DB read exposes all user credentials | Critical |
| JSON file database | Data loss on concurrent writes; no transactions; no backup; lost on file system corruption | Critical |
| Local file uploads lost on deploy | Every Vercel deployment wipes all uploaded property images | Critical |
| No proper auth sessions | Custom JWT has no revocation, no refresh, no OAuth path | High |
| `JWT_SECRET` hardcoded fallback | If env var not set, tokens signed with known public string | High |
| No RLS/access control at DB layer | Any server code can read/write any data — no row-level security | High |

### 2.2 Why Supabase

- **Single provider** for database (PostgreSQL), auth, and file storage — one dashboard, one billing, one SDK
- **Row Level Security (RLS)** built into PostgreSQL — data access rules enforced at the database level
- **Supabase Auth** handles email/password, sessions, token refresh, and future OAuth providers without custom code
- **Supabase Storage** is S3-compatible, persists across deploys, and generates public CDN URLs for images
- **`@supabase/ssr`** package provides a purpose-built Next.js App Router integration with cookie-based sessions

---

## 3. Goals & Success Criteria

### 3.1 Primary Goals

1. **Eliminate plain-text password storage** — Replace custom auth with Supabase Auth (bcrypt handled internally)
2. **Persist data reliably** — Migrate all properties, bookings, and users to Supabase PostgreSQL
3. **Fix image persistence** — Replace `public/uploads/` with Supabase Storage so images survive deploys
4. **Maintain all existing functionality** — Zero regression in user-facing features

### 3.2 Success Criteria

- [ ] Admin can log in using Supabase Auth credentials
- [ ] Customers can register and log in via Supabase Auth
- [ ] All 4 properties display with their images served from Supabase Storage
- [ ] Booking creation, approval, and rejection all work correctly
- [ ] Admin can create, edit, and delete properties with image upload to Supabase Storage
- [ ] Admin can manage users (view, update roles, delete)
- [ ] Customer dashboard shows only their own bookings
- [ ] Email notifications on new bookings still function
- [ ] `next build` passes without errors on Vercel

---

## 4. Functional Requirements

### FR-01: Authentication (Supabase Auth)

| ID | Requirement |
|---|---|
| FR-01.1 | Users can register with email + password via Supabase Auth |
| FR-01.2 | Users can log in with email + password |
| FR-01.3 | Users can log out, invalidating their session |
| FR-01.4 | Sessions persist across page refreshes and browser restarts (cookie-based) |
| FR-01.5 | Middleware protects `/admin/*` (admin role only) and `/dashboard/*` (customer role only) |
| FR-01.6 | Unauthenticated access to protected routes redirects to `/login` |
| FR-01.7 | User roles (`admin`, `customer`) are stored in a `profiles` table and synced to user metadata |
| FR-01.8 | The Navbar correctly reflects the logged-in user's name and role |
| FR-01.9 | The existing `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` routes are removed |

### FR-02: Properties (Supabase PostgreSQL)

| ID | Requirement |
|---|---|
| FR-02.1 | All existing properties are migrated from `data.json` to `properties` table in Supabase |
| FR-02.2 | Admin can create new properties with title, description, price, location, maxGuests, amenities, images |
| FR-02.3 | Admin can edit existing properties |
| FR-02.4 | Properties list and individual property pages load from Supabase PostgreSQL |
| FR-02.5 | Property search/filter by location, guest count, and date availability works against Supabase data |

### FR-03: Bookings (Supabase PostgreSQL)

| ID | Requirement |
|---|---|
| FR-03.1 | Booking creation saves to `bookings` table in Supabase |
| FR-03.2 | Admin can approve or reject bookings |
| FR-03.3 | Booking conflict detection (overlapping confirmed bookings) is enforced |
| FR-03.4 | Admin can block date ranges (stored as bookings with `status = 'blocked'`) |
| FR-03.5 | Customer dashboard shows only their own bookings |
| FR-03.6 | Email notification on new booking continues to function |

### FR-04: File Storage (Supabase Storage)

| ID | Requirement |
|---|---|
| FR-04.1 | Property image upload saves files to Supabase Storage bucket |
| FR-04.2 | Uploaded images are served via Supabase Storage public CDN URLs |
| FR-04.3 | Existing `/api/upload` route is replaced with direct client-to-Supabase-Storage upload |
| FR-04.4 | `next.config.ts` is updated to allow Supabase Storage hostname in `remotePatterns` |
| FR-04.5 | Maximum 15 images per property (enforced in `PropertyForm`) |

### FR-05: User Management (Admin)

| ID | Requirement |
|---|---|
| FR-05.1 | Admin can view all users (from `profiles` table) |
| FR-05.2 | Admin can create new users (via Supabase Admin API using service role key) |
| FR-05.3 | Admin can update user name, phone, and role |
| FR-05.4 | Admin can delete users (removes from both `auth.users` and `profiles`) |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | All passwords managed by Supabase Auth (bcrypt internally) — no plain-text passwords anywhere in the codebase |
| NFR-02 | Row Level Security (RLS) enabled on all Supabase tables |
| NFR-03 | Service role key used only server-side (API routes, never exposed to browser) |
| NFR-04 | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only env vars safe to expose to the browser |
| NFR-05 | All existing TypeScript types updated to reflect Supabase data shapes |
| NFR-06 | `next build` passes without type errors or ESLint errors |
| NFR-07 | Deploy target remains Vercel |

---

## 6. Technical Constraints

- **Framework locked:** Next.js 16 App Router — no migration to other frameworks
- **No ORM:** Direct Supabase client queries, no Prisma or Drizzle (to minimise dependencies)
- **Brownfield:** Existing UI and component structure preserved — no redesign
- **No password migration:** Existing plain-text passwords cannot be bcrypt-migrated; all users must re-register OR admin creates new accounts via Supabase dashboard
- **`lib/data.ts` to be fully replaced:** All functions in this file are replaced with Supabase client calls; the file is deleted at end of migration

---

## 7. Out of Scope

- Payment processing
- Customer-facing booking confirmation emails
- Review/rating system backend
- OAuth providers (Google, GitHub, etc.) — deferred post-migration
- Search pagination
- Multi-language support

---

## 8. Migration Strategy

The migration is broken into **6 phases**, each independently deployable:

| Phase | Description |
|---|---|
| 1 | Supabase project setup — create project, schema, RLS policies, storage bucket |
| 2 | Install packages — `@supabase/supabase-js`, `@supabase/ssr`; set up client utilities in `lib/supabase/` |
| 3 | Auth migration — replace login/register/logout API routes with Supabase Auth; update middleware |
| 4 | Data migration — replace `lib/data.ts` functions with Supabase client calls; migrate `data.json` data |
| 5 | Storage migration — replace `/api/upload` with Supabase Storage direct upload in `PropertyForm` |
| 6 | Cleanup — delete `lib/data.ts`, `data.json`, auth API routes, `jose`, `JWT_SECRET` env var |
