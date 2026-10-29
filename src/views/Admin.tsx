import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Eye, Phone, ShieldCheck, Trash2, Users, XCircle, Key, Search, UserPlus, Activity, RefreshCw, TrendingUp } from 'lucide-react';
import { api, useApp, LOCAL_ADMIN_PASSWORD, type Inquiry } from '../store';
import { fmt, type Property } from '../data';
import { PropertyImage, Price } from '../components/Common';
import { isManaged } from '../config';
import { ADMIN_EMAIL, isSupabaseConfigured } from '../lib/supabase';
import { EMPTY_STATS, fetchSiteStats, localStats, type SiteStats } from '../lib/analytics';

export default function Admin() {
  const { t, lang, user, listings, reviewListing, removeListing, setAuthOpen, go } = useApp();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<SiteStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(false);
  const managed = useMemo(() => listings.filter(p => p.ownerId), [listings]);
  const rows = useMemo(() => {
    return managed
      .filter(p => (p.reviewStatus || 'pending') === tab)
      .filter(p => !query || `${p.title} ${p.titleEn} ${p.city} ${p.locationArea || ''} ${p.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  }, [managed, tab, query]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.inquiries().then(async rows => {
      setInquiries(rows);
      const fallback = () => localStats(listings, rows.length);
      setStats(await fetchSiteStats(fallback));
    }).catch(() => setStats(localStats(listings, 0)));
  }, [user, listings]);

  const reloadStats = async () => {
    setStatsLoading(true);
    try {
      const rows = await api.inquiries().catch(() => [] as Inquiry[]);
      setStats(await fetchSiteStats(() => localStats(listings, rows.length)));
    } finally {
      setStatsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 pt-28 text-center">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-md w-full">
          <ShieldCheck className="mx-auto text-blue-600" size={48} />
          <h1 className="mt-3 text-2xl font-black text-slate-900">{t('لوحة تحكم المسؤول (Admin)', 'Admin Access')}</h1>
          <p className="mt-2 text-xs text-slate-500 leading-5">
            {t('يرجى تسجيل الدخول بحساب الأدمن لإدارة الإعلانات والمعاينات والتحقق من الهواتف.', 'Sign in with an admin account to manage listings and viewing leads.')}
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-xs font-mono text-start space-y-1">
            <p className="font-bold text-slate-700">{t('حساب الأدمن:', 'Admin account:')}</p>
            <p className="text-blue-700">Email: {ADMIN_EMAIL}</p>
            {isSupabaseConfigured ? (
              <p className="text-slate-600">{t('سجّل باستخدام Google بهذا البريد. كلمة مرور جوجل لا يحددها الموقع.', 'Use Google with this email. The app does not set your Google password.')}</p>
            ) : (
              <p className="text-slate-600">Local preview password: {LOCAL_ADMIN_PASSWORD}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAuthOpen('login')}
            className="mt-5 w-full rounded-full bg-slate-950 py-3 text-sm font-bold text-white hover:bg-blue-600 transition"
          >
            {t('تسجيل الدخول كأدمن', 'Log in as Admin')}
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 pt-28 text-center">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-sm w-full">
          <XCircle className="mx-auto text-rose-500" size={48} />
          <h1 className="mt-3 text-2xl font-black text-slate-900">{t('غير مصرح لك بدخول لوحة الإدارة', 'Admin Access Required')}</h1>
          <p className="mt-2 text-xs text-slate-500 leading-5">
            {t(`الحساب الحالي (${user.email}) ليس لديه صلاحيات الأدمن. لتفعيله، تواصل مع المطور أو قم بتشغيل أمر SQL في Supabase.`, `Current account (${user.email}) is not an admin.`)}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => go('/status')}
              className="flex-1 rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              {t('صفحة تشخيص الحالة', 'Diagnostics')}
            </button>
            <button
              type="button"
              onClick={() => go('/')}
              className="flex-1 rounded-full border border-slate-300 py-2.5 text-xs font-bold text-slate-700"
            >
              {t('الرئيسية', 'Home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const act = async (p: Property, action: 'approved' | 'rejected' | 'delete') => {
    setBusy(p.id);
    try {
      if (action === 'delete') await removeListing(p.id);
      else await reviewListing(p.id, action);
    } finally {
      setBusy('');
    }
  };

  const count = (status: string) => managed.filter(p => (p.reviewStatus || 'pending') === status).length;

  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-4 pb-20 pt-28 text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm">
              <Key size={16} />
            </span>
            <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">AQAR TENPO · ADMIN CONTROL</p>
          </div>
          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">{t('لوحة تحكم إدارة المنصة', 'Admin Dashboard')}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {t('المسؤول المسجل:', 'Signed in as:')} <b className="text-slate-800">{user.email}</b>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric icon={Clock3} value={count('pending')} label={t('قيد المراجعة', 'Pending')} highlight={count('pending') > 0} />
          <Metric icon={CheckCircle2} value={count('approved')} label={t('معتمد', 'Approved')} />
          <Metric icon={Users} value={inquiries.length} label={t('طلبات المعاينة', 'Viewing Leads')} />
        </div>
      </div>

      {/* تقرير يومي: المستخدمون والزوار */}
      <section className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Activity size={16} className="text-blue-600" />
            {t('تقرير اليوم', 'Today at a glance')}
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${stats.source === 'cloud' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {stats.source === 'cloud' ? t('مباشر من السحابة', 'Live from cloud') : t('عدّاد هذا الجهاز', 'This device only')}
            </span>
          </h2>
          <button type="button" onClick={reloadStats} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-blue-400">
            <RefreshCw size={12} className={statsLoading ? 'animate-spin' : ''} />
            {t('تحديث', 'Refresh')}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <BigStat icon={Users} label={t('إجمالي المستخدمين', 'Total users')} value={fmt(stats.usersTotal, lang)} hint={`${fmt(stats.admins, lang)} ${t('أدمن', 'admin')}`} />
          <BigStat icon={UserPlus} label={t('مستخدمون جدد اليوم', 'New users today')} value={fmt(stats.usersToday, lang)} hint={t('حسابات مسجلة', 'registered accounts')} />
          <BigStat icon={Eye} label={t('زوار اليوم', 'Visitors today')} value={fmt(stats.visitorsToday, lang)} hint={`${fmt(stats.visitsToday, lang)} ${t('زيارة', 'page views')}`} accent />
          <BigStat icon={TrendingUp} label={t('زوار آخر 7 أيام', 'Visitors · 7 days')} value={fmt(stats.visitorsWeek, lang)} hint={`${fmt(stats.listingsPending, lang)} ${t('إعلان بانتظار المراجعة', 'pending listings')}`} />
        </div>

        {stats.source === 'local' && (
          <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[11px] font-bold leading-5 text-amber-800 ring-1 ring-amber-200">
            {t('الأرقام من متصفح هذا الجهاز لأن قواعد التحليلات غير مرتبطة بعد. شغّل supabase/migrations/002_analytics.sql وفي Vercel أضف مفاتيح Supabase لتظهر أرقام كل الزوار.', 'These numbers come from this browser because analytics is not connected yet. Run supabase/migrations/002_analytics.sql and add the Supabase keys in Vercel to see every visitor.')}
          </p>
        )}

        <div className="mt-4 rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800">{t('الزيارات في آخر 7 أيام', 'Visits in the last 7 days')}</h3>
            <p className="text-[10px] text-slate-400">{t(`إجمالي الزيارات: ${fmt(stats.visitsTotal, lang)}`, `Total: ${fmt(stats.visitsTotal, lang)}`)}</p>
          </div>
          <div className="mt-4 flex h-28 items-end gap-2" dir="ltr">
            {(stats.weekly.length ? stats.weekly : Array.from({ length: 7 }, (_, i) => ({ day: String(i), visitors: 0, visits: 0 }))).map(d => {
              const max = Math.max(...(stats.weekly.length ? stats.weekly : []).map(x => x.visits), 1);
              const h = Math.round((d.visits / max) * 100);
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-slate-500">{d.visits || ''}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${Math.max(4, h)}%` }} title={`${d.day}: ${d.visits}`} />
                  <span className="text-[9px] text-slate-400">{d.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabs & Search */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 w-full sm:w-auto">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition whitespace-nowrap ${
                tab === s ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'pending' ? t('قيد المراجعة', 'Pending') : s === 'approved' ? t('المعتمدة', 'Approved') : t('المرفوضة', 'Rejected')} ({count(s)})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute top-3 start-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('بحث بالإعلان أو المدينة أو الرقم...', 'Search listings...')}
            className="w-full rounded-2xl border border-slate-200 bg-white ps-9 pe-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 shadow-xs"
          />
        </div>
      </div>

      {/* Listings List */}
      <div className="mt-5 space-y-4">
        {!rows.length && (
          <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-slate-200 shadow-xs">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-black text-slate-800">{t('لا توجد إعلانات في هذا التبويب', 'No listings in this tab')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('أي إعلان جديد يرفعه المستخدمون سيظهر هنا للمراجعة والاعتماد.', 'New user listings will appear here for review and approval.')}</p>
          </div>
        )}

        {rows.map(p => (
          <article key={p.id} className="grid gap-4 rounded-[28px] bg-white p-3.5 ring-1 ring-slate-200 shadow-sm md:grid-cols-[220px_1fr]">
            <PropertyImage src={p.images[0]} alt={p.title} className="h-48 rounded-[22px]" />
            <div className="flex min-w-0 flex-col justify-between p-2">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">ID: {p.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                      p.reviewStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : p.reviewStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                    }`}
                  >
                    {p.reviewStatus === 'approved' ? t('معتمد نشط', 'Approved Live') : p.reviewStatus === 'rejected' ? t('مرفوض', 'Rejected') : t('قيد المراجعة', 'Pending Review')}
                  </span>
                </div>

                <h2 className="mt-1 text-base font-black text-slate-950 line-clamp-1">{lang === 'ar' ? p.title : p.titleEn}</h2>
                <p className="text-xs text-slate-500">{p.locationArea || p.city}</p>
                <p className="mt-1.5 text-base font-black text-blue-700"><Price p={p} /></p>

                {isManaged(p) && (
                  <p className="mt-2 inline-block rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black text-blue-800">
                    {p.assignment ? t('تنازل عن عقد — تديره تينبو حصریاً', 'Assignment — Managed by AqarTenpo') : t('وساطة حصرية — تديرها تينبو', 'Brokerage — Managed by AqarTenpo')}
                  </p>
                )}

                {/* رقم المالك الحقيقي - يظهر للأدمن فقط */}
                {p.phone ? (
                  <a
                    href={`tel:+${p.phone}`}
                    dir="ltr"
                    className="mt-2 flex w-fit items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-black text-slate-900 ring-1 ring-amber-200 hover:bg-amber-100 transition"
                  >
                    <Phone size={12} className="text-amber-800" />
                    <span>+{p.phone}</span>
                    <span className="text-[9px] font-bold text-amber-800">({isManaged(p) ? t('رقم المالك الخاص — للأدمن فقط', 'Owner private number — Admin only') : t('رقم المالك', 'Owner number')})</span>
                  </a>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">{t('لا يوجد رقم هاتف مسجل', 'No phone recorded')}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => go('/property/' + p.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <Eye size={13} />
                  <span>{t('معاينة الإعلان', 'Preview')}</span>
                </button>

                {tab !== 'approved' && (
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => act(p, 'approved')}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>{t('اعتماد ونشر', 'Approve')}</span>
                  </button>
                )}

                {tab !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => act(p, 'rejected')}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    <span>{t('رفض', 'Reject')}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy === p.id}
                  onClick={() => confirm(t('هل تريد حذف الإعلان نهائياً؟', 'Permanently delete this listing?')) && act(p, 'delete')}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>{t('حذف نهائي', 'Delete')}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Viewing Leads */}
      <section className="mt-12 pt-6 border-t border-slate-200">
        <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          <span>{t('طلبات المعاينة والتواصل الواردة من المشترين', 'Incoming Viewing Leads & Requests')}</span>
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {!inquiries.length && (
            <p className="text-xs text-slate-400 p-4 bg-white rounded-2xl ring-1 ring-slate-200 col-span-2 text-center">
              {t('لا توجد طلبات معاينة واردة حتى الآن.', 'No viewing leads received yet.')}
            </p>
          )}
          {inquiries.map(i => (
            <div key={i.id} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <b className="font-bold text-slate-900">{i.name}</b>
                <span className="text-xs text-slate-400">{new Date(i.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
              </div>
              <p className="mt-1 text-xs font-mono font-bold text-blue-700" dir="ltr">
                {i.phone}
              </p>
              <p className="mt-2 text-xs text-slate-600 leading-5">{i.note || t('طلب معاينة لعقار', 'Viewing request')}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, value, label, highlight }: { icon: typeof Clock3; value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`min-w-24 rounded-2xl p-3 text-center ring-1 shadow-xs ${highlight ? 'bg-amber-50 ring-amber-300' : 'bg-white ring-slate-200'}`}>
      <Icon className={`mx-auto ${highlight ? 'text-amber-700' : 'text-blue-700'}`} size={16} />
      <p className={`mt-1 text-xl font-black ${highlight ? 'text-amber-900' : 'text-slate-900'}`}>{fmt(value, 'ar')}</p>
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function BigStat({ icon: Icon, label, value, hint, accent }: { icon: typeof Users; label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-[20px] p-3.5 ring-1 shadow-xs ${accent ? 'bg-blue-50/70 ring-blue-200' : 'bg-white ring-slate-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-slate-500">{label}</p>
        <Icon size={15} className={accent ? 'text-blue-700' : 'text-slate-400'} />
      </div>
      <p className={`mt-1.5 text-2xl font-black ${accent ? 'text-blue-800' : 'text-slate-950'}`}>{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}
