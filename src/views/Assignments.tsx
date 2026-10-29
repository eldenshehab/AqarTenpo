import { useMemo, useState } from 'react';
import {
  TrendingDown,
  Shield,
  Calculator,
  MapPin,
  Search,
  CheckCircle2,
  Info,
  Wallet,
  Receipt,
  Scale,
  Sparkles,
  Clock,
  Phone,
} from 'lucide-react';
import { useApp } from '../store';
import { fmt, TYPES, type Property } from '../data';
import { PropertyImage } from '../components/Common';

function Stat({
  label,
  value,
  hint,
  color = 'blue',
}: {
  label: string;
  value: string;
  hint?: string;
  color?: 'blue' | 'emerald' | 'slate';
}) {
  const styles = {
    blue: 'border-blue-200 bg-blue-50/70 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  }[color];

  return (
    <div className={`rounded-2xl border p-3.5 text-center shadow-xs ${styles}`}>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black md:text-xl">{value}</p>
      {hint && <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function AssignmentCard({ p }: { p: Property }) {
  const { lang, t, go } = useApp();
  const a = p.assignment!;
  const asking = a.paidCash + (a.premium || 0);
  const savingFromDev = a.originalPrice * 1.3 - asking;

  return (
    <div
      onClick={() => go('/property/' + p.id)}
      className="group fade-up cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10"
    >
      <div className="relative">
        <PropertyImage src={p.images[0]} alt={p.title} className="h-48" />
        <span className="absolute top-3 start-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-xs">
          {t('تنازل · وساطة حصرية', 'Assignment · Exclusive')}
        </span>
        <span className="absolute top-3 end-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
          {a.developer}
        </span>
      </div>

      <div className="p-4.5">
        <h3 className="truncate font-bold text-slate-900 group-hover:text-blue-700 transition">
          {lang === 'ar' ? p.title : p.titleEn}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={13} className="text-blue-600" />
          <span>
            {p.locationArea || (lang === 'ar' ? p.city : p.cityEn)} · {a.project}
          </span>
        </p>

        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
            <p className="text-[10px] font-bold text-slate-400">{t('كاش مطلوب', 'Cash Due')}</p>
            <p className="text-xs font-black text-blue-700">{fmt(asking, lang)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
            <p className="text-[10px] font-bold text-slate-400">{t('أقساط متبقية', 'Remaining')}</p>
            <p className="text-xs font-black text-slate-800">{fmt(a.remaining, lang)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
            <p className="text-[10px] font-bold text-slate-400">
              {a.period === 'monthly' ? t('قسط شهري', 'Monthly') : t('قسط ربع سنوي', 'Quarterly')}
            </p>
            <p className="text-xs font-black text-slate-800">{fmt(a.installment, lang)}</p>
          </div>
        </div>

        {savingFromDev > 0 && (
          <p className="mt-3 flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-xs font-bold text-emerald-700">
            <TrendingDown size={14} />
            <span>
              {t('توفير تقديري', 'Estimated Saving')} ~{fmt(Math.round(savingFromDev), lang)} {t('ج.م مقابل سعر المطور', 'EGP vs dev')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Assignments() {
  const { t, lang, listings } = useApp();
  const assignments = useMemo(() => listings.filter(p => p.assignment && p.reviewStatus !== 'pending' && p.reviewStatus !== 'rejected'), [listings]);
  const [q, setQ] = useState('');
  const [type, setType] = useState<string>('');

  const filtered = useMemo(
    () =>
      assignments.filter(
        p =>
          (!q ||
            (
              p.title +
              p.titleEn +
              p.city +
              (p.locationArea || '') +
              p.assignment!.developer +
              p.assignment!.project
            )
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!type || p.type === type)
      ),
    [assignments, q, type]
  );

  const totalCash = assignments.reduce((s, p) => s + p.assignment!.paidCash, 0);
  const totalRemain = assignments.reduce((s, p) => s + p.assignment!.remaining, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 text-slate-800">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-white to-sky-50 p-8 md:p-12 shadow-sm">
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-black text-white shadow-xs">
            <Sparkles size={14} />
            {t('قسم حصري لفرص التنازل عن العقود قيد التقسيط', 'Exclusive Installment Contract Assignment Market')}
          </span>

          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
            {t('سوق التنازل عن العقود وإعادة البيع', 'Contract Assignment Market')}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {t(
              'وحدات شُريت بالتقسيط من المطورين العقاريين ويرغب أصحابها في التنازل عنها. استفد من شراء الوحدة بسعر التعاقد القديم الأفضل مقارنة بأسعار السوق واستكمل الأقساط بنفس الشروط.',
              'Units bought on installments whose owners want to exit. Buy at the original contract price, save thousands against current market pricing, and continue installments under original developer terms.'
            )}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label={t('الفرص المتاحة', 'Available Deals')} value={String(filtered.length)} color="blue" />
            <Stat
              label={t('إجمالي الكاش المسدد', 'Total Cash Paid')}
              value={`${fmt(totalCash, lang)} EGP`}
              color="slate"
            />
            <Stat
              label={t('أقساط متبقية للتكملة', 'Installments Left')}
              value={`${fmt(totalRemain, lang)} EGP`}
              color="emerald"
            />
            <Stat
              label={t('عمولة الوساطة', 'Brokerage Fee')}
              value="1.5%"
              hint={t('عند إتمام التنازل رسمياً', 'On completion')}
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Problem & Solution Breakdown */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            I: Info,
            title: t('المشكلة الواقعية', 'The Problem'),
            text: t(
              'مالك شقة أو فيلا بالتقسيط تغيرت ظروفه المالية وأصبح غير قادر على استكمال الأقساط مع شركة التطوير، ويواجه صعوبة في إيجاد مشتري موثوق.',
              'An owner bought a property on installments, experienced changing financial circumstances, and struggles to find a qualified buyer.'
            ),
          },
          {
            I: TrendingDown,
            title: t('الحل للمشتري', 'Solution for Buyer'),
            text: t(
              'المشتري يستفيد من شراء الوحدة بسعر التعاقد القديم الأوفر بكثير من أسعار المطور الحالية، مع استكمال الأقساط بنفس الجدول المريح.',
              'The buyer purchases at the original contract price (far lower than today’s prices) and takes over the comfortable installment plan.'
            ),
          },
          {
            I: Wallet,
            title: t('الحل للبائع', 'Solution for Seller'),
            text: t(
              'يسترد البائع مقدم التعاقد والأقساط التي سددها كاش، ويخرج من التزاماته المالية بنجاح وبإجراءات قانونية موثقة ومحمية.',
              'The seller recovers their down payment and paid installments in cash, safely exiting financial commitments through verified legal transfer.'
            ),
          },
        ].map((c, i) => {
          const Ic = c.I;
          return (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Ic size={22} />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-900">{c.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">{c.text}</p>
            </div>
          );
        })}
      </div>

      {/* Brokerage & Listing Policy */}
      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
        <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
          <Shield className="text-blue-600" />
          <span>{t('سياسة الإعلانات والوساطة في عقار تينبو', 'Listing & Brokerage Policies')}</span>
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Policy 1 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
                1
              </span>
              <h3 className="font-bold text-slate-900">{t('الإعلانات الشخصية العادية', 'Standard Personal Listings')}</h3>
            </div>
            <p className="text-xs leading-5 text-slate-600">
              {t(
                'يُمكن لأي مالك عرض عقاره بنفسه على المنصة بشكل مجاني تماماً بمناسبة الافتتاح، حيث تكون المسؤولية المباشرة في التواصل وإدارة العملاء للبائع نفسه.',
                'Any owner can list their property for free. Direct communication and buyer management are handled directly by the seller.'
              )}
            </p>
            <span className="mt-3 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {t('مجاني 100%', '100% Free')}
            </span>
          </div>

          {/* Policy 2 */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                2
              </span>
              <h3 className="font-bold text-slate-900">
                {t('خدمة الوساطة الحصرية عبر عقار تينبو', 'Exclusive AqarTenpo Brokerage')}
              </h3>
            </div>
            <p className="text-xs leading-5 text-slate-600">
              {t(
                'في حال رغب البائع في تفويض المنصة لتكون هي الوسيط الرسمي (نشر الإعلان، فحص المستندات، إدارة العملاء، وتحديد المواعيد والمعاينات)، يتم تطبيق عمولة وساطة بنسبة 1.5% حصراً عند إتمام البيع والتنازل.',
                'If the seller appoints AqarTenpo as official broker, we handle listing, contract review, buyer screening and viewings for a 1.5% commission strictly upon successful closing.'
              )}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-black text-white">
                {t('عمولة', 'Fee')} 1.5%
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {t('عند إتمام التنازل فقط', 'Upon completion only')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900">
          <p className="flex items-start gap-2">
            <Scale className="shrink-0 text-blue-600 mt-0.5" size={16} />
            <span>
              <b>{t('ملاحظة أمان قانونية:', 'Legal Note:')}</b>{' '}
              {t(
                'قسم التنازل عن العقود قيد التقسيط لا يتم عرضه أو إتمامه إلا من خلال فريق "عقار تينبو" كوسيط حصري لضمان سلامة الإجراءات القانونية مع شركات التطوير العقاري.',
                'The assignment section is exclusively managed by AqarTenpo brokerage team to guarantee full legal compliance with real estate developers.'
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Step by Step Process */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-black text-slate-900">{t('آلية عمل قسم التنازل', 'How It Works')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              I: Receipt,
              title: t('عرض الوحدة والبيانات', 'List Unit Details'),
              text: t('يسجل المالك بيانات العقار (الموقع، السعر، الكاش المدفوع، والأقساط المتبقية).', 'Owner registers property details, cash paid, and remaining installments.'),
            },
            {
              I: Shield,
              title: t('فحص العقد والمستندات', 'Document Verification'),
              text: t('يتحقق فريقنا من عقد التطوير وموقف سداد الأقساط مع المطور.', 'Our team reviews the developer contract and verifies payment status.'),
            },
            {
              I: Calculator,
              title: t('المقارنة والطلب بشفافية', 'Transparent Comparison'),
              text: t('يتصفح المشترون الفرص ويقارنون الأقساط وجداول السداد بوضوح تام.', 'Buyers browse and compare installments and payment schedules transparently.'),
            },
            {
              I: CheckCircle2,
              title: t('إتمام التنازل القانوني', 'Legal Closing'),
              text: t('إتمام التنازل داخل مقر شركة التطوير مع ضمان استرداد الكاش للبائع.', 'Completion inside developer offices with secure cash recovery for the seller.'),
            },
          ].map((s, i) => {
            const Ic = s.I;
            return (
              <div key={i} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="absolute -top-2.5 start-4 grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {i + 1}
                </span>
                <Ic className="mt-2 text-blue-600" size={22} />
                <h4 className="mt-2 text-sm font-bold text-slate-900">{s.title}</h4>
                <p className="mt-1 text-xs text-slate-500 leading-5">{s.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Assignment Opportunities */}
      <div className="mt-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {t('فرص التنازل المتاحة حالياً', 'Available Assignment Opportunities')}
            </h2>
            <p className="text-xs text-slate-500">
              {filtered.length} {t('فرصة استثمارية قيد التقسيط', 'installment opportunities')}
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute top-2.5 start-3 text-slate-400" size={15} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t('ابحث بالمطور، الكومباوند، المدينة...', 'Search developer, project, city...')}
                className="w-60 rounded-full border border-slate-200 bg-white py-2 ps-9 pe-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 shadow-xs"
            >
              <option value="">{t('كل الأنواع', 'All Types')}</option>
              {TYPES.map(ty => (
                <option key={ty.id} value={ty.id}>
                  {ty[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <AssignmentCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <p>{t('لا توجد فرص تنازل مطابقة لمعايير البحث حالياً.', 'No assignment opportunities match currently.')}</p>
          </div>
        )}
      </div>

      {/* Seller Call to Action */}
      <div
        id="sell-cta"
        className="mt-14 grid items-center gap-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-white to-sky-50 p-8 shadow-sm md:grid-cols-[2fr_1fr]"
      >
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            <Clock size={14} />
            <span>{t('هل لديك عقد بالتقسيط وتريد التنازل عنه؟', 'Have an installment contract to assign?')}</span>
          </span>
          <h3 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
            {t('استرد كاشك المسدد وتخلص من عبء الأقساط', 'Recover Your Paid Cash & Exit Commitments')}
          </h3>
          <p className="mt-2 max-w-xl text-xs leading-6 text-slate-600">
            {t(
              'سجل بيانات وحدتك الآن. فريق وساطة عقار تينبو سيتواصل معك لفحص المستندات والبدء في تسويق التنازل وإتمام الإجراءات.',
              'Submit your unit details now. Our team will contact you to verify documents, market the assignment, and handle legal transfer.'
            )}
          </p>
        </div>

        <a
          href="#/sell"
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
        >
          <Phone size={16} />
          <span>{t('سجل عقارك للتنازل الآن', 'List Your Assignment Now')}</span>
        </a>
      </div>
    </div>
  );
}
