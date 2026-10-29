import { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, Copy, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../store';
import { isSupabaseConfigured, supabase, supabaseCallbackUrl, ADMIN_EMAIL } from '../lib/supabase';
import { PLATFORM_PHONE } from '../config';

type Check = { label: string; state: 'ok' | 'bad' | 'wait'; detail: string };

/* صفحة فحص حالة النظام والاتصال السحابي وإعدادات Google OAuth والمسؤول */
export default function Status() {
  const { t, user, listings } = useApp();
  const [db, setDb] = useState<Check>({ label: '', state: 'wait', detail: '' });
  const [storage, setStorage] = useState<Check>({ label: '', state: 'wait', detail: '' });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!supabase) {
      setDb({ label: 'db', state: 'bad', detail: t('لا يوجد اتصال بسيرفر Supabase (وضع المعاينة المحلي)', 'Not connected to Supabase (local mode)') });
      return;
    }
    async function checkDb() {
      try {
        const { error, count } = await supabase!
          .from('listings')
          .select('id', { count: 'exact', head: true });
        setDb(
          error
            ? { label: 'db', state: 'bad', detail: `خطأ في الاتصال: ${error.message}` }
            : { label: 'db', state: 'ok', detail: t(`متصل بنجاح · يوجد ${count ?? 0} إعلان في قاعدة البيانات`, `Connected · ${count ?? 0} listings in database`) }
        );
      } catch (err) {
        setDb({ label: 'db', state: 'bad', detail: err instanceof Error ? err.message : String(err) });
      }
    }
    checkDb();
  }, [t]);

  useEffect(() => {
    if (!supabase) {
      setStorage({ label: 'storage', state: 'bad', detail: t('Supabase غير متصل', 'Supabase is not configured') });
      return;
    }
    let alive = true;
    supabase.storage.from('property-media').list('', { limit: 1 })
      .then(({ error }) => {
        if (!alive) return;
        setStorage(error
          ? { label: 'storage', state: 'bad', detail: error.message }
          : { label: 'storage', state: 'ok', detail: t('باكت الصور موجود. إذا فشل الرفع شغّل Migration 004 وأعد تسجيل الدخول.', 'Image bucket exists. If uploads fail, run Migration 004 and sign in again.') });
      })
      .catch(error => {
        if (alive) setStorage({ label: 'storage', state: 'bad', detail: error instanceof Error ? error.message : String(error) });
      });
    return () => { alive = false; };
  }, [t]);

  const cloudListings = listings.filter(p => p.ownerId).length;
  const rows: Check[] = [
    {
      label: t('متغيرات بيئة Supabase (VITE_)', 'Supabase environment variables (VITE_)'),
      state: isSupabaseConfigured ? 'ok' : 'bad',
      detail: isSupabaseConfigured
        ? t('VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY متوفران في البناء', 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present')
        : t('غير متوفرة في البناء الحالي (الموقع يعمل بوضع الحفظ على نفس الجهاز فقط)', 'Missing in current build (running in device-only mode)'),
    },
    { label: t('قاعدة البيانات السحابية (PostgreSQL)', 'Cloud Database (PostgreSQL)'), state: db.state, detail: db.detail },
    {
      label: t('المستخدم الحالي المسجل', 'Current Signed-In User'),
      state: user ? 'ok' : isSupabaseConfigured ? 'ok' : 'bad',
      detail: user
        ? `${user.email} (${user.isAdmin ? t('حساب أدمن معتمد', 'Certified Admin') : t('مستخدم', 'User')})`
        : isSupabaseConfigured
        ? t('لا يوجد مستخدم مسجل حالياً (جاهز لتسجيل الدخول)', 'No user signed in (ready for login)')
        : t('الحسابات محلية ولا تنتقل بين الهواتف', 'Accounts are local and do not sync across devices'),
    },
    {
      label: t('تسجيل الدخول بـ Google', 'Google OAuth Sign-In'),
      state: isSupabaseConfigured ? 'ok' : 'bad',
      detail: isSupabaseConfigured
        ? t('جاهز للاستدعاء عبر signInWithOAuth({ provider: "google" })', 'Ready to trigger via signInWithOAuth')
        : t('معطل حتى إضافة مفاتيح VITE_SUPABASE_', 'Disabled until VITE_SUPABASE_ keys are added'),
    },
    {
      label: t('تخزين الصور السحابي (Supabase Storage)', 'Cloud Media Storage (Supabase Storage)'),
      state: storage.state,
      detail: storage.detail || (isSupabaseConfigured ? t('جاري فحص باكت الصور...', 'Checking image bucket...') : t('Supabase غير مهيأ', 'Supabase is not configured')),
    },
    {
      label: t('رقم تينبو للتنازل والوساطة', 'AqarTenpo Platform Phone'),
      state: PLATFORM_PHONE === '201000000000' ? 'bad' : 'ok',
      detail: PLATFORM_PHONE === '201000000000'
        ? t('الرقم الافتراضي التجريبي (+201000000000) - يفضل ضبط VITE_PLATFORM_PHONE برقمك الحقيقي', 'Default demo phone (+201000000000)')
        : `+${PLATFORM_PHONE}`,
    },
    {
      label: t('الإعلانات المحفوظة الظاهرة في هذا الجهاز', 'Listings visible on this device'),
      state: cloudListings ? 'ok' : 'ok',
      detail: `${cloudListings} ${t('إعلان مستخدم', 'user listings')}`,
    },
  ];

  const Icon = ({ s }: { s: Check['state'] }) =>
    s === 'ok' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : s === 'wait' ? <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" /> : <XCircle size={16} className="text-rose-600 shrink-0" />;

  return (
    <div className="mx-auto min-h-[70vh] max-w-3xl px-4 pb-20 pt-28 text-slate-800">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-700">{t('لوحة تشخيص الاتصال', 'System Diagnostics')}</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">{t('حالة النظام والمفاتيح السحابية', 'System Status & Cloud Setup')}</h1>

      {!isSupabaseConfigured && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-2 text-sm font-black text-amber-900">
            <CloudOff size={16} />
            {t('الموقع يعمل بوضع "هذا الجهاز فقط"', 'Site is running in Device-Only Mode')}
          </p>
          <p className="mt-2 text-xs leading-6 text-amber-900">
            {t(
              'لتفعيل المزامنة بين جميع الهواتف وحفظ الإعلانات في السحابة وتشغيل تسجيل الدخول بجوجل، أضف المتغيرات التالية في Vercel (أو ملف .env):',
              'To enable multi-device sync, cloud storage and Google Sign-In, add these variables in Vercel (or .env):'
            )}
          </p>
          <div className="mt-3 space-y-1 text-xs font-mono bg-white p-3 rounded-xl ring-1 ring-amber-300">
            <p className="text-slate-800">VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co</p>
            <p className="text-slate-800">VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY</p>
            <p className="text-slate-800">VITE_SITE_URL=https://aqar-tenpo.vercel.app</p>
            <p className="text-slate-800">VITE_ADMIN_EMAIL={ADMIN_EMAIL}</p>
          </div>
        </div>
      )}

      <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-[24px] bg-white ring-1 ring-slate-200 shadow-sm">
        {rows.map(r => (
          <div key={r.label} className="flex items-start gap-3 p-4">
            <Icon s={r.state} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">{r.label}</p>
              <p className="mt-0.5 break-words text-xs text-slate-600" dir="auto">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* الروابط والقيم المطابقة لإعداد Google Console و Supabase */}
      <div className="mt-6 rounded-[24px] bg-white p-5 ring-1 ring-slate-200 shadow-sm">
        <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
          <ShieldCheck size={18} className="text-blue-600" />
          <span>{t('روابط إعداد Google OAuth 2.0 المعتمدة', 'Google OAuth 2.0 Authorized URIs')}</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {t('انسخ هذه الروابط والصقها في Google Cloud Console داخل عميل الويب (OAuth Client ID):', 'Copy and paste these exact URIs into your Google Cloud Console OAuth Web Client:')}
        </p>

        <div className="mt-4 space-y-3">
          {[
            {
              label: t('1. مصادر جافا سكريبت المعتمدة (Authorized JavaScript origins):', '1. Authorized JavaScript origins:'),
              value: window.location.origin,
            },
            {
              label: t('2. عناوين إعادة التوجيه المعتمدة (Authorized redirect URIs في Google Console):', '2. Authorized redirect URIs (in Google Console):'),
              value: supabaseCallbackUrl || `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`,
            },
            {
              label: t('3. رابط الموقع المعتمد في Supabase (URL Configuration -> Site URL):', '3. Site URL (in Supabase URL Configuration):'),
              value: window.location.origin,
            },
            {
              label: t('4. روابط التوجيه المعتمدة في Supabase (Redirect URLs):', '4. Redirect URLs (in Supabase):'),
              value: `${window.location.origin}/**`,
            },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[11px] font-bold text-slate-600">{item.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 ring-1 ring-slate-200" dir="ltr">
                  {item.value}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(item.value);
                    setCopied(item.value);
                    setTimeout(() => setCopied(''), 2500);
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-black text-white hover:bg-blue-600 transition"
                >
                  <Copy size={12} />
                  <span>{copied === item.value ? t('تم النسخ ✓', 'Copied ✓') : t('نسخ', 'Copy')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* تفعيل صلاحية الأدمن */}
      <div className="mt-5 rounded-[24px] bg-slate-900 p-5 text-white shadow-md">
        <h2 className="text-sm font-black flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span>{t('تفعيل حساب الأدمن الكامل (Admin Role)', 'Activate Full Admin Role')}</span>
        </h2>
        <p className="mt-1 text-xs text-slate-300 leading-5">
          {t(
            `حساب الأدمن المعتمد هو ${ADMIN_EMAIL}. بعد تسجيل الدخول بهذا الحساب شغّل migrations/004_admin_and_storage.sql مرة واحدة في Supabase SQL Editor، ثم سجّل الخروج والدخول.`,
            `The configured admin account is ${ADMIN_EMAIL}. After signing in with it, run migrations/004_admin_and_storage.sql once in the Supabase SQL Editor, then sign out and back in.`
          )}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-slate-950 p-2.5 text-xs font-mono text-emerald-300 ring-1 ring-white/10" dir="ltr">
            {`UPDATE public.profiles SET role = 'admin' WHERE email = '${user?.email || ADMIN_EMAIL}';`}
          </code>
          <button
            type="button"
            onClick={() => {
              const cmd = `UPDATE public.profiles SET role = 'admin' WHERE email = '${user?.email || ADMIN_EMAIL}';`;
              navigator.clipboard?.writeText(cmd);
              setCopied(cmd);
              setTimeout(() => setCopied(''), 2500);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white hover:bg-emerald-500 transition"
          >
            <Copy size={12} />
            <span>{copied.startsWith('UPDATE') ? t('تم النسخ ✓', 'Copied ✓') : t('نسخ الأمر', 'Copy SQL')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
