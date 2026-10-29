/*
 * تحليلات الموقع: عدد الزوار اليوم والزيارات وتقرير آخر 7 أيام.
 * يعمل مع Supabase عبر دوال آمنة، ويسقط تلقائيًا إلى عدّاد محلي في وضع المعاينة.
 */
import { isSupabaseConfigured, supabase } from './supabase';

const VISITOR_KEY = 'at_visitor_id';
const LOCAL_KEY = 'at_local_analytics';
const SEEN_KEY = 'at_seen_path';

export interface DayPoint { day: string; visitors: number; visits: number }

export interface SiteStats {
  source: 'cloud' | 'local';
  usersTotal: number;
  usersToday: number;
  admins: number;
  visitorsToday: number;
  visitsToday: number;
  visitorsWeek: number;
  visitsTotal: number;
  listingsTotal: number;
  listingsPending: number;
  listingsApproved: number;
  inquiriesTotal: number;
  inquiriesToday: number;
  weekly: DayPoint[];
}

export const EMPTY_STATS: SiteStats = {
  source: 'local', usersTotal: 0, usersToday: 0, admins: 0, visitorsToday: 0, visitsToday: 0,
  visitorsWeek: 0, visitsTotal: 0, listingsTotal: 0, listingsPending: 0, listingsApproved: 0,
  inquiriesTotal: 0, inquiriesToday: 0, weekly: [],
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const daysBack = (n: number) => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
};

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || `v${Date.now()}${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

interface LocalShape { days: Record<string, { visits: number; visitors: string[] }> }

function readLocal(): LocalShape {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '') as LocalShape;
  } catch {
    return { days: {} };
  }
}

function writeLocal(value: LocalShape) {
  try {
    // نُبقي 30 يومًا فقط حتى لا تتضخم الذاكرة المحلية
    const keep = daysBack(30);
    const days: LocalShape['days'] = {};
    keep.forEach(k => { if (value.days[k]) days[k] = value.days[k]; });
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ days }));
  } catch {
    /* storage unavailable */
  }
}

/** تُستدعى عند كل تنقّل؛ تُسجل زيارة واحدة لكل جلسة، ولكل مسار مختلف. */
export async function trackVisit(path: string) {
  const id = visitorId();
  const today = dayKey(new Date());
  try {
    const seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || '{}') as Record<string, boolean>;
    const key = `${today}:${path}`;
    if (seen[key]) return;
    seen[key] = true;
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* ignore */
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.rpc('track_visit', { p_visitor: id, p_path: path });
      return;
    } catch {
      /* fall through to local counting */
    }
  }

  const local = readLocal();
  const bucket = local.days[today] || { visits: 0, visitors: [] };
  bucket.visits += 1;
  if (!bucket.visitors.includes(id)) bucket.visitors.push(id);
  local.days[today] = bucket;
  writeLocal(local);
}

/** إحصاءات محلية احتياطية حتى يبقى تقرير الأدمن مفيدًا قبل ربط Supabase. */
export function localStats(listings: { reviewStatus?: string }[], inquiries: number): SiteStats {
  const local = readLocal();
  const week = daysBack(7).map(day => ({
    day,
    visitors: local.days[day]?.visitors.length || 0,
    visits: local.days[day]?.visits || 0,
  }));
  const today = week[week.length - 1];
  let accounts: { email?: string; isAdmin?: boolean }[] = [];
  try {
    const map = JSON.parse(localStorage.getItem('at_accounts') || '{}') as Record<string, { isAdmin?: boolean }>;
    accounts = Object.values(map);
  } catch {
    /* ignore */
  }
  return {
    ...EMPTY_STATS,
    source: 'local',
    usersTotal: accounts.length,
    usersToday: localStorage.getItem('at_user') ? 1 : 0,
    admins: accounts.filter(a => a.isAdmin).length || (localStorage.getItem('at_user') ? 1 : 0),
    visitorsToday: today?.visitors || 0,
    visitsToday: today?.visits || 0,
    visitorsWeek: week.reduce((s, d) => s + d.visitors, 0),
    visitsTotal: Object.values(local.days).reduce((s, d) => s + d.visits, 0),
    listingsTotal: listings.filter(l => 'ownerId' in l).length,
    listingsPending: listings.filter(l => l.reviewStatus === 'pending').length,
    listingsApproved: listings.filter(l => l.reviewStatus === 'approved').length,
    inquiriesTotal: inquiries,
    inquiriesToday: inquiries,
    weekly: week,
  };
}

export async function fetchSiteStats(fallback: () => SiteStats): Promise<SiteStats> {
  if (!isSupabaseConfigured || !supabase) return fallback();
  try {
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
    const request = supabase.rpc('get_site_stats').then(({ data, error }) => (error || !data ? null : data as Record<string, unknown>));
    const data = await Promise.race([request, timeout]);
    if (!data) return fallback();
    const weekly = Array.isArray(data.weekly) ? (data.weekly as DayPoint[]) : [];
    return {
      source: 'cloud',
      usersTotal: Number(data.users_total || 0),
      usersToday: Number(data.users_today || 0),
      admins: Number(data.admins || 0),
      visitorsToday: Number(data.visitors_today || 0),
      visitsToday: Number(data.visits_today || 0),
      visitorsWeek: Number(data.visitors_week || 0),
      visitsTotal: Number(data.visits_total || 0),
      listingsTotal: Number(data.listings_total || 0),
      listingsPending: Number(data.listings_pending || 0),
      listingsApproved: Number(data.listings_approved || 0),
      inquiriesTotal: Number(data.inquiries_total || 0),
      inquiriesToday: Number(data.inquiries_today || 0),
      weekly,
    };
  } catch {
    return fallback();
  }
}
