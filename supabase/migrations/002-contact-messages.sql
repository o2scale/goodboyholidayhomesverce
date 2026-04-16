-- ============================================================
-- Migration: Add contact_messages table
-- Run this in Supabase SQL Editor
-- ============================================================

create table public.contact_messages (
  id         uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name  text,
  email      text not null,
  phone      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_contact_messages_created_at
  on public.contact_messages(created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (including anonymous visitors) can submit a contact message
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert with check (true);

-- Only admins can read contact messages
create policy "Admins can read contact messages"
  on public.contact_messages for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Only admins can update (mark as read/unread)
create policy "Admins can update contact messages"
  on public.contact_messages for update
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Only admins can delete
create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
