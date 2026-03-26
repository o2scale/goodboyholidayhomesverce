-- ============================================================
-- Goodboy Holiday Homes — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  phone      text,
  role       text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- ============================================================
-- PROPERTIES
-- ============================================================
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

-- ============================================================
-- BOOKINGS
-- ============================================================
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

create index idx_bookings_property_dates
  on public.bookings(property_id, start_date, end_date)
  where status = 'confirmed';

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
      and (p_exclude_id is null or id <> p_exclude_id)
      and start_date <= p_end_date
      and end_date >= p_start_date
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY — PROFILES
-- ============================================================
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);

-- Use auth.jwt() for admin checks to avoid infinite recursion on profiles table
create policy "Admins can read all profiles"
  on public.profiles for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can manage all profiles"
  on public.profiles for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- ROW LEVEL SECURITY — PROPERTIES
-- ============================================================
alter table public.properties enable row level security;

create policy "Anyone can read properties"
  on public.properties for select using (true);

create policy "Only admins can insert properties"
  on public.properties for insert
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Only admins can update properties"
  on public.properties for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Only admins can delete properties"
  on public.properties for delete
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- ROW LEVEL SECURITY — BOOKINGS
-- ============================================================
alter table public.bookings enable row level security;

create policy "Anyone can create a booking"
  on public.bookings for insert with check (true);

create policy "Users can read their own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "Admins can read all bookings"
  on public.bookings for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Admins can update any booking"
  on public.bookings for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- STORAGE POLICIES (for 'property' bucket)
-- Create bucket first: Storage → New bucket → property → Public ON
-- ============================================================
create policy "Public can view property images"
  on storage.objects for select
  using (bucket_id = 'property');

create policy "Admins can upload property images"
  on storage.objects for insert
  with check (
    bucket_id = 'property'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Admins can delete property images"
  on storage.objects for delete
  using (
    bucket_id = 'property'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- SEED DATA
-- ============================================================
insert into public.properties (title, description, price, location, images, rating, max_guests, amenities) values
(
  'Misty Mountain Villa',
  'A private 3-bedroom villa nestled in the tea plantations of Munnar. Enjoy panoramic views of the Western Ghats from your balcony. Perfect for families seeking complete privacy and nature.',
  450, 'Munnar, Kerala',
  array['https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1600596542815-27b88e39e569?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&q=80'],
  4.9, 8, array['Mountain View','Private Garden','Campfire area','Full Kitchen','Caretaker','Homely Meals (on pre-order)']
),
(
  'Wayanad Cloud Home',
  'Experience living in the clouds. This heritage bungalow offers a serene escape with modern comforts. Surrounded by coffee estates and spice gardens.',
  350, 'Wayanad, Kerala',
  array['https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&q=80'],
  4.8, 6, array['Valley View','Spice Plantation Walk','Home Cooked Meals','Wifi','Parking','Homely Meals (on pre-order)']
),
(
  'Ooty Heritage Cottage',
  'A charming colonial-style cottage in the heart of the Nilgiris. Cozy up by the fireplace after a day of exploring. Walking distance to the lake.',
  300, 'Ooty, Tamil Nadu',
  array['https://images.unsplash.com/photo-1518780664697-55e3ad913afb?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80'],
  4.7, 5, array['Fireplace','Lawn','Heater','Kitchen','Pet Friendly','Homely Meals (on pre-order)']
);
