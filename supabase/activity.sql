-- Run this once in Supabase SQL Editor to enable anonymous visitor and bag metrics.
create table if not exists public.store_activity (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('visit', 'bag_open')),
  created_at timestamptz not null default now()
);

alter table public.store_activity enable row level security;
grant usage on schema public to service_role;
grant insert, select on table public.store_activity to service_role;
