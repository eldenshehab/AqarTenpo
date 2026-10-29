-- ==============================================================================
-- عقار تينبو | AQAR TENPO - المخطط الشامل والآمن لقاعدة البيانات (Supabase Complete Migration)
-- شغّل هذا الملف بالكامل لمرة واحدة داخل Supabase Dashboard -> SQL Editor
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. جدول الحسابات والملفات الشخصية (Profiles)
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

-- 2. جدول الإعلانات والعقارات (Listings)
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

-- 3. جدول أرقام الهواتف المحمية (Private Listing Contacts)
create table if not exists public.listing_contacts (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  phone text not null,
  created_at timestamptz not null default now()
);

-- 4. جدول طلبات المعاينة والاستفسارات (Inquiries)
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

-- 5. جدول البلاغات عن الإعلانات غير الصحيحة (Listing Reports)
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- دوال الأمان والتحقق من الصلاحيات (Security Functions)
-- ==============================================================================

-- فحص هل المستخدم الحالي أدمن
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ 
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- تفعيل حساب الأدمن المعتمد الأول
create or replace function public.claim_initial_admin()
returns boolean language plpgsql security definer set search_path = public
as $$
declare caller_email text;
begin
  select lower(email) into caller_email from auth.users where id = auth.uid();
  if caller_email <> 'mohamedsjeha0@gmail.com' then return false; end if;
  insert into public.profiles (id, email, name, account_type, role)
  select id, coalesce(email, ''), 'AqarTenpo Admin', 'company', 'admin'
  from auth.users where id = auth.uid()
  on conflict (id) do update set role = 'admin', updated_at = now();
  update public.profiles set role = 'admin', updated_at = now() where id = auth.uid();
  return true;
end;
$$;
grant execute on function public.claim_initial_admin() to authenticated;

-- إنشاء البروفايل تلقائياً عند التسجيل بـ Google أو الإيميل
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare initial_role text;
begin
  if lower(new.email) = 'mohamedsjeha0@gmail.com' then
    initial_role := 'admin';
  else
    initial_role := 'user';
  end if;

  insert into public.profiles (id, email, name, phone, account_type, role, company_name, commercial_registration, office, license, bio)
  values (
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
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- حماية حقول البروفايل الحساسة من التعديل الذاتي
create or replace function public.guard_profile()
returns trigger language plpgsql set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if lower(new.email) <> 'mohamedsjeha0@gmail.com' then
      new.role := 'user';
    end if;
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

-- عدادات المشاهدات وكشف الهاتف الآمنة
create or replace function public.increment_listing_view(listing_uuid uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.listings set views = views + 1 where id = listing_uuid and status = 'approved';
end $$;

create or replace function public.increment_phone_view(listing_uuid uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.listings set phone_views = phone_views + 1 where id = listing_uuid and status = 'approved';
end $$;

grant execute on function public.increment_listing_view(uuid) to anon, authenticated;
grant execute on function public.increment_phone_view(uuid) to anon, authenticated;

-- ربط المعاينات والبلاغات بصاحب الإعلان الأصلي تلقائياً
create or replace function public.fill_inquiry()
returns trigger language plpgsql security definer set search_path = public
as $$
declare listing_owner uuid;
begin
  select owner_id into listing_owner from public.listings where id = new.listing_id;
  if listing_owner is null then
    raise exception 'Listing not found';
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

-- ==============================================================================
-- سياسات الأمان والحماية المتقدمة (Row Level Security - RLS)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_contacts enable row level security;
alter table public.inquiries enable row level security;
alter table public.listing_reports enable row level security;

-- 1. البروفايلات: القراءة للمالك أو الأدمن، التعديل للمالك
drop policy if exists "profiles own or admin read" on public.profiles;
create policy "profiles own or admin read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- 2. الإعلانات: الإعلانات المعتمدة يراها الجميع، المعلقة يراها صاحبها أو الأدمن
drop policy if exists "approved listings public read" on public.listings;
create policy "approved listings public read" on public.listings for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
drop policy if exists "authenticated create listings" on public.listings;
create policy "authenticated create listings" on public.listings for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "owner or admin update listings" on public.listings;
create policy "owner or admin update listings" on public.listings for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists "owner or admin delete listings" on public.listings;
create policy "owner or admin delete listings" on public.listings for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

-- 3. خصوصية أرقام الهواتف: تظهر للجميع في الإعلانات المباشرة العادية فقط، وتُحجب تماماً في إعلانات التنازل والوساطة الحصرية لتبقى للأدمن وصاحب العقار فقط
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
drop policy if exists "owner contact insert" on public.listing_contacts;
create policy "owner contact insert" on public.listing_contacts for insert to authenticated with check (
  owner_id = auth.uid()
  and exists (select 1 from public.listings l where l.id = listing_contacts.listing_id and l.owner_id = auth.uid())
);
drop policy if exists "owner contact update" on public.listing_contacts;
create policy "owner contact update" on public.listing_contacts for update to authenticated using (owner_id = auth.uid()) with check (
  owner_id = auth.uid()
  and exists (select 1 from public.listings l where l.id = listing_contacts.listing_id and l.owner_id = auth.uid())
);

-- 4. طلبات المعاينة والاستفسارات
drop policy if exists "anyone create inquiry" on public.inquiries;
create policy "anyone create inquiry" on public.inquiries for insert to anon, authenticated with check (true);
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

-- 5. البلاغات
drop policy if exists "anyone reports listing" on public.listing_reports;
create policy "anyone reports listing" on public.listing_reports for insert to anon, authenticated with check (true);
drop policy if exists "admin reads reports" on public.listing_reports;
create policy "admin reads reports" on public.listing_reports for select to authenticated using (public.is_admin());

-- ==============================================================================
-- باكت تخزين الصور والوسائط (Storage Bucket & Policies)
-- ==============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public property media read" on storage.objects;
create policy "public property media read" on storage.objects for select using (bucket_id = 'property-media');

drop policy if exists "users upload own property media" on storage.objects;
create policy "users upload own property media" on storage.objects for insert to authenticated
with check (bucket_id = 'property-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update own property media" on storage.objects;
create policy "users update own property media" on storage.objects for update to authenticated
using (bucket_id = 'property-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own property media" on storage.objects;
create policy "users delete own property media" on storage.objects for delete to authenticated
using (bucket_id = 'property-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
