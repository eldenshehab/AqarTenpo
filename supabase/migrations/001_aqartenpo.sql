-- AqarTenpo production schema: Auth + listings + private contacts + media + leads.
-- Run this file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text,
  account_type text not null default 'individual' check (account_type in ('individual','company','broker')),
  role text not null default 'user' check (role in ('user','admin')),
  company_name text,
  commercial_registration text,
  office text,
  license text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  data jsonb not null default '{}'::jsonb,
  views integer not null default 0,
  phone_views integer not null default 0,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phone numbers are intentionally separate from public listing JSON.
create table if not exists public.listing_contacts (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'inquiry' check (kind in ('inquiry','tour')),
  name text not null,
  phone text not null,
  requested_date date,
  requested_time time,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Only this authenticated email can claim the initial admin role.
create or replace function public.claim_initial_admin()
returns boolean language plpgsql security definer set search_path = public
as $$
declare caller_email text;
begin
  select lower(email) into caller_email from auth.users where id = auth.uid();
  if caller_email <> 'mohamedsjeha0@gmail.com' then return false; end if;
  insert into public.profiles (id,email,name,account_type)
  select id,coalesce(email,''),coalesce(raw_user_meta_data->>'name',raw_user_meta_data->>'full_name','AqarTenpo Admin'),'company'
  from auth.users where id=auth.uid()
  on conflict (id) do nothing;
  update public.profiles set role = 'admin', updated_at = now() where id = auth.uid();
  return true;
end;
$$;
grant execute on function public.claim_initial_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id,email,name,phone,account_type,company_name,commercial_registration,office,license,bio)
  values (
    new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'phone', coalesce(new.raw_user_meta_data->>'account_type','individual'),
    new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'commercial_registration',
    new.raw_user_meta_data->>'office', new.raw_user_meta_data->>'license', new.raw_user_meta_data->>'bio'
  ) on conflict (id) do update set
    email=excluded.email, name=excluded.name, updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles when the migration is applied after users already exist.
insert into public.profiles (id,email,name,phone,account_type,company_name,commercial_registration,office,license,bio)
select id,coalesce(email,''),coalesce(raw_user_meta_data->>'name',raw_user_meta_data->>'full_name',''),
  raw_user_meta_data->>'phone',coalesce(raw_user_meta_data->>'account_type','individual'),
  raw_user_meta_data->>'company_name',raw_user_meta_data->>'commercial_registration',
  raw_user_meta_data->>'office',raw_user_meta_data->>'license',raw_user_meta_data->>'bio'
from auth.users
on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists listings_touch on public.listings;
create trigger listings_touch before update on public.listings for each row execute procedure public.touch_updated_at();

create or replace function public.increment_listing_view(listing_uuid uuid)
returns void language sql security definer set search_path = public
as $$ update public.listings set views = views + 1 where id = listing_uuid and status = 'approved' $$;
grant execute on function public.increment_listing_view(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_contacts enable row level security;
alter table public.inquiries enable row level security;
alter table public.listing_reports enable row level security;

drop policy if exists "profiles own or admin read" on public.profiles;
create policy "profiles own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "approved listings public read" on public.listings;
create policy "approved listings public read" on public.listings for select using (status='approved' or owner_id=auth.uid() or public.is_admin());
drop policy if exists "authenticated create listings" on public.listings;
create policy "authenticated create listings" on public.listings for insert to authenticated with check (owner_id=auth.uid());
drop policy if exists "owner or admin update listings" on public.listings;
create policy "owner or admin update listings" on public.listings for update to authenticated using (owner_id=auth.uid() or public.is_admin()) with check (owner_id=auth.uid() or public.is_admin());
drop policy if exists "owner or admin delete listings" on public.listings;
create policy "owner or admin delete listings" on public.listings for delete to authenticated using (owner_id=auth.uid() or public.is_admin());

drop policy if exists "private listing contact read" on public.listing_contacts;
create policy "private listing contact read" on public.listing_contacts for select to authenticated using (owner_id=auth.uid() or public.is_admin());
drop policy if exists "owner contact insert" on public.listing_contacts;
create policy "owner contact insert" on public.listing_contacts for insert to authenticated with check (owner_id=auth.uid());
drop policy if exists "owner contact update" on public.listing_contacts;
create policy "owner contact update" on public.listing_contacts for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());

drop policy if exists "anyone create inquiry" on public.inquiries;
create policy "anyone create inquiry" on public.inquiries for insert to anon, authenticated with check (true);
drop policy if exists "owner reads inquiries" on public.inquiries;
create policy "owner reads inquiries" on public.inquiries for select to authenticated using (owner_id=auth.uid() or public.is_admin());

drop policy if exists "anyone reports listing" on public.listing_reports;
create policy "anyone reports listing" on public.listing_reports for insert to anon, authenticated with check (true);
drop policy if exists "admin reads reports" on public.listing_reports;
create policy "admin reads reports" on public.listing_reports for select to authenticated using (public.is_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('property-media','property-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "public property media read" on storage.objects;
create policy "public property media read" on storage.objects for select using (bucket_id='property-media');
drop policy if exists "users upload own property media" on storage.objects;
create policy "users upload own property media" on storage.objects for insert to authenticated
with check (bucket_id='property-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users update own property media" on storage.objects;
create policy "users update own property media" on storage.objects for update to authenticated
using (bucket_id='property-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users delete own property media" on storage.objects;
create policy "users delete own property media" on storage.objects for delete to authenticated
using (bucket_id='property-media' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
