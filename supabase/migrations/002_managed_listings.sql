-- AqarTenpo 002: managed listings (assignment + brokerage) and public owner phones.
-- Run AFTER 001_aqartenpo.sql, once, in Supabase Dashboard > SQL Editor. Safe to re-run.
--
-- Rules implemented here (enforced by the database, not just the UI):
--  * Ordinary listings: the owner's phone is public and the listing goes live immediately.
--  * Managed listings (data.mode = 'brokerage' or data.assignment present): AqarTenpo publishes the ad
--    and talks to buyers. The owner's phone is readable ONLY by the owner and the admin, the listing
--    waits for admin approval, and buyer inquiries are routed to the admin, not to the seller.

-- 1) Who can read a listing phone ---------------------------------------------------------------
drop policy if exists "private listing contact read" on public.listing_contacts;
drop policy if exists "listing contact read" on public.listing_contacts;
create policy "listing contact read" on public.listing_contacts for select using (
  owner_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.listings l
    where l.id = listing_contacts.listing_id
      and l.status = 'approved'
      and coalesce(l.data->>'mode', 'direct') = 'direct'
      and (l.data->'assignment') is null
  )
);

-- 2) Publishing rules: owners cannot approve their own managed listings --------------------------
create or replace function public.enforce_listing_rules()
returns trigger language plpgsql security definer set search_path = public
as $$
declare managed boolean;
begin
  -- internal counters (views / phone reveals) use this flag
  if current_setting('app.bypass_listing_rules', true) = '1' then return new; end if;
  if public.is_admin() then return new; end if;

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
    elsif managed then new.status := 'pending';   -- edits to a managed listing go back to review
    else new.status := 'approved';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_enforce on public.listings;
create trigger listings_enforce before insert or update on public.listings
for each row execute procedure public.enforce_listing_rules();

-- "last updated" must not change when a visitor merely views the listing
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  if current_setting('app.bypass_listing_rules', true) = '1' then return new; end if;
  new.updated_at = now();
  return new;
end $$;

-- 3) Counters --------------------------------------------------------------------------------------
create or replace function public.increment_listing_view(listing_uuid uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_listing_rules', '1', true);
  update public.listings set views = views + 1 where id = listing_uuid and status = 'approved';
end $$;

create or replace function public.increment_phone_view(listing_uuid uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_listing_rules', '1', true);
  update public.listings set phone_views = phone_views + 1 where id = listing_uuid and status = 'approved';
end $$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;
grant execute on function public.increment_phone_view(uuid) to anon, authenticated;

-- 4) Inquiries on managed listings go to the admin only, so sellers cannot bypass AqarTenpo ---------
drop policy if exists "owner reads inquiries" on public.inquiries;
create policy "owner reads inquiries" on public.inquiries for select to authenticated using (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id
        and coalesce(l.data->>'mode', 'direct') = 'direct'
        and (l.data->'assignment') is null
    )
  )
);
