import { useEffect, useRef, useState } from 'react';
import { Building2, CalendarDays, Phone, MessageCircle, Shield, Wallet, Receipt, Clock, TrendingDown, CheckCircle2, Percent, MapPin } from 'lucide-react';
import { useApp } from '../store';
import { fmt, type Property } from '../data';
import { PropertyImage } from '../components/Common';
import { ScheduleTourModal } from '../components/Modals';
import { MortgageCalculator } from '../components/Tools';
import { lazy, Suspense } from 'react';
const PlanTour3D = lazy(() => import('../components/PlanTour3D'));
import { PLATFORM_PHONE, PLATFORM_PHONE_DISPLAY, isOwnerOf } from '../config';

const BROKER_FEE = 0.015;

export function AssignmentDetail({ p }: { p: Property }) {
  const { t, lang, recordView, recordPhoneView, user } = useApp();
  const a = p.assignment!;
  const asking = a.paidCash + (a.premium || 0);
  const savings = Math.max(0, Math.round(a.originalPrice * 1.3 - asking));
  const [tour, setTour] = useState(false);
  const [tab, setTab] = useState<'details' | '3d'>('details');
  const has3D = Boolean(p.projectDrawings?.length);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (!viewRecorded.current) {
      viewRecorded.current = true;
      if (!isOwnerOf(p, user)) recordView(p.id);
    }
  }, [p.id, p.ownerId, recordView, user]);

  const msg = encodeURIComponent(
    `${t('مرحباً، أستفسر عن فرصة التنازل عن عقد بالتقسيط', 'Hi, I am inquiring about the contract assignment')}: ${p.title} (AqarTenpo #${p.id})`
  );

  return (
    <div className="text-slate-800">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
          {t('فرصة تنازل عن عقد', 'Contract assignment')} · {a.developer}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{lang === 'ar' ? p.title : p.titleEn}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin size={15} className="text-blue-600" />
          {p.locationArea || (lang === 'ar' ? p.city : p.cityEn)} · {a.project}
        </p>
      </div>

      {/* Tab Switcher: 3D only when project drawings were uploaded */}
      {has3D && (
        <div className="mb-4 flex gap-2">
          {(['details', '3d'] as const).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-xs ${
                tab === k
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {k === 'details' ? t('الصور والبيانات', 'Photos & Details') : t('معاينة 3D من رسم المشروع', '3D from project drawing')}
            </button>
          ))}
        </div>
      )}

      {tab === 'details' || !has3D ? (
        <PropertyImage
          src={p.images[0]}
          alt={p.title}
          className="h-[300px] rounded-3xl border border-slate-200 shadow-sm md:h-[460px]"
        />
      ) : (
        <Suspense fallback={<div className="grid h-[440px] animate-pulse place-items-center rounded-3xl bg-slate-100 text-xs font-bold text-slate-400">جارٍ تحميل الجولة ثلاثية الأبعاد…</div>}><PlanTour3D plans={p.projectDrawings || []} areaM2={p.area} /></Suspense>
      )}

      {/* Exclusive Brokerage Badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-800 shadow-xs">
        <Shield size={14} className="text-blue-600" />
        <span>{t('يُدار هذا التنازل حصرياً عبر فريق وساطة عقار تينبو المعتمد', 'Managed exclusively by AqarTenpo certified brokerage')}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Main Assignment Breakdown Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-900">
              <Receipt className="text-blue-600" />
              <span>{t('تفاصيل التنازل والجدول المالي', 'Financial Breakdown & Installment Terms')}</span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <Row
                icon={<Wallet className="text-slate-500" />}
                label={t('سعر التعاقد الأصلي مع المطور', 'Original Contract Price')}
                value={`${fmt(a.originalPrice, lang)} EGP`}
              />
              <Row
                icon={<TrendingDown className="text-emerald-600" />}
                label={t('المبلغ المدفوع كاش للبائع', 'Cash Paid by Seller')}
                value={`${fmt(a.paidCash, lang)} EGP`}
                hint={`${Math.round((a.paidCash / a.originalPrice) * 100)}% ${t('من الإجمالي', 'of total')}`}
              />
              <Row
                icon={<Clock className="text-blue-600" />}
                label={t('الأقساط المتبقية مع المطور', 'Remaining Installments')}
                value={`${fmt(a.remaining, lang)} EGP`}
              />
              <Row
                icon={<CalendarDays className="text-blue-600" />}
                label={
                  a.period === 'monthly'
                    ? t('قيمة القسط الشهري', 'Monthly Installment')
                    : t('قيمة القسط الربع سنوي', 'Quarterly Installment')
                }
                value={`${fmt(a.installment, lang)} EGP`}
              />
              <Row
                icon={<Building2 className="text-purple-600" />}
                label={t('المطور والمشروع', 'Developer & Project')}
                value={a.developer}
                hint={a.project}
              />
              <Row
                icon={<CheckCircle2 className="text-emerald-600" />}
                label={t('تاريخ استلام الوحدة', 'Handover Date')}
                value={a.handover}
              />
            </div>

            {/* Highlights 3 boxes */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-center">
                <p className="text-xs font-bold text-slate-600">{t('الكاش المطلوب الآن', 'Cash Required Now')}</p>
                <p className="mt-1 text-2xl font-black text-blue-700">{fmt(asking, lang)}</p>
                {a.premium ? (
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    +{fmt(a.premium, lang)} {t('أوفر/بريميوم', 'premium')}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] font-bold text-emerald-600">{t('بدون أوفر إضافي', 'Zero premium')}</p>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                <p className="text-xs font-bold text-slate-600">{t('التوفير مقابل سعر المطور', 'Saving vs Dev')}</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">
                  {savings > 0 ? '~' + fmt(savings, lang) : '—'}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{t('مقارنة بأسعار السوق اليوم', 'vs today’s market')}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold text-slate-600">{t('عمولة الوساطة (1.5%)', 'Brokerage Fee (1.5%)')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {fmt(Math.round(asking * BROKER_FEE), lang)}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {t('تُسدد عند إتمام التنازل فقط', 'Paid upon completion')}
                </p>
              </div>
            </div>

            {/* Visual price comparison bar */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">{t('مقارنة سعر التنازل مقابل سعر المطور الحالي:', 'Assignment vs Developer Price:')}</span>
                <span className="text-emerald-700 flex items-center gap-1 font-black">
                  <Percent size={14} />
                  <span>{t('وفر ما يصل إلى 30%', 'Save up to 30%')}</span>
                </span>
              </div>
              <div className="flex h-7 overflow-hidden rounded-full border border-slate-200 bg-white">
                <div
                  className="flex items-center justify-center bg-blue-600 text-xs font-black text-white"
                  style={{ width: `${Math.min(100, Math.max(30, (asking / (a.originalPrice * 1.3)) * 100))}%` }}
                >
                  {fmt(asking, lang)} EGP
                </div>
                <div className="flex flex-1 items-center justify-end px-3 text-xs font-bold text-slate-500 bg-slate-100">
                  {fmt(Math.round(a.originalPrice * 1.3), lang)} EGP ({t('المطور', 'Dev')})
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-black text-slate-900">{t('تفاصيل الفرصة ومميزات العقار', 'Opportunity Details')}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{p.desc}</p>
          </div>

          {/* Mortgage / Financing Calculator on Cash */}
          <MortgageCalculator price={asking} />

          {/* Assignment Legal Guarantees */}
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6">
            <h3 className="flex items-center gap-2 text-base font-black text-blue-900">
              <Shield size={18} className="text-blue-600" />
              <span>{t('ضمانات الوساطة وإتمام التنازل القانوني', 'Brokerage Guarantees & Legal Safeguards')}</span>
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-xs font-semibold text-slate-700">
              <li className="flex gap-2">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>{t('فحص قانوني شامل لعقد التطوير العقاري المسجل لدى المطور الأصلي.', 'Full legal audit of developer contract and payment history.')}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>{t('التأكد التام من تسوية كافة الأقساط المستحقة قبل إتمام التنازل.', 'Verification of all due installments up to date.')}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>{t('إتمام إجراءات نقل الملكية والتنازل رسمياً داخل مقر شركة التطوير.', 'Official contract assignment inside developer headquarters.')}</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>{t('لا تُدفع عمولة الوساطة (1.5%) إلا بعد إتمام التنازل واستلام كافة المستندات.', '1.5% fee is strictly payable upon official transfer completion.')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Sticky Sidebar */}
        <aside className="space-y-3">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {t('وسيط حصري معتمد', 'Certified Broker')}
            </span>
            <h3 className="mt-1 text-lg font-black text-slate-900">{t('فريق وساطة عقار تينبو', 'AqarTenpo Brokerage Team')}</h3>
            <p className="mb-4 text-xs text-slate-500">
              {t('يتولى فريقنا إدارة المعاينة وفحص العقود والتنسيق مع المطور نيابة عنك.', 'Our certified team manages viewings, contract checks, and developer coordination.')}
            </p>

            <div className="space-y-2.5">
              {phoneVisible ? (
                <a
                  href={`tel:+${PLATFORM_PHONE}`}
                  dir="ltr"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Phone size={16} />
                  <span>{PLATFORM_PHONE_DISPLAY}</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    if (!isOwnerOf(p, user) && !user?.isAdmin) recordPhoneView(p.id);
                    setPhoneVisible(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <Phone size={16} />
                  <span>{t('عرض هاتف وسيط التنازل', 'Show broker phone')}</span>
                </button>
              )}

              <a
                href={`https://wa.me/${PLATFORM_PHONE}?text=${msg}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <MessageCircle size={16} />
                <span>{t('واتساب فريق التنازل', 'WhatsApp Broker Team')}</span>
              </a>

              <button
                onClick={() => setTour(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
              >
                <CalendarDays size={16} />
                <span>{t('احجز موعد لمعاينة الوحدة', 'Book Unit Viewing')}</span>
              </button>
            </div>

            {(user?.isAdmin || isOwnerOf(p, user)) && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200">
                <p className="text-[11px] font-black text-amber-900">
                  {user?.isAdmin ? t('رقم صاحب الوحدة — يظهر لك أنت فقط', 'Unit owner number — visible to you only') : t('رقمك — مخفي عن الزوار', 'Your number — hidden from visitors')}
                </p>
                {p.phone ? (
                  <a href={`tel:+${p.phone}`} dir="ltr" className="mt-1.5 flex items-center gap-2 text-sm font-black text-slate-900">
                    <Phone size={14} />
                    +{p.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-amber-800">{t('لم يُسجَّل رقم لهذه الوحدة.', 'No number was recorded for this unit.')}</p>
                )}
              </div>
            )}

            <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
              {t('العمولة 1.5% من قيمة التنازل عند الإتمام فقط', 'Commission is 1.5% strictly upon completion')}
            </p>
          </div>
        </aside>
      </div>

      {tour && <ScheduleTourModal id={p.id} onClose={() => setTour(false)} />}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400">{label}</p>
        <p className="truncate text-sm font-black text-slate-900">{value}</p>
        {hint && <p className="text-[11px] font-bold text-blue-600">{hint}</p>}
      </div>
    </div>
  );
}
