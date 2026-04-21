-- Run in Supabase SQL Editor.
-- Stores editable homepage content (currently image paths).

create table if not exists public.homepage_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.homepage_content enable row level security;

drop policy if exists "homepage_content_select_public" on public.homepage_content;
create policy "homepage_content_select_public"
on public.homepage_content
for select
to anon, authenticated
using (true);

drop policy if exists "homepage_content_admin_write" on public.homepage_content;
create policy "homepage_content_admin_write"
on public.homepage_content
for all
to authenticated
using (public.app_user_is_admin() is true)
with check (public.app_user_is_admin() is true);
