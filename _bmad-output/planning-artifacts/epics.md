---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
workflowType: 'epics-and-stories'
status: 'complete'
completedAt: '2026-03-22'
---

# Goodboy Holiday Homes - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Goodboy Holiday Homes Supabase migration, decomposing the requirements from the PRD, Architecture, and UX Design Specification into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-01.1: Users can register with email + password via Supabase Auth
FR-01.2: Users can log in with email + password
FR-01.3: Users can log out, invalidating their session
FR-01.4: Sessions persist across page refreshes and browser restarts (cookie-based)
FR-01.5: Middleware protects `/admin/*` (admin role only) and `/dashboard/*` (customer role only)
FR-01.6: Unauthenticated access to protected routes redirects to `/login`
FR-01.7: User roles (`admin`, `customer`) stored in `profiles` table and synced to user metadata
FR-01.8: Navbar correctly reflects the logged-in user's name and role
FR-01.9: Existing `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` routes are replaced (not removed — rewritten to use Supabase Auth)
FR-02.1: All existing properties migrated from `data.json` to `properties` table in Supabase
FR-02.2: Admin can create new properties with title, description, price, location, maxGuests, amenities, images
FR-02.3: Admin can edit existing properties
FR-02.4: Properties list and individual property pages load from Supabase PostgreSQL
FR-02.5: Property search/filter by location, guest count, and date availability works against Supabase data
FR-03.1: Booking creation saves to `bookings` table in Supabase
FR-03.2: Admin can approve or reject bookings
FR-03.3: Booking conflict detection (overlapping confirmed bookings) enforced atomically via PostgreSQL function
FR-03.4: Admin can block date ranges (stored as bookings with `status = 'blocked'`)
FR-03.5: Customer dashboard shows only their own bookings
FR-03.6: Email notification on new booking continues to function
FR-04.1: Property image upload saves files to Supabase Storage bucket
FR-04.2: Uploaded images served via Supabase Storage public CDN URLs
FR-04.3: Existing `/api/upload` route replaced with direct client-to-Supabase-Storage upload
FR-04.4: `next.config.ts` updated to allow Supabase Storage hostname in `remotePatterns`
FR-04.5: Maximum 15 images per property enforced in `PropertyForm`
FR-05.1: Admin can view all users from `profiles` table
FR-05.2: Admin can create new users via Supabase Admin API (service role key)
FR-05.3: Admin can update user name, phone, and role
FR-05.4: Admin can delete users (removes from both `auth.users` and `profiles`)

### NonFunctional Requirements

NFR-01: All passwords managed by Supabase Auth (bcrypt internally) — no plain-text passwords anywhere in the codebase
NFR-02: Row Level Security (RLS) enabled on all Supabase tables
NFR-03: Service role key used only server-side (API routes, never exposed to browser)
NFR-04: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only env vars safe to expose to the browser
NFR-05: All existing TypeScript types updated to reflect Supabase data shapes
NFR-06: `next build` passes without type errors or ESLint errors
NFR-07: Deploy target remains Vercel

### Additional Requirements

- Three distinct Supabase client patterns required: server client (Server Components + API routes), admin client (service role, server-side only), browser client (Client Components)
- `supabaseAdmin` must be a lazy singleton to prevent build-time initialization failures when env vars are not set
- Role stored in dual locations: `profiles.role` (source of truth) + `auth.users.raw_user_meta_data.role` (fast middleware reads). Both must be synced on any role change.
- PostgreSQL `check_booking_conflict()` function replaces the JavaScript date-overlap check for atomic conflict detection
- `handle_new_user()` trigger auto-creates a profile row when a new auth user registers
- DB uses `snake_case` columns; TypeScript uses `camelCase` properties — mapping functions needed in API routes
- Existing UI and component structure preserved — no redesign
- No password migration: all users must re-register after Supabase Auth deployment
- First admin account created via Supabase dashboard, then role set to `admin` in profiles table
- Supabase Storage bucket `property-images` must be public for CDN URL access
- Storage RLS policies: public read, admin-only insert/delete

### UX Design Requirements

UX-DR1: Apply Kerala colour palette via CSS variables in globals.css (deep forest green primary, warm amber accent, warm cream background)
UX-DR2: Status badge colour system for booking statuses (pending=amber, confirmed=green, rejected=muted red, blocked=grey)
UX-DR3: ImageUploader component — drag-and-drop multi-image upload with progress and preview, directly to Supabase Storage
UX-DR4: Skeleton loading states for property cards during data fetch
UX-DR5: FadeIn animations on property card grids (already partially implemented via `@/components/animations`)
UX-DR6: WCAG AA accessibility — focus rings on all interactive elements, min 44x44px touch targets, alt text on all images
UX-DR7: Responsive breakpoint strategy — mobile-first, sm:640px, md:768px, lg:1024px
UX-DR8: useReducedMotion from framer-motion to respect prefers-reduced-motion
UX-DR9: Toast notifications for async actions (booking confirm, property save)
UX-DR10: Confirmation dialogs (AlertDialog) for destructive actions only (delete user, delete property)

### FR Coverage Map

FR-01.1: Epic 1 — User registration with Supabase Auth
FR-01.2: Epic 1 — User login with Supabase Auth
FR-01.3: Epic 1 — User logout with Supabase Auth
FR-01.4: Epic 1 — Cookie-based session persistence via @supabase/ssr
FR-01.5: Epic 1 — Middleware route protection
FR-01.6: Epic 1 — Unauthenticated redirect to /login
FR-01.7: Epic 1 — Profiles table with role + user_metadata sync
FR-01.8: Epic 1 — Layout reads Supabase session for Navbar
FR-01.9: Epic 1 — Auth routes rewritten to use Supabase
FR-02.1: Epic 2 — Properties migrated to Supabase PostgreSQL (seed data in schema.sql)
FR-02.2: Epic 2 — Admin creates properties via Supabase
FR-02.3: Epic 2 — Admin edits properties via Supabase
FR-02.4: Epic 2 — Properties pages load from Supabase
FR-02.5: Epic 2 — Search/filter works against Supabase data
FR-03.1: Epic 3 — Booking creation to Supabase bookings table
FR-03.2: Epic 3 — Admin approve/reject via Supabase
FR-03.3: Epic 3 — Atomic conflict detection via check_booking_conflict() RPC
FR-03.4: Epic 3 — Admin block date ranges as blocked-status bookings
FR-03.5: Epic 3 — Customer dashboard scoped by user_id
FR-03.6: Epic 3 — Email notification preserved with nodemailer
FR-04.1: Epic 2 — Image upload to Supabase Storage bucket
FR-04.2: Epic 2 — Images served via Supabase Storage CDN URLs
FR-04.3: Epic 2 — Direct client-to-Supabase upload replaces /api/upload
FR-04.4: Epic 2 — next.config.ts remotePatterns updated
FR-04.5: Epic 2 — 15-image limit enforced in PropertyForm
FR-05.1: Epic 4 — Admin views users from profiles table
FR-05.2: Epic 4 — Admin creates users via Supabase Admin API
FR-05.3: Epic 4 — Admin updates user name/phone/role
FR-05.4: Epic 4 — Admin deletes users (cascades auth.users → profiles)
NFR-01: Epic 1 — Supabase Auth replaces plain-text passwords
NFR-02: Epic 1 — RLS enabled on all tables (schema.sql)
NFR-03: Epic 1 — supabaseAdmin lazy singleton, server-only
NFR-04: Epic 1 — Only NEXT_PUBLIC_ env vars exposed to browser
NFR-05: Epic 5 — Shared lib/types.ts replaces lib/data.ts types
NFR-06: Epic 5 — Build verification
NFR-07: Epic 5 — Vercel deployment verified
UX-DR1: Epic 5 — Kerala colour palette (post-migration polish)
UX-DR2: Epic 3 — Status badge colours in admin bookings table
UX-DR3: Epic 2 — ImageUploader in PropertyForm
UX-DR4: Epic 5 — Skeleton loading states (post-migration polish)
UX-DR5: Epic 5 — FadeIn animations preserved
UX-DR6: Epic 5 — WCAG AA audit (post-migration polish)
UX-DR7: Epic 5 — Responsive verification (post-migration polish)
UX-DR8: Epic 5 — useReducedMotion (post-migration polish)
UX-DR9: Epic 3 — Toast notifications for booking actions
UX-DR10: Epic 4 — Confirmation dialog for user delete

## Epic List

### Epic 1: Secure User Authentication with Supabase
Users can securely register, log in, and log out. Sessions persist across browser restarts. Admin and customer routes are properly protected. No plain-text passwords exist in the system.
**FRs covered:** FR-01.1, FR-01.2, FR-01.3, FR-01.4, FR-01.5, FR-01.6, FR-01.7, FR-01.8, FR-01.9
**NFRs covered:** NFR-01, NFR-02, NFR-03, NFR-04

### Epic 2: Property Management from Supabase
Customers can browse properties loaded from a real database. Admin can create and edit properties with images that persist across Vercel deploys via Supabase Storage.
**FRs covered:** FR-02.1, FR-02.2, FR-02.3, FR-02.4, FR-02.5, FR-04.1, FR-04.2, FR-04.3, FR-04.4, FR-04.5

### Epic 3: Reliable Booking System
Customers can create booking requests stored in Supabase PostgreSQL. Admin can approve, reject, and block date ranges with atomic conflict detection. Customers see their own bookings. Email notifications function.
**FRs covered:** FR-03.1, FR-03.2, FR-03.3, FR-03.4, FR-03.5, FR-03.6

### Epic 4: Admin User Management
Admin can view, create, update, and delete users via Supabase Admin API. Role changes sync to both profiles table and auth user metadata.
**FRs covered:** FR-05.1, FR-05.2, FR-05.3, FR-05.4

### Epic 5: Legacy Cleanup, Type Safety & UX Polish
Remove all legacy code (lib/data.ts, jose, data.json). Create shared TypeScript types. Apply UX design tokens. Verify build passes and deployment works.
**FRs covered:** NFR-05, NFR-06, NFR-07
**UX-DRs covered:** UX-DR1, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8

---

## Epic 1: Secure User Authentication with Supabase

After this epic is complete, users can register, log in, and log out using Supabase Auth. Sessions are cookie-based and persist across page refreshes. Protected routes (/admin/*, /dashboard/*) enforce role-based access. The Navbar displays the logged-in user's name and role. All passwords are managed by Supabase Auth (bcrypt) — no plain-text passwords exist.

### Story 1.1: Install Supabase packages and create client utilities

As a developer,
I want Supabase client libraries installed and three client utility files created,
So that all subsequent stories have the foundation to interact with Supabase.

**Acceptance Criteria:**

**Given** the existing Next.js 16 project
**When** I run `npm install @supabase/supabase-js @supabase/ssr`
**Then** both packages appear in `package.json` dependencies
**And** `package-lock.json` is updated

**Given** the project needs three Supabase client patterns
**When** I create `lib/supabase/server.ts`
**Then** it exports `createSupabaseServerClient()` using `createServerClient` from `@supabase/ssr` with cookie handling via `await cookies()`

**Given** admin API routes need to bypass RLS
**When** I create `lib/supabase/admin.ts`
**Then** it exports `getSupabaseAdmin()` as a lazy singleton using `createClient` with `SUPABASE_SERVICE_ROLE_KEY`
**And** the client is only instantiated on first call (not at module load) to prevent build-time failures

**Given** Client Components need a browser-side Supabase client
**When** I create `lib/supabase/client.ts`
**Then** it exports `createSupabaseBrowserClient()` using `createBrowserClient` from `@supabase/ssr`

**Given** developers need to know which env vars to set
**When** I create `.env.local.example`
**Then** it contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_PASSWORD`

### Story 1.2: Create Supabase database schema with tables, RLS, and triggers

As the admin,
I want a complete SQL schema file I can run in Supabase SQL Editor,
So that all database tables, RLS policies, functions, and triggers are set up correctly.

**Acceptance Criteria:**

**Given** I need to set up the Supabase database
**When** I create `supabase/schema.sql`
**Then** it contains DDL for `profiles`, `properties`, and `bookings` tables with all columns matching the Architecture document
**And** UUID primary keys with `uuid_generate_v4()` defaults
**And** proper foreign key constraints (profiles → auth.users, bookings → properties, bookings → auth.users)

**Given** new users must auto-get a profile row
**When** the schema includes `handle_new_user()` trigger function
**Then** it fires `after insert on auth.users` and creates a `profiles` row using `raw_user_meta_data` for name and role

**Given** the architecture requires RLS on all tables
**When** the schema includes RLS policies
**Then** profiles: users read own, admins read all, users update own, admins manage all
**And** properties: anyone reads, only admins insert/update/delete
**And** bookings: anyone creates, users read own, admins read/update all

**Given** booking conflict detection must be atomic
**When** the schema includes `check_booking_conflict()` function
**Then** it accepts property_id, start_date, end_date, optional exclude_id and returns boolean

**Given** Supabase Storage needs a bucket
**When** the schema includes storage RLS policies
**Then** public read on `property-images` bucket, admin-only insert/delete

**Given** properties need seed data
**When** the schema includes INSERT statements
**Then** the 3 original properties from the existing site are seeded with their Unsplash image URLs

### Story 1.3: Rewrite auth API routes to use Supabase Auth

As a user,
I want to register, log in, and log out using Supabase Auth,
So that my credentials are securely managed and my session persists.

**Acceptance Criteria:**

**Given** a user submits valid email and password to POST `/api/auth/register`
**When** the route calls `supabase.auth.signUp()` with `user_metadata: { name, role: 'customer' }`
**Then** a new auth user is created in Supabase
**And** the `handle_new_user` trigger creates a profiles row
**And** if phone is provided, it is saved to the profiles table
**And** the response is `{ success: true }`

**Given** a user submits valid credentials to POST `/api/auth/login`
**When** the route calls `supabase.auth.signInWithPassword()`
**Then** Supabase sets session cookies automatically via the server client
**And** the response includes `{ success: true, role }`
**And** the role is read from `user.user_metadata.role`

**Given** a logged-in user calls POST `/api/auth/logout`
**When** the route calls `supabase.auth.signOut()`
**Then** the session cookies are cleared
**And** the response is `{ success: true }`

**Given** invalid credentials are submitted to login
**When** Supabase returns an error
**Then** the route returns `{ error: 'Invalid credentials' }` with status 401

**Given** registration is attempted with an existing email
**When** Supabase returns an error
**Then** the route returns the Supabase error message with status 400

### Story 1.4: Rewrite middleware for Supabase SSR session management

As a user,
I want protected routes to enforce authentication and role-based access,
So that only admins access /admin/* and only customers access /dashboard/*.

**Acceptance Criteria:**

**Given** `middleware.ts` currently uses `jose` for JWT verification
**When** I rewrite it to use `createServerClient` from `@supabase/ssr`
**Then** it creates a Supabase client with request/response cookie handlers
**And** calls `supabase.auth.getUser()` to refresh and validate the session

**Given** an unauthenticated user visits `/admin/anything` or `/dashboard/anything`
**When** `getUser()` returns no user
**Then** they are redirected to `/login?callbackUrl=<encoded-url>`

**Given** a customer visits `/admin/anything`
**When** `user.user_metadata.role` is not `'admin'`
**Then** they are redirected to `/`

**Given** an admin visits `/dashboard/anything`
**When** `user.user_metadata.role` is not `'customer'`
**Then** they are redirected to `/`

**Given** a valid user visits a non-protected route
**When** the path does not start with `/admin` or `/dashboard`
**Then** the middleware passes through without checks

**Given** the old middleware imported from `jose`
**When** the rewrite is complete
**Then** `jose` is no longer imported in `middleware.ts`

### Story 1.5: Update root layout and Navbar to read Supabase session

As a logged-in user,
I want the Navbar to display my name and role-appropriate links,
So that I know I'm authenticated and can navigate to the right areas.

**Acceptance Criteria:**

**Given** `app/layout.tsx` currently reads a `session` cookie with `jose`
**When** I rewrite it to use `createSupabaseServerClient()`
**Then** it calls `supabase.auth.getUser()` to get the current user
**And** queries `profiles` table for `name` and `role`
**And** passes `{ name, email, role }` to the `<Navbar>` component

**Given** no user is logged in
**When** `getUser()` returns null
**Then** `null` is passed to Navbar (existing Navbar handles this)

**Given** the old layout imported `jose` and `JWT_SECRET`
**When** the rewrite is complete
**Then** neither `jose` nor `JWT_SECRET` appear in `app/layout.tsx`

---

## Epic 2: Property Management from Supabase

After this epic is complete, all properties load from Supabase PostgreSQL. The homepage, properties listing page, and individual property pages all fetch from the database. Admin can create and edit properties with images stored in Supabase Storage that persist across Vercel deploys. The `/api/upload` route is replaced with direct browser-to-Supabase uploads.

### Story 2.1: Rewrite properties API routes to use Supabase

As an admin,
I want to create and edit properties stored in Supabase PostgreSQL,
So that property data persists reliably across deployments.

**Acceptance Criteria:**

**Given** GET `/api/properties` is called
**When** the route queries `supabase.from('properties').select('*')`
**Then** all properties are returned with `snake_case` → `camelCase` mapping (e.g. `max_guests` → `maxGuests`)

**Given** POST `/api/properties` is called with valid property data
**When** the route inserts into the `properties` table
**Then** a new property is created with all fields mapped from camelCase to snake_case
**And** the response returns the created property with status 201

**Given** PUT `/api/properties` is called with an id and updated fields
**When** the route updates the matching `properties` row
**Then** the property is updated and returned

**Given** the old route imported from `@/lib/data`
**When** the rewrite is complete
**Then** `lib/data` is not imported; `createSupabaseServerClient()` is used instead

### Story 2.2: Update homepage and properties listing to fetch from Supabase

As a customer,
I want to browse properties on the homepage and properties page,
So that I can discover available holiday homes.

**Acceptance Criteria:**

**Given** `app/page.tsx` currently calls `getProperties()` from `lib/data`
**When** I rewrite it to use `createSupabaseServerClient()`
**Then** it queries `supabase.from('properties').select('*')` and maps results to `Property[]`
**And** properties display in the same grid layout with `PropertyCard` and `FadeIn`

**Given** `app/properties/page.tsx` currently calls `getProperties()` and `getBookings()`
**When** I rewrite it to use Supabase server client
**Then** properties are fetched from Supabase
**And** bookings are fetched with `status != 'rejected'` for availability filtering
**And** location, guest count, and date availability filters work correctly

**Given** `PropertyCard` currently imports `Property` from `@/lib/data`
**When** I update the import
**Then** it imports `Property` from `@/lib/types` (shared types file)

### Story 2.3: Update property detail page to fetch from Supabase

As a customer,
I want to view a specific property's full details, gallery, and booking form,
So that I can decide whether to book.

**Acceptance Criteria:**

**Given** `app/properties/[id]/page.tsx` currently calls `getProperty(id)` and `getBookings()`
**When** I rewrite it to use Supabase
**Then** it queries `supabase.from('properties').select('*').eq('id', id).single()` for the property
**And** queries `supabase.from('bookings').select('start_date, end_date').eq('property_id', id).in('status', ['confirmed', 'blocked'])` for blocked dates

**Given** the property ID does not exist in Supabase
**When** the query returns null
**Then** `notFound()` is called (404 page)

**Given** `generateStaticParams()` currently calls `getProperties()`
**When** I remove it (properties now have UUID IDs and should be dynamic)
**Then** the page renders dynamically for all property UUIDs

### Story 2.4: Replace /api/upload with direct Supabase Storage upload

As an admin,
I want to upload property images directly to Supabase Storage from the browser,
So that images persist across Vercel deploys and are served via CDN.

**Acceptance Criteria:**

**Given** `components/admin/property-form.tsx` currently uploads to `/api/upload`
**When** I rewrite the upload handler to use `createSupabaseBrowserClient()`
**Then** files are uploaded via `supabase.storage.from('property-images').upload(path, file)`
**And** the public URL is obtained via `supabase.storage.from('property-images').getPublicUrl(path)`
**And** the public URL is added to the images array

**Given** a file is selected for upload
**When** the upload completes successfully
**Then** a thumbnail preview appears immediately using the Supabase Storage CDN URL

**Given** the 15-image limit
**When** the user tries to upload beyond 15 images
**Then** an alert message prevents the upload
**And** the count display shows "X / 15 images"

**Given** `app/api/upload/route.ts` is no longer needed
**When** this story is complete
**Then** the `/api/upload` route file is deleted

### Story 2.5: Update next.config.ts for Supabase Storage

As a developer,
I want `next/image` to accept Supabase Storage URLs,
So that property images render correctly with Next.js image optimization.

**Acceptance Criteria:**

**Given** `next.config.ts` currently allows only `images.unsplash.com`
**When** I add a Supabase Storage remote pattern
**Then** the config includes `{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }`
**And** `next/image` renders Supabase Storage URLs without errors

---

## Epic 3: Reliable Booking System

After this epic is complete, customers can create booking requests stored in Supabase PostgreSQL. Admin can approve or reject bookings with atomic conflict detection (PostgreSQL function instead of JavaScript). Admin can block date ranges. Customer dashboard shows only their own bookings scoped by Supabase Auth user ID. Email notifications on new bookings continue to function.

### Story 3.1: Rewrite bookings API routes with Supabase and atomic conflict detection

As a customer,
I want to submit a booking request that is reliably stored,
So that my booking is not lost due to file system issues.

**Acceptance Criteria:**

**Given** POST `/api/bookings` is called with valid booking data
**When** the route inserts into the `bookings` table
**Then** a new booking is created with `status = 'pending'`
**And** `user_id` is set to the current Supabase user's ID (if logged in) or null
**And** all field names are mapped from camelCase to snake_case

**Given** the email notification pattern
**When** a booking is created successfully
**Then** an email is sent to `goodboyholidayhomes@gmail.com` via nodemailer
**And** if the email fails, the booking still succeeds (inner try/catch)

**Given** GET `/api/bookings` is called
**When** the route queries Supabase
**Then** all bookings are returned with snake_case → camelCase mapping
**And** sorted by `created_at` descending

**Given** PATCH `/api/bookings/[id]` is called to confirm a booking
**When** the route sets `status = 'confirmed'`
**Then** it first calls `supabase.rpc('check_booking_conflict', { ... })` to check for overlapping confirmed bookings
**And** if a conflict exists, returns status 409 with error message
**And** if no conflict, updates the booking status

**Given** PATCH `/api/bookings/[id]` is called with `status = 'blocked'`
**When** the admin blocks a date range
**Then** the status is accepted as valid (in addition to pending/confirmed/rejected)

### Story 3.2: Update booking form and property page for Supabase availability data

As a customer,
I want the booking date picker to show which dates are already taken,
So that I can choose available dates without guessing.

**Acceptance Criteria:**

**Given** the property detail page passes `blockedDates` to `BookingForm`
**When** blocked dates are fetched from Supabase (confirmed + blocked bookings for this property)
**Then** the date picker shows these dates as disabled/greyed out

**Given** `BookingForm` currently imports `Property` from `@/lib/data`
**When** I update the import
**Then** it imports from `@/lib/types`

### Story 3.3: Rebuild customer dashboard with Supabase session and user-scoped queries

As a customer,
I want to see only my own bookings in my dashboard,
So that my booking information is private and accurate.

**Acceptance Criteria:**

**Given** `app/dashboard/page.tsx` currently uses `jose` to read the JWT and filters bookings by email
**When** I rewrite it to use `createSupabaseServerClient()`
**Then** it gets the user via `supabase.auth.getUser()`
**And** queries bookings with `.eq('user_id', user.id)` (Supabase RLS also enforces this)

**Given** the user has bookings
**When** the dashboard loads
**Then** each booking card shows property title, dates, guest count, and status badge
**And** property names are resolved by querying the properties table with the booking's property IDs

**Given** the user has no bookings
**When** the dashboard loads
**Then** an empty state message is shown with a link to browse properties

**Given** no user is logged in
**When** `getUser()` returns null
**Then** the user is redirected to `/login`

---

## Epic 4: Admin User Management

After this epic is complete, admin can view all users, create new users, update user details (name, phone, role), and delete users — all through the Supabase Admin API. Role changes sync to both the profiles table and auth user metadata so middleware reads are immediate.

### Story 4.1: Rewrite users API routes with Supabase Admin API

As an admin,
I want to manage users through Supabase,
So that user data is stored securely and role changes take effect immediately.

**Acceptance Criteria:**

**Given** GET `/api/users` is called by an admin
**When** the route uses `getSupabaseAdmin()` to query profiles
**Then** all profiles are returned with email joined from `supabaseAdmin.auth.admin.listUsers()`

**Given** POST `/api/users` is called with name, email, password, role
**When** the route calls `admin.auth.admin.createUser()` with `email_confirm: true`
**Then** a new auth user is created
**And** the `handle_new_user` trigger creates a profile row
**And** if phone is provided, the profile is updated

**Given** PATCH `/api/users/[id]` is called to change a user's role
**When** the route updates `profiles.role`
**Then** it ALSO calls `admin.auth.admin.updateUserById(id, { user_metadata: { role } })` to sync the role
**And** middleware immediately reads the new role on the next request

**Given** DELETE `/api/users/[id]` is called
**When** the route calls `admin.auth.admin.deleteUser(id)`
**Then** the auth user is deleted
**And** the profiles row is cascade-deleted via the foreign key

**Given** a non-admin user calls any users endpoint
**When** `requireAdmin()` checks the current Supabase session
**Then** the route returns status 401

**Given** `app/admin/page.tsx` imports `Booking, Property` from `@/lib/data`
**When** I update the import
**Then** it imports from `@/lib/types`

---

## Epic 5: Legacy Cleanup, Type Safety & UX Polish

After this epic is complete, all legacy code is removed (lib/data.ts, data.json, jose dependency). Shared TypeScript types are centralized. The build passes cleanly on Vercel. UX design tokens from the specification are applied.

### Story 5.1: Create shared lib/types.ts and update all component imports

As a developer,
I want centralized TypeScript types that reflect Supabase data shapes,
So that all components use consistent, accurate type definitions.

**Acceptance Criteria:**

**Given** `lib/data.ts` currently exports `Property`, `Booking`, and `User` interfaces
**When** I create `lib/types.ts`
**Then** it exports `Property`, `Booking`, and `Profile` interfaces matching the Supabase schema
**And** `Profile` replaces `User` (no `passwordHash` field; includes `email` from auth.users)
**And** all camelCase field names are used (matching the API response mapping)

**Given** multiple components import types from `@/lib/data`
**When** all type imports are updated
**Then** `components/property-card.tsx`, `components/booking-form.tsx`, and `app/admin/page.tsx` import from `@/lib/types`
**And** no component imports from `@/lib/data`

### Story 5.2: Delete legacy files and remove jose dependency

As a developer,
I want all legacy code removed,
So that the codebase has no dead code or security vulnerabilities.

**Acceptance Criteria:**

**Given** all API routes, pages, and components now use Supabase
**When** I delete `lib/data.ts`
**Then** no file in the project imports from `@/lib/data`

**Given** `/api/upload` is replaced by direct Supabase Storage upload
**When** I verify `app/api/upload/route.ts` was deleted in Epic 2
**Then** no references to `/api/upload` remain in any component

**Given** `jose` is no longer used anywhere
**When** I run `npm uninstall jose`
**Then** `jose` is removed from `package.json` and `package-lock.json`
**And** no file in the project imports from `jose`
**And** `JWT_SECRET` env var is no longer referenced anywhere

### Story 5.3: Verify build and deployment readiness

As the admin,
I want to confirm the migration is complete and the app deploys correctly,
So that the site runs reliably in production.

**Acceptance Criteria:**

**Given** all migration stories are complete
**When** I run `npm run build`
**Then** the build passes with zero type errors and zero ESLint errors
**And** all 17+ routes compile successfully

**Given** all Supabase env vars are set in Vercel
**When** a deployment is triggered
**Then** the site deploys successfully
**And** login, registration, property browsing, booking creation, admin dashboard, and user management all function correctly

**Given** images were previously lost on deploy
**When** a new Vercel deployment completes
**Then** all property images are still visible (served from Supabase Storage CDN)

---

## Validation Summary

### FR Coverage
- **Total FRs:** 27 (FR-01.1–FR-01.9, FR-02.1–FR-02.5, FR-03.1–FR-03.6, FR-04.1–FR-04.5, FR-05.1–FR-05.4)
- **FRs covered by stories:** 27/27 (100%)
- **No uncovered FRs**

### NFR Coverage
- **Total NFRs:** 7 (NFR-01 through NFR-07)
- **All NFRs addressed** across Epic 1 (security, RLS, env vars) and Epic 5 (types, build, deployment)

### UX-DR Coverage
- **Total UX-DRs:** 10
- **UX-DR2, UX-DR3, UX-DR9, UX-DR10:** Covered in Epic 2, 3, 4 stories
- **UX-DR1, UX-DR4–UX-DR8:** Tracked for Epic 5 post-migration polish

### Epic Independence
- **Epic 1** is standalone — sets up auth infrastructure
- **Epic 2** depends on Epic 1 (Supabase clients + schema) — standalone after that
- **Epic 3** depends on Epic 1 + Epic 2 (properties must exist for bookings) — standalone after that
- **Epic 4** depends on Epic 1 (Supabase Admin client) — standalone after that
- **Epic 5** depends on all previous epics — cleanup phase

### Story Dependency Flow
- Within each epic, stories are ordered so each builds only on previous stories
- No story depends on a future story within the same epic
- Each story is sized for a single dev agent implementation session
