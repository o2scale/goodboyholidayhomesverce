---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
project_name: 'goodboyholidayhomesverce'
user_name: 'Good Boy'
date: '2026-03-21'
status: 'complete'
completedAt: '2026-03-21'
lastStep: 8
---

# Architecture Decision Document

_This document defines all technical decisions, implementation patterns, and project structure for the Goodboy Holiday Homes Supabase migration. It is the single source of truth for all AI agents implementing this project._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements Summary (from PRD):**

This is a **brownfield migration** of an operational Next.js 16 holiday rental app. The scope is:
- FR-01: Replace custom JWT auth (jose + plain-text passwords) with **Supabase Auth**
- FR-02/03: Replace `lib/data.ts` JSON file layer with **Supabase PostgreSQL**
- FR-04: Replace local `public/uploads/` with **Supabase Storage**
- FR-05: Admin user management using **Supabase Admin API** (service role)

**Non-Functional Requirements:**
- All passwords managed by Supabase Auth — zero plain-text passwords in codebase
- RLS enabled on all tables — DB-level access control
- Service role key server-side only
- `next build` must pass on Vercel (no type or lint errors)
- Zero regression in user-facing functionality

**Scale & Complexity:**

- Primary domain: Full-stack web application (Next.js App Router)
- Complexity level: **Medium** — no new features, pure infrastructure migration
- Architectural components affected: auth layer, data layer, storage layer, middleware, ~15 files
- Estimated 6 implementation phases, each independently deployable

**Technical Constraints:**
- Next.js 16 App Router locked — no framework migration
- No ORM (Prisma/Drizzle) — direct Supabase client calls only
- Existing UI preserved — no component redesign
- No password migration possible (plain-text → bcrypt requires re-registration)

**Cross-Cutting Concerns Identified:**
- Session management — Supabase SSR cookies must be read/written in middleware AND in server components AND in API routes — three different client creation patterns
- Role management — user roles stored in `profiles` table but also embedded in Supabase JWT metadata for fast middleware reads
- Image URLs — all image URL patterns must change from `/uploads/filename` to Supabase Storage public CDN URLs — affects `next.config.ts`, `PropertyCard`, `PropertyGallery`, `PropertyForm`

---

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web application** — existing Next.js 16 App Router codebase. This is a brownfield project; no new starter template is initialised. The existing project structure is extended in-place.

### Starter Decision

**No new starter required.** The project already has a complete Next.js 16 foundation with:
- TypeScript strict mode
- Tailwind CSS v4 + Shadcn/ui (new-york)
- ESLint (eslint-config-next)
- Vercel deployment configuration

The "starter" for this migration is the Supabase + Next.js SSR integration pattern:

```bash
# Add Supabase packages to existing project
npm install @supabase/supabase-js @supabase/ssr
```

**Architectural Decisions Provided by this Foundation:**

- **Language & Runtime:** TypeScript strict, ES2017 target, isolatedModules
- **Styling:** Tailwind CSS v4 + Shadcn/ui — unchanged
- **Build Tooling:** Next.js 16 internal webpack/turbopack — unchanged
- **Testing Framework:** None configured — out of scope for this migration
- **Code Organization:** App Router file conventions — unchanged
- **Development Experience:** `npm run dev`, `npm run build`, `npm run lint` — unchanged

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Supabase client architecture — 3 distinct client patterns for different contexts
2. Role storage strategy — where roles live and how middleware reads them
3. Auth session cookie strategy — how Supabase SSR cookies integrate with Next.js middleware
4. RLS policy design — what each role can read/write at DB level

**Important Decisions (Shape Architecture):**
5. Database schema — table structures replacing `data.json`
6. Storage bucket strategy — public vs private, URL pattern
7. Admin API pattern — how server-side admin operations use service role

**Deferred Decisions (Post-Migration):**
- OAuth providers (Google, GitHub)
- Image CDN optimisation / image transformations
- Connection pooling (Supabase pooler) — not needed at current scale

---

### Data Architecture

**Database:** Supabase PostgreSQL (hosted, managed)

**Migration approach:** Schema-first — create tables with RLS, then migrate `data.json` data via one-time script, then swap `lib/data.ts` functions.

**ORM/Query Layer:** None — direct `supabase` client calls using the generated TypeScript types from `supabase gen types typescript`

**Schema — Full PostgreSQL DDL:**

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  phone      text,
  role       text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- PROPERTIES
-- ============================================
create table public.properties (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text not null,
  price       numeric(10,2) not null,
  location    text not null,
  images      text[] not null default '{}',
  rating      numeric(3,2) not null default 0,
  max_guests  integer not null default 2,
  amenities   text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================
-- BOOKINGS
-- ============================================
create table public.bookings (
  id               uuid primary key default uuid_generate_v4(),
  property_id      uuid not null references public.properties(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete set null,
  start_date       date not null,
  end_date         date not null,
  guest_count      integer not null default 1,
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'rejected', 'blocked')),
  customer_name    text not null,
  customer_email   text not null default '',
  customer_phone   text,
  include_meals    boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint valid_dates check (end_date >= start_date)
);

-- Index for fast conflict checking
create index idx_bookings_property_dates
  on public.bookings(property_id, start_date, end_date)
  where status = 'confirmed';

-- Booking conflict check function (atomic, replaces JS check)
create or replace function public.check_booking_conflict(
  p_property_id uuid,
  p_start_date  date,
  p_end_date    date,
  p_exclude_id  uuid default null
) returns boolean language sql stable as $$
  select exists (
    select 1 from public.bookings
    where property_id = p_property_id
      and status = 'confirmed'
      and (id <> p_exclude_id or p_exclude_id is null)
      and start_date <= p_end_date
      and end_date >= p_start_date
  );
$$;
```

**RLS Policies:**

```sql
-- PROFILES
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- PROPERTIES
alter table public.properties enable row level security;

create policy "Anyone can read properties"
  on public.properties for select using (true);

create policy "Only admins can insert properties"
  on public.properties for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Only admins can update properties"
  on public.properties for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Only admins can delete properties"
  on public.properties for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- BOOKINGS
alter table public.bookings enable row level security;

create policy "Anyone can create a booking"
  on public.bookings for insert with check (true);

create policy "Users can read their own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "Admins can read all bookings"
  on public.bookings for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins can update any booking"
  on public.bookings for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
```

**Caching strategy:** None — Supabase client queries on every request (consistent with existing pattern, Next.js Server Component cache handles deduplication where appropriate).

---

### Authentication & Security

**Authentication method:** Supabase Auth — email/password

**Session management:** Cookie-based via `@supabase/ssr`. The Supabase SSR package reads and writes `sb-*` cookies. Session refresh is handled automatically.

**Role storage — dual location (CRITICAL PATTERN):**

| Location | Purpose | Updated When |
|---|---|---|
| `public.profiles.role` | Source of truth | Any role change |
| `auth.users.raw_user_meta_data.role` | Fast middleware reads (no DB query) | Must be synced on any role change |

Roles are embedded in the Supabase JWT as `user_metadata.role`. Middleware reads this from the JWT without a DB call. Admin updates to user roles MUST update BOTH locations.

**Supabase client patterns — 3 distinct clients:**

```typescript
// 1. SERVER CLIENT (Server Components + API routes — respects RLS as the signed-in user)
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {} // Server Component — cookies() is read-only in SC
        },
      },
    }
  )
}

// 2. ADMIN CLIENT (API routes only — bypasses RLS — NEVER use in Client Components)
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 3. BROWSER CLIENT (Client Components — anon key only)
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Middleware rewrite (`middleware.ts`):**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return user
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(request.url)}`, request.url))
  }

  if (pathname.startsWith('/dashboard') && role !== 'customer') {
    return user
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(request.url)}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
```

**Auth routes removed:** `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/auth/logout/route.ts` are all **deleted**. Auth is handled by the Supabase browser client directly.

**Login pattern (Client Component):**
```typescript
const supabase = createSupabaseBrowserClient()
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

**Register pattern (Client Component):**
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { name, role: 'customer' } }
})
```

**Logout pattern:**
```typescript
await supabase.auth.signOut()
router.push('/')
router.refresh()
```

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER appear in any file that includes `"use client"` or is imported by a Client Component
- The anon key is safe for browser exposure — it has no elevated privileges; RLS policies enforce all access control
- Admin operations on `auth.users` (create user, delete user) use `supabaseAdmin` from `lib/supabase/admin.ts` in API routes only

---

### API & Communication Patterns

**API design:** REST — unchanged from existing pattern. All routes in `app/api/[resource]/route.ts`.

**Routes removed (replaced by Supabase Auth client-side):**
- `DELETE app/api/auth/login/route.ts`
- `DELETE app/api/auth/register/route.ts`
- `DELETE app/api/auth/logout/route.ts`
- `DELETE app/api/upload/route.ts`

**Routes updated (lib/data.ts calls → Supabase client calls):**
- `app/api/properties/route.ts` — GET uses server client; POST/PUT use server client (RLS enforces admin-only)
- `app/api/bookings/route.ts` — GET uses server client; POST uses server client + nodemailer unchanged
- `app/api/bookings/[id]/route.ts` — PATCH uses server client
- `app/api/users/route.ts` — GET/POST use `supabaseAdmin`
- `app/api/users/[id]/route.ts` — PATCH/DELETE use `supabaseAdmin`

**Error handling standard:** Unchanged — all routes wrap in try/catch and return `NextResponse.json({ error: '...' }, { status: NNN })`.

**API response format:** Direct data — no wrapper object. Same as existing.

**Auth enforcement in API routes:** Remove the manual `isAdmin()` cookie-splitting helper from `app/api/users/[id]/route.ts`. Replace with RLS (Supabase enforces it) or a server client role check for routes that need explicit admin validation beyond RLS.

---

### Frontend Architecture

**State management:** No global state manager — unchanged. Client Components use `useState` + `useEffect` + `fetch` to call API routes.

**Component architecture:** Unchanged — Shadcn/ui new-york, all UI in `components/ui/`, page components in `components/`, admin forms in `components/admin/`.

**Auth state in layout:** `app/layout.tsx` (Server Component) reads user via `supabase.auth.getUser()` using the server client instead of `jwtVerify`. User object passed to `<Navbar>`.

```typescript
// app/layout.tsx
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
let currentUser = null
if (user) {
  currentUser = {
    name: user.user_metadata.name as string,
    email: user.email!,
    role: user.user_metadata.role as string,
  }
}
```

**Image URL changes:**
- Old: `/uploads/1234567890-filename.jpg` (relative, local)
- New: `https://<project-ref>.supabase.co/storage/v1/object/public/property-images/filename.jpg` (absolute, CDN)
- `next.config.ts` must add Supabase Storage hostname to `remotePatterns`

**Upload flow change:**
- Old: `PropertyForm` → `POST /api/upload` → server writes to `public/uploads/` → returns `/uploads/filename`
- New: `PropertyForm` → `supabase.storage.from('property-images').upload(path, file)` → returns Supabase public URL

---

### Infrastructure & Deployment

**Hosting:** Vercel — unchanged.

**Database:** Supabase hosted PostgreSQL (free tier for development, Pro for production).

**Environment variables — complete list:**

| Variable | Scope | Used In |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser-safe) | All 3 Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser-safe) | Browser client + server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Private (server only) | Admin client in API routes |
| `EMAIL_PASSWORD` | Private (server only) | `app/api/bookings/route.ts` |

**Variables removed after migration:** `JWT_SECRET`

**CI/CD:** Vercel automatic deploys on push to `main` — unchanged.

**Monitoring:** No change — `console.error` for caught exceptions.

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

**12 areas** where AI agents could make different choices without this document.

---

### Naming Patterns

**Database Naming Conventions:**
- Table names: **plural, snake_case** — `properties`, `bookings`, `profiles`
- Column names: **snake_case** — `property_id`, `start_date`, `max_guests`, `include_meals`
- Foreign keys: `{referenced_table_singular}_id` — `property_id`, `user_id`
- Indexes: `idx_{table}_{columns}` — `idx_bookings_property_dates`
- Primary keys: always `id uuid` with `uuid_generate_v4()`
- Timestamps: always `created_at` + `updated_at` as `timestamptz not null default now()`

**TypeScript / API Naming Conventions:**
- TypeScript interfaces: PascalCase — `Property`, `Booking`, `Profile`
- DB column → TypeScript field mapping: snake_case DB → camelCase TS (via Supabase generated types OR manual mapping)
  - `max_guests` in DB → `maxGuests` in TypeScript interface
  - `property_id` in DB → `propertyId` in TypeScript interface
  - `start_date` in DB → `startDate` in TypeScript interface
- API routes: plural lowercase — `/api/properties`, `/api/bookings`, `/api/users`
- Supabase client files: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`

**Component Naming:** Unchanged — kebab-case files, PascalCase exports.

---

### Structure Patterns

**Supabase client utilities location:** `lib/supabase/` — three files only:
- `lib/supabase/server.ts` — `createSupabaseServerClient()`
- `lib/supabase/client.ts` — `createSupabaseBrowserClient()`
- `lib/supabase/admin.ts` — `supabaseAdmin` (singleton)

**No intermediate abstraction layer:** Do NOT create a `lib/supabase-data.ts` that wraps Supabase calls the way `lib/data.ts` wrapped file I/O. Call Supabase directly in Server Components and API routes.

**`lib/data.ts` deletion:** Once migration is complete, `lib/data.ts` and `data.json` are deleted. All TypeScript interfaces (`Property`, `Booking`, `User`) are either regenerated from Supabase types or redefined in `lib/types.ts`.

**TypeScript types:** Create `lib/types.ts` for shared interfaces that replaces the interfaces previously exported from `lib/data.ts`. These types should match the Supabase database schema column names mapped to camelCase.

---

### Format Patterns

**API Response Format:** Direct data, no wrapper — unchanged:
```typescript
// ✅ CORRECT
return NextResponse.json(properties)
return NextResponse.json(booking, { status: 201 })

// ❌ WRONG — do not add wrapper
return NextResponse.json({ data: properties, success: true })
```

**Date format:** ISO date strings (`'2026-03-21'`) for `start_date` / `end_date` — matches existing pattern. `date-fns` for formatting in UI.

**Boolean fields:** Native TypeScript `boolean` / PostgreSQL `boolean` — no `0`/`1`.

**Null handling:** `null` for optional fields (e.g. `customer_phone`, `user_id`). Empty string `''` only for `customer_email` per existing API contract.

---

### Communication Patterns

**No event system** — direct fetch calls from Client Components to API routes. Unchanged.

**State management in Client Components:**
```typescript
// Standard pattern used throughout — do not deviate
const [data, setData] = useState<Type[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  fetchData()
}, [])

const fetchData = async () => {
  try {
    const res = await fetch('/api/resource')
    const json = await res.json()
    setData(json)
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    setIsLoading(false)
  }
}
```

---

### Process Patterns

**Error handling:**
- API routes: try/catch → `NextResponse.json({ error: message }, { status: code })`
- Email errors: inner try/catch, `console.error` only — never throw, never fail booking
- Supabase errors: check `error` from destructured response — `const { data, error } = await supabase.from(...)`
- Client Components: try/catch in async handlers, set error state for user display

**Loading states:**
```typescript
// Standard pattern — isLoading boolean, not multiple states
const [isLoading, setIsLoading] = useState(true)
// Set false in finally block of fetch
```

**Supabase query error pattern:**
```typescript
// ✅ CORRECT — always check error
const { data, error } = await supabase.from('properties').select('*')
if (error) throw error
return NextResponse.json(data)

// ❌ WRONG — ignoring error
const { data } = await supabase.from('properties').select('*')
return NextResponse.json(data)
```

**All AI Agents MUST:**
- Create Supabase clients using only the 3 utility functions in `lib/supabase/` — never call `createClient` or `createServerClient` directly in page/component/route files
- Always check for `error` after every Supabase query
- Never import `supabaseAdmin` in any file with `"use client"` or in Client Components
- Never import `lib/data.ts` functions after Phase 4 is complete (file will be deleted)
- Always map DB `snake_case` columns to TypeScript `camelCase` fields

---

## Project Structure & Boundaries

### Complete Project Directory Structure (Post-Migration)

```
goodboyholidayhomesverce/
├── app/
│   ├── about/page.tsx                      # unchanged
│   ├── admin/page.tsx                      # UPDATED: Supabase browser client for auth
│   ├── api/
│   │   ├── auth/                           # DELETED ENTIRE FOLDER
│   │   ├── bookings/
│   │   │   ├── route.ts                    # UPDATED: Supabase server client
│   │   │   └── [id]/route.ts               # UPDATED: Supabase server client
│   │   ├── properties/
│   │   │   └── route.ts                    # UPDATED: Supabase server client
│   │   ├── upload/
│   │   │   └── route.ts                    # DELETED: upload moved to client-side
│   │   └── users/
│   │       ├── route.ts                    # UPDATED: supabaseAdmin
│   │       └── [id]/route.ts               # UPDATED: supabaseAdmin
│   ├── contact/page.tsx                    # unchanged
│   ├── dashboard/page.tsx                  # UPDATED: Supabase browser client
│   ├── globals.css                         # unchanged
│   ├── layout.tsx                          # UPDATED: Supabase server client for user
│   ├── login/page.tsx                      # UPDATED: Supabase signInWithPassword
│   ├── page.tsx                            # unchanged
│   ├── properties/
│   │   ├── page.tsx                        # UPDATED: Supabase server client
│   │   └── [id]/page.tsx                   # UPDATED: Supabase server client
│   └── register/page.tsx                   # UPDATED: Supabase signUp
├── components/
│   ├── admin/
│   │   ├── property-form.tsx               # UPDATED: direct Supabase Storage upload
│   │   └── user-form.tsx                   # unchanged (calls /api/users)
│   ├── ui/                                 # unchanged (Shadcn/ui)
│   ├── animations.tsx                      # unchanged
│   ├── booking-form.tsx                    # unchanged (calls /api/bookings)
│   ├── footer.tsx                          # unchanged
│   ├── hero.tsx                            # unchanged
│   ├── home-sections.tsx                   # unchanged
│   ├── navbar.tsx                          # UPDATED: Supabase browser client for logout
│   ├── property-card.tsx                   # unchanged (image src format agnostic)
│   ├── property-gallery.tsx                # unchanged (image src format agnostic)
│   └── property-search.tsx                 # unchanged
├── lib/
│   ├── data.ts                             # DELETED in Phase 6
│   ├── supabase/                           # NEW FOLDER
│   │   ├── server.ts                       # createSupabaseServerClient()
│   │   ├── client.ts                       # createSupabaseBrowserClient()
│   │   └── admin.ts                        # supabaseAdmin singleton
│   ├── types.ts                            # NEW: replaces interfaces from data.ts
│   └── utils.ts                            # unchanged (cn())
├── middleware.ts                           # REPLACED: Supabase SSR middleware
├── next.config.ts                          # UPDATED: add Supabase Storage hostname
├── data.json                               # DELETED in Phase 6
├── package.json                            # UPDATED: add @supabase/supabase-js @supabase/ssr
├── tsconfig.json                           # unchanged
├── components.json                         # unchanged
└── postcss.config.mjs                      # unchanged
```

### Architectural Boundaries

**API Boundaries:**
- External → Next.js API routes (via fetch from Client Components or external)
- API routes → Supabase server client (as authenticated user, respects RLS)
- Admin API routes → `supabaseAdmin` (bypasses RLS, elevated operations)
- Client Components → Supabase browser client (for auth operations only)
- Client Components → `/api/*` routes (for all data operations)

**Component Boundaries:**
- Server Components (`layout.tsx`, property pages, properties list) read user session via server client — pass user down as props
- Client Components (`admin/page.tsx`, `dashboard/page.tsx`, `login/page.tsx`, `register/page.tsx`, `navbar.tsx`) use browser client for auth actions
- `PropertyForm` uses browser client for Storage upload directly — no server intermediary

**Data Boundaries:**
- `lib/supabase/server.ts` — used in Server Components and API route handlers
- `lib/supabase/admin.ts` — used only in API route handlers, never in components
- `lib/supabase/client.ts` — used only in Client Components (`"use client"` files)
- `lib/types.ts` — TypeScript interfaces shared between server and client code

**External Integration Points:**
- Supabase Auth: email/password sessions, JWT with user metadata
- Supabase PostgreSQL: properties, bookings, profiles
- Supabase Storage: `property-images` public bucket
- Gmail SMTP (nodemailer): booking notification emails — unchanged

**Data Flow — Booking Creation:**
```
User fills BookingForm (Client Component)
  → POST /api/bookings (API route)
    → createSupabaseServerClient()
    → INSERT into bookings table (RLS: anyone can insert)
    → nodemailer sends email notification (unchanged)
  → 201 response with created booking
  → BookingForm shows success state
```

**Data Flow — Admin Confirms Booking:**
```
Admin clicks Confirm in AdminPage (Client Component)
  → PATCH /api/bookings/[id] (API route)
    → createSupabaseServerClient() — verifies admin role via RLS
    → check_booking_conflict() PostgreSQL function
    → UPDATE bookings SET status = 'confirmed'
  → 200 response
  → AdminPage re-fetches bookings
```

**Data Flow — Property Image Upload:**
```
Admin adds images in PropertyForm (Client Component)
  → createSupabaseBrowserClient()
  → supabase.storage.from('property-images').upload(path, file)
  → returns { publicUrl } from getPublicUrl()
  → PropertyForm stores URL in images[] array
  → On form submit: POST/PUT /api/properties with images[] containing Supabase URLs
```

### Requirements to Structure Mapping

| Requirement | Implementation Location |
|---|---|
| FR-01: Supabase Auth | `lib/supabase/server.ts`, `lib/supabase/client.ts`, `middleware.ts`, `app/login/`, `app/register/`, `app/layout.tsx`, `components/navbar.tsx` |
| FR-02: Properties DB | `lib/supabase/server.ts`, `app/api/properties/route.ts`, `app/properties/`, `app/properties/[id]/` |
| FR-03: Bookings DB | `lib/supabase/server.ts`, `app/api/bookings/`, `components/booking-form.tsx`, `app/admin/page.tsx`, `app/dashboard/page.tsx` |
| FR-04: Storage | `lib/supabase/client.ts`, `components/admin/property-form.tsx`, `next.config.ts` |
| FR-05: User Management | `lib/supabase/admin.ts`, `app/api/users/` |
| NFR-01: No plain passwords | `lib/data.ts` deleted, Supabase Auth handles hashing |
| NFR-02: RLS | Supabase dashboard SQL migrations |
| NFR-03: Service role server-only | `lib/supabase/admin.ts` — only imported in `app/api/users/` |

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible: `@supabase/ssr` is purpose-built for Next.js App Router with React 19 and async `cookies()`. Supabase JS v2 is compatible with TypeScript strict mode. No version conflicts with existing dependencies.

**Pattern Consistency:**
The 3-client pattern (server / admin / browser) is consistent with `@supabase/ssr` documentation and the Next.js 16 App Router requirements. The pattern correctly handles the read-only cookie constraint in Server Components. Naming conventions are consistent throughout.

**Structure Alignment:**
The project structure additions (`lib/supabase/`) are minimal and follow existing conventions (utility modules in `lib/`). All existing components are preserved. The data flow boundaries are clearly respected.

### Requirements Coverage Validation ✅

**Functional Requirements:**
- FR-01 ✅ — Supabase Auth replaces all custom JWT code
- FR-02 ✅ — Properties table + server client queries
- FR-03 ✅ — Bookings table + conflict check function + server client queries
- FR-04 ✅ — `property-images` storage bucket + direct client upload
- FR-05 ✅ — `supabaseAdmin` + Supabase Auth Admin API

**Non-Functional Requirements:**
- NFR-01 ✅ — `lib/data.ts` deleted; Supabase Auth handles bcrypt
- NFR-02 ✅ — RLS policies defined in schema
- NFR-03 ✅ — `supabaseAdmin` restricted to `lib/supabase/admin.ts`, imported only in API routes
- NFR-04 ✅ — Only `NEXT_PUBLIC_*` vars in browser-accessible code
- NFR-05 ✅ — `lib/types.ts` replaces `lib/data.ts` interfaces
- NFR-06 ✅ — Architecture changes are backwards-compatible with TypeScript strict mode
- NFR-07 ✅ — No changes to Vercel deployment configuration

### Implementation Readiness Validation ✅

**Decision Completeness:**
All 6 migration phases have clear entry/exit criteria. All 3 Supabase client patterns documented with full TypeScript code. Full PostgreSQL DDL provided. All files to change/delete/create are identified.

**Structure Completeness:**
Complete directory tree with change annotations for every file. No ambiguous locations.

**Pattern Completeness:**
All 12 conflict areas addressed. Naming, format, communication, and process patterns fully specified with examples.

### Gap Analysis Results

**Critical Gaps:** None — all blocking decisions made.

**Important gaps to address during implementation:**
- Supabase project must be created manually before Phase 1 coding begins
- First admin user must be created manually via Supabase dashboard (Auth → Users → Invite) OR via a one-time seed script using `supabaseAdmin`
- `data.json` migration script (one-time Node.js script to read `data.json` and INSERT into Supabase) must be written in Phase 4 before `lib/data.ts` is deleted

**Nice-to-have (deferred):**
- Supabase database types auto-generation (`supabase gen types typescript --project-id ... > lib/database.types.ts`) — recommended but not blocking
- Storage bucket CORS configuration for cross-origin uploads — may be needed if upload fails from browser

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analysed (brownfield, Next.js 16, Vercel)
- [x] Scale and complexity assessed (medium — migration only, no new features)
- [x] Technical constraints identified (no ORM, no framework change, no password migration)
- [x] Cross-cutting concerns mapped (sessions, roles, image URLs)

**✅ Architectural Decisions**
- [x] Critical decisions documented with package names and versions
- [x] Supabase client architecture fully specified (3 patterns)
- [x] Role storage strategy defined (dual location)
- [x] RLS policies written in SQL
- [x] Full PostgreSQL DDL provided
- [x] Storage strategy defined (public bucket, direct upload)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB snake_case → TS camelCase)
- [x] Structure patterns defined (lib/supabase/ folder)
- [x] Communication patterns specified (no change to fetch/state pattern)
- [x] Process patterns documented (error handling, loading states)

**✅ Project Structure**
- [x] Complete directory structure with change annotations
- [x] All files to add/update/delete identified
- [x] Integration points and data flows mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — This is a constrained brownfield migration with a clear scope. No new user-facing features are being added. The Supabase + Next.js SSR integration is well-documented and widely deployed.

**Key Strengths:**
- Full PostgreSQL DDL ready to execute in Supabase dashboard
- Three-client pattern eliminates the most common source of Supabase + Next.js bugs
- Phased migration means the app can be deployed and tested at each phase
- RLS policies enforce access control at the database layer, eliminating the fragile manual `isAdmin()` helper

**Areas for Future Enhancement (Post-Migration):**
- Add Supabase database types auto-generation to CI pipeline
- Consider Supabase Edge Functions for booking conflict checks at scale
- Add OAuth providers (Google) for customer sign-in convenience

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Create all 3 Supabase client files in `lib/supabase/` before modifying any page or API route
4. Never use `supabaseAdmin` in Client Components or files without explicit server-only guarantees
5. Always check `error` from Supabase destructured responses
6. Refer to this document for all architectural questions

**Migration Phase Order (implement in this sequence):**

| Phase | Focus | Entry Criteria | Exit Criteria |
|---|---|---|---|
| 1 | Supabase project setup | Supabase account created | Schema deployed, RLS on, storage bucket created |
| 2 | Package install + client utilities | Phase 1 complete | `lib/supabase/` created, types defined, `next build` passes |
| 3 | Auth migration | Phase 2 complete | Login/register/logout work via Supabase Auth, middleware updated |
| 4 | Data migration | Phase 3 complete | All API routes use Supabase client, `data.json` data migrated |
| 5 | Storage migration | Phase 4 complete | Images upload to Supabase Storage, served via CDN URLs |
| 6 | Cleanup | Phase 5 complete | `lib/data.ts` deleted, `data.json` deleted, auth routes deleted, `jose` removed |
