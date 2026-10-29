-- ==============================================================================
-- عقار تينبو | إحصاءات زوار الموقع والتقرير اليومي (Analytics)
-- شغّل هذا الملف بعد 001_aqartenpo_complete.sql داخل Supabase -> SQL Editor
-- ==============================================================================

create table if not exists public.page_views (
  id bigserial primary key,
  visitor_id text not null,
  path text not null default '/',
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id, created_at desc);

alter table public.page_views enable row level security;
-- لا توجد سياسات قراءة/كتابة مباشرة: الوصول فقط عبر الدوال الآمنة أدناه.

-- تسجيل زيارة (متاح للزوار غير المسجلين أيضًا) مع تنظيف تلقائي للبيانات الأقدم من 90 يومًا
create or replace function public.track_visit(p_visitor text, p_path text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.page_views (visitor_id, path)
  values (left(coalesce(nullif(p_visitor, ''), 'anon'), 64), left(coalesce(nullif(p_path, ''), '/'), 200));

  if random() < 0.02 then
    delete from public.page_views where created_at < now() - interval '90 days';
  end if;
end $$;

grant execute on function public.track_visit(text, text) to anon, authenticated;

-- تقرير شامل للأدمن فقط
create or replace function public.get_site_stats()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  result jsonb;
  days jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select coalesce(jsonb_agg(row_to_json(d) order by d.day), '[]'::jsonb) into days
  from (
    select
      to_char(series.day, 'YYYY-MM-DD') as day,
      (select count(distinct pv.visitor_id) from public.page_views pv
        where pv.created_at >= series.day and pv.created_at < series.day + interval '1 day') as visitors,
      (select count(*) from public.page_views pv
        where pv.created_at >= series.day and pv.created_at < series.day + interval '1 day') as visits
    from generate_series(
      date_trunc('day', now()) - interval '6 days',
      date_trunc('day', now()),
      interval '1 day'
    ) as series(day)
  ) d;

  result := jsonb_build_object(
    'users_total',      (select count(*) from public.profiles),
    'users_today',      (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    'admins',           (select count(*) from public.profiles where role = 'admin'),
    'visitors_today',   (select count(distinct visitor_id) from public.page_views where created_at >= date_trunc('day', now())),
    'visits_today',     (select count(*) from public.page_views where created_at >= date_trunc('day', now())),
    'visitors_week',    (select count(distinct visitor_id) from public.page_views where created_at >= now() - interval '7 days'),
    'visits_total',     (select count(*) from public.page_views),
    'listings_total',   (select count(*) from public.listings),
    'listings_pending', (select count(*) from public.listings where status = 'pending'),
    'listings_approved',(select count(*) from public.listings where status = 'approved'),
    'inquiries_total',  (select count(*) from public.inquiries),
    'inquiries_today',  (select count(*) from public.inquiries where created_at >= date_trunc('day', now())),
    'weekly',           days
  );

  return result;
end $$;

grant execute on function public.get_site_stats() to authenticated;
