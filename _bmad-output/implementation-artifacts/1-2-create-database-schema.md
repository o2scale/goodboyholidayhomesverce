# Story 1.2: Create Supabase database schema with tables, RLS, and triggers

Status: ready-for-dev

## Story

As the admin,
I want a complete SQL schema file I can run in Supabase SQL Editor,
so that all database tables, RLS policies, functions, and triggers are set up correctly.

## Acceptance Criteria

1. **Given** I need to set up the Supabase database
   **When** I create `supabase/schema.sql`
   **Then** it contains DDL for `profiles`, `properties`, and `bookings` tables with all columns matching the Architecture document
   **And** UUID primary keys with `uuid_generate_v4()` defaults
   **And** proper foreign key constraints (profiles -> auth.users, bookings -> properties, bookings -> auth.users)

2. **Given** new users must auto-get a profile row
   **When** the schema includes `handle_new_user()` trigger function
   **Then** it fires `after insert on auth.users` and creates a `profiles` row using `raw_user_meta_data` for name and role

3. **Given** the architecture requires RLS on all tables
   **When** the schema includes RLS policies
   **Then** profiles: users read own, admins read all, users update own, admins manage all
   **And** properties: anyone reads, only admins insert/update/delete
   **And** bookings: anyone creates, users read own, admins read/update all

4. **Given** booking conflict detection must be atomic
   **When** the schema includes `check_booking_conflict()` function
   **Then** it accepts property_id, start_date, end_date, optional exclude_id and returns boolean

5. **Given** Supabase Storage needs a bucket
   **When** the schema includes storage RLS policies
   **Then** public read on `property-images` bucket, admin-only insert/delete

6. **Given** properties need seed data
   **When** the schema includes INSERT statements
   **Then** the 3 original properties from the existing site are seeded with their Unsplash image URLs

## Tasks / Subtasks

- [ ] Create `supabase/schema.sql` (AC: #1)
  - [ ] Enable UUID extension: `create extension if not exists "uuid-ossp"`
  - [ ] Create `profiles` table with columns: `id` (uuid PK, FK to auth.users ON DELETE CASCADE), `name` (text NOT NULL), `phone` (text), `role` (text NOT NULL DEFAULT 'customer', CHECK admin/customer), `created_at`, `updated_at`
  - [ ] Create `properties` table with columns: `id` (uuid PK, uuid_generate_v4()), `title`, `description`, `price` (numeric(10,2)), `location`, `images` (text[]), `rating` (numeric(3,2)), `max_guests` (integer), `amenities` (text[]), `created_at`, `updated_at`
  - [ ] Create `bookings` table with columns: `id` (uuid PK), `property_id` (FK ON DELETE CASCADE), `user_id` (FK ON DELETE SET NULL), `start_date` (date), `end_date` (date), `guest_count` (integer), `status` (CHECK pending/confirmed/rejected/blocked), `customer_name`, `customer_email`, `customer_phone`, `include_meals` (boolean), `created_at`, `updated_at`
  - [ ] Add `valid_dates` constraint: `end_date >= start_date`
  - [ ] Add index: `idx_bookings_property_dates` on (property_id, start_date, end_date) WHERE status = 'confirmed'
- [ ] Create `handle_new_user()` trigger (AC: #2)
  - [ ] Function: `security definer`, `set search_path = public`
  - [ ] Extract name from `raw_user_meta_data->>'name'`, fallback to email username
  - [ ] Extract role from `raw_user_meta_data->>'role'`, fallback to 'customer'
  - [ ] Create trigger `on_auth_user_created` AFTER INSERT on auth.users
- [ ] Create `check_booking_conflict()` function (AC: #4)
  - [ ] Parameters: `p_property_id uuid`, `p_start_date date`, `p_end_date date`, `p_exclude_id uuid DEFAULT NULL`
  - [ ] Returns boolean — true if overlapping confirmed booking exists
  - [ ] Language SQL STABLE
- [ ] Add RLS policies (AC: #3)
  - [ ] Enable RLS on profiles, properties, bookings
  - [ ] Profiles: "Users can read their own profile", "Admins can read all profiles", "Users can update their own profile", "Admins can update any profile"
  - [ ] Properties: "Anyone can read properties", "Only admins can insert/update/delete properties"
  - [ ] Bookings: "Anyone can create a booking", "Users can read their own bookings", "Admins can read all bookings", "Admins can update any booking"
- [ ] Add Storage RLS policies (AC: #5)
  - [ ] Public read on `property-images` bucket objects
  - [ ] Admin-only insert and delete
- [ ] Add seed data (AC: #6)
  - [ ] INSERT 3 original properties with Unsplash image URLs from data.json

## Dev Notes

- **This is a SQL file only** — it is NOT executed by the application. It is run manually in the Supabase SQL Editor or via the Supabase CLI.
- **Column naming**: All columns use `snake_case` (e.g., `max_guests`, `start_date`, `property_id`). TypeScript uses `camelCase` — mapping happens in API routes (Story 2.1, 3.1).
- **The `handle_new_user()` trigger** is critical for the auth flow — without it, `supabase.auth.signUp()` will not create a profile row.
- **RLS admin check pattern**: `(select role from public.profiles where id = auth.uid()) = 'admin'` — this is a subquery in the policy, not a join.
- **Storage bucket** (`property-images`) must be created manually in Supabase dashboard as public. The SQL file only defines RLS policies for the bucket objects.
- **Do NOT use Prisma or any ORM** — direct SQL only.

### Project Structure Notes

- New file: `supabase/schema.sql` — top-level `supabase/` directory
- This follows the Supabase project convention

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Schema Full PostgreSQL DDL]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — RLS Policies]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
