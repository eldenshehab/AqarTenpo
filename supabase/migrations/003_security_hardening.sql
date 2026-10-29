-- AqarTenpo 003: security hardening. Run AFTER 001 and 002, once, in Supabase > SQL Editor. Safe to re-run.
--
-- Fixes:
--  1. Users could change their own profile role to 'admin' (the update policy allowed every column).
--  2. A user could attach their phone to someone else's listing that had no contact row yet.
--  3. Inquiry owner/sender and report author could be forged by the client.
--  4. An owner could turn an approved assignment/brokerage listing back into a direct one, making
--     their phone public and bypassing AqarTenpo.
--
-- "Trusted" below means the SQL Editor, the service role, or a security-definer function
-- (current_user is then not anon/authenticated). Those may change anything, as may admins.

-- 1) Profiles: role, email, id and created_at are not editable by ordinary users -------------------
create or replace function public.guard_profile()
returns trigger language plpgsql set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'user';
  else
    new.id := old.id;
    new.role := old.role;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
for each row execute procedure public.guard_profile();

-- 2) A contact row may only be created/changed for the user's own listing -------------------------
drop policy if exists "owner contact insert" on public.listing_contacts;
create policy "owner contact insert" on public.listing_contacts for insert to authenticated
with check (
  owner_id = auth.uid()
  and exists (select 1 from public.listings l where l.id = listing_contacts.listing_id and l.owner_id = auth.uid())
);

drop policy if exists "owner contact update" on public.listing_contacts;
create policy "owner contact update" on public.listing_contacts for update to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and exists (select 1 from public.listings l where l.id = listing_contacts.listing_id and l.owner_id = auth.uid())
);

-- 3) Inquiries and reports: the server decides who owns and who sent them -------------------------
create or replace function public.fill_inquiry()
returns trigger language plpgsql security definer set search_path = public
as $$
declare listing_owner uuid;
begin
  select owner_id into listing_owner from public.listings where id = new.listing_id and status = 'approved';
  if listing_owner is null then
    raise exception 'Listing not found or not published';
  end if;
  new.owner_id := listing_owner;
  new.sender_id := auth.uid();
  return new;
end $$;

drop trigger if exists inquiries_fill on public.inquiries;
create trigger inquiries_fill before insert on public.inquiries
for each row execute procedure public.fill_inquiry();

create or replace function public.fill_report()
returns trigger language plpgsql security definer set search_path = public
as $$ begin new.reporter_id := auth.uid(); return new; end $$;

drop trigger if exists reports_fill on public.listing_reports;
create trigger reports_fill before insert on public.listing_reports
for each row execute procedure public.fill_report();

-- 4) Listing rules (replaces the 002 version, same behaviour plus the managed-listing lock) --------
create or replace function public.enforce_listing_rules()
returns trigger language plpgsql set search_path = public
as $$
declare managed boolean;
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;   -- trusted context
  if current_setting('app.bypass_listing_rules', true) = '1' then return new; end if;
  if public.is_admin() then return new; end if;

  if tg_op = 'UPDATE' then
    -- once AqarTenpo manages a listing, its owner cannot turn it back into a direct one
    if (old.data->'assignment') is not null and (new.data->'assignment') is null then
      new.data := jsonb_set(new.data, '{assignment}', old.data->'assignment');
    end if;
    if coalesce(old.data->>'mode', 'direct') <> 'direct' then
      new.data := jsonb_set(new.data, '{mode}', old.data->'mode');
    end if;
  end if;

  managed := coalesce(new.data->>'mode', 'direct') <> 'direct' or (new.data->'assignment') is not null;

  if tg_op = 'INSERT' then
    new.status := case when managed then 'pending' else 'approved' end;
    new.views := 0;
    new.phone_views := 0;
    new.expires_at := now() + interval '90 days';
  else
    new.owner_id := old.owner_id;
    new.views := old.views;
    new.phone_views := old.phone_views;
    new.expires_at := old.expires_at;
    if old.status = 'rejected' then new.status := 'rejected';
    elsif managed then new.status := 'pending';
    else new.status := 'approved';
    end if;
  end if;
  return new;
end $$;

-- Make another account admin (run in SQL Editor, replace the email):
--   update public.profiles set role = 'admin' where email = 'you@gmail.com';
