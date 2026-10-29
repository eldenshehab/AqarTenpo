-- AqarTenpo migration 004: promote the requested Google account and repair cloud photo storage.
-- Run ONCE in Supabase Dashboard > SQL Editor, AFTER migrations 001, 002 and 003.
-- Safe to re-run. This file intentionally contains no Google OAuth client secret.

-- Promote the already registered Google account; remove the earlier sample admin role.
update public.profiles
set role = 'user', updated_at = now()
where lower(email) = 'admin@aqartenpo.com'
  and lower(email) <> 'mohamedsjeha0@gmail.com';

insert into public.profiles (id, email, name, account_type, role)
select u.id,
       coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', 'Mohamed Sjeha'),
       coalesce(u.raw_user_meta_data->>'account_type', 'individual'),
       'admin'
from auth.users u
where lower(u.email) = 'mohamedsjeha0@gmail.com'
on conflict (id) do update set role = 'admin', updated_at = now();

-- Secure first-login role claim, restricted to the one configured account.
create or replace function public.claim_initial_admin()
returns boolean language plpgsql security definer set search_path = public
as $$
declare caller_email text;
begin
  select lower(email) into caller_email from auth.users where id = auth.uid();
  if caller_email <> 'mohamedsjeha0@gmail.com' then return false; end if;

  insert into public.profiles (id, email, name, account_type, role)
  select u.id, coalesce(u.email, ''),
         coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', 'Mohamed Sjeha'),
         coalesce(u.raw_user_meta_data->>'account_type', 'individual'), 'admin'
  from auth.users u where u.id = auth.uid()
  on conflict (id) do update set role = 'admin', updated_at = now();
  return true;
end;
$$;
grant execute on function public.claim_initial_admin() to authenticated;

-- Keep the auth trigger in sync for future sign-ups.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare initial_role text;
begin
  initial_role := case
    when lower(coalesce(new.email, '')) = 'mohamedsjeha0@gmail.com' then 'admin'
    else 'user'
  end;

  insert into public.profiles (
    id, email, name, phone, account_type, role, company_name,
    commercial_registration, office, license, bio
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    initial_role,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'commercial_registration',
    new.raw_user_meta_data->>'office',
    new.raw_user_meta_data->>'license',
    new.raw_user_meta_data->>'bio'
  ) on conflict (id) do update set
    email = excluded.email,
    name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
    role = case when lower(excluded.email) = 'mohamedsjeha0@gmail.com' then 'admin' else public.profiles.role end,
    updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill/promote the Google profile if it was created before this migration.
insert into public.profiles (id, email, name, account_type, role)
select u.id, coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', ''),
       coalesce(u.raw_user_meta_data->>'account_type', 'individual'), 'admin'
from auth.users u
where lower(u.email) = 'mohamedsjeha0@gmail.com'
on conflict (id) do update set role = 'admin', updated_at = now();

-- Ensure the bucket exists and accepts the JPEGs produced by the browser uploader.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 12582912,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Client path: {authenticated UUID}/{folder}/{random UUID}.jpg
drop policy if exists "public property media read" on storage.objects;
drop policy if exists "users upload own property media" on storage.objects;
drop policy if exists "users update own property media" on storage.objects;
drop policy if exists "users delete own property media" on storage.objects;

create policy "public property media read"
  on storage.objects for select
  using (bucket_id = 'property-media');

create policy "users upload own property media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own property media"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'property-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own property media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));