import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Heart,
  BedDouble,
  Bath,
  Maximize,
  CalendarDays,
  SlidersHorizontal,
  ShieldCheck,
  Box,
  Globe2,
  ArrowRight,
  TrendingDown,
  Layers,
  Search,
  RotateCcw,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../store';
import { PLATFORM_PHONE, PLATFORM_PHONE_DISPLAY, isManaged, isOwnerOf } from '../config';
import { fmt, type Property } from '../data';
import { TAXONOMY, currencyOf, listingCategory, listingSubtype } from '../catalog';
import { TrustBadges, ReportButton } from '../components/TrustBar';
import { VirtualTour } from '../components/Tour360';
import { saveCurrentSearch } from './Platform';
import { ALL_LOCATIONS, matchesLocation, norm } from '../locations';
import { PropertyCard, PropertyImage, Price } from '../components/Common';
import { BrandMark } from '../components/BrandMark';
import { MortgageCalculator, RoiCalculator } from '../components/Tools';
import { ScheduleTourModal } from '../components/Modals';
import { lazy, Suspense } from 'react';
const PlanTour3D = lazy(() => import('../components/PlanTour3D'));
import { DEMO_PLANS } from '../lib/demoPlans';
import {
  MainSearchBar,
  MultiLocationSearch,
  AdvancedFilterDrawer,
  type FilterState,
  initialFilterState,
} from '../components/SearchFilter';

/* ---------- URL <-> filter helpers ---------- */
function parseFilters(route: string): FilterState {
  const p = new URLSearchParams(route.split('?')[1] || '');
  const list = (k: string) => (p.get(k) || '').split('||').filter(Boolean);
  return {
    ...initialFilterState,
    locations: list('locs'),
    deal: (p.get('deal') as FilterState['deal']) || '',
    type: (p.get('type') as FilterState['type']) || '',
    maxPrice: +(p.get('maxPrice') || 0),
    furnishing: p.get('furnishing') || 'all',
    status: p.get('status') || 'all',
    floorLevel: p.get('floor') || 'all',
    minArea: +(p.get('minArea') || 0),
    maxArea: +(p.get('maxArea') || 0),
    minPricePerMeter: +(p.get('minPpm') || 0),
    maxPricePerMeter: +(p.get('maxPpm') || 0),
    amenities: list('am'),
    keywords: p.get('kw') || '',
  };
}

function buildQuery(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.deal) p.set('deal', f.deal);
  if (f.type) p.set('type', f.type);
  if (f.locations.length) p.set('locs', f.locations.join('||'));
  if (f.maxPrice) p.set('maxPrice', String(f.maxPrice));
  if (f.keywords) p.set('kw', f.keywords);
  if (f.furnishing !== 'all') p.set('furnishing', f.furnishing);
  if (f.status !== 'all') p.set('status', f.status);
  if (f.floorLevel !== 'all') p.set('floor', f.floorLevel);
  if (f.minArea) p.set('minArea', String(f.minArea));
  if (f.maxArea) p.set('maxArea', String(f.maxArea));
  if (f.minPricePerMeter) p.set('minPpm', String(f.minPricePerMeter));
  if (f.maxPricePerMeter) p.set('maxPpm', String(f.maxPricePerMeter));
  if (f.amenities.length) p.set('am', f.amenities.join('||'));
  return p.toString();
}

function activeAdvanced(f: FilterState): number {
  return (
    (f.furnishing !== 'all' ? 1 : 0) +
    (f.status !== 'all' ? 1 : 0) +
    (f.floorLevel !== 'all' ? 1 : 0) +
    (f.minArea || f.maxArea ? 1 : 0) +
    (f.minPricePerMeter || f.maxPricePerMeter ? 1 : 0) +
    f.amenities.length +
    (f.keywords ? 1 : 0)
  );
}

function filterListings(list: Property[], f: FilterState): Property[] {
  return list.filter(p => {
    if (f.locations.length && !f.locations.some(l => matchesLocation(p, l))) return false;
    if (f.deal && p.deal !== f.deal) return false;
    if (f.type && p.type !== f.type) return false;
    if (f.maxPrice && p.price > f.maxPrice) return false;
    if (f.minPrice && p.price < f.minPrice) return false;
    if (f.minArea && p.area < f.minArea) return false;
    if (f.maxArea && p.area > f.maxArea) return false;
    const ppm = p.pricePerMeter || (p.area ? Math.round(p.price / p.area) : 0);
    if (f.minPricePerMeter && ppm < f.minPricePerMeter) return false;
    if (f.maxPricePerMeter && ppm > f.maxPricePerMeter) return false;
    if (f.furnishing !== 'all' && p.furnishing && p.furnishing !== f.furnishing) return false;
    if (f.status !== 'all' && p.status && p.status !== f.status) return false;
    if (f.floorLevel !== 'all' && p.floorLevel && p.floorLevel !== f.floorLevel) return false;
    if (f.amenities.length && !f.amenities.every(a => (p.amenities || []).includes(a))) return false;
    if (f.keywords) {
      const text = norm(`${p.title} ${p.titleEn} ${p.desc} ${(p.keywords || []).join(' ')}`);
      if (!f.keywords.split(/\s+/).filter(Boolean).every(w => text.includes(norm(w)))) return false;
    }
    return true;
  });
}

function sortListings(list: Property[], sort: string): Property[] {
  const a = [...list];
  if (sort === 'low') return a.sort((x, y) => x.price - y.price);
  if (sort === 'high') return a.sort((x, y) => y.price - x.price);
  if (sort === 'area') return a.sort((x, y) => y.area - x.area);
  if (sort === 'ppm') return a.sort((x, y) => (x.pricePerMeter || 0) - (y.pricePerMeter || 0));
  return a;
}

function SectionHead({ no, kicker, title, action, onAction }: { no: string; kicker: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <p className="text-xs font-extrabold tracking-[0.2em] text-blue-600">
          {no} — {kicker}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:border-blue-400">
          {action}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </button>
      )}
    </div>
  );
}

/* ---------- HOME ---------- */
export function Home() {
  const { t, go, listings, lang } = useApp();
  const [filter, setFilter] = useState<FilterState>(initialFilterState);
  const handleSearch = () => go(`/browse?${buildQuery(filter)}`);

  const asg = listings.find(p => p.assignment);
  const govs = ALL_LOCATIONS.filter(l => l.kind === 'gov');
  const photos = listings.slice(0, 4).map(p => p.images[0]);

  return (
    <>
      {/* HERO */}
      <section className="home-hero relative overflow-hidden pt-32 pb-16 md:pt-40">
        <div className="dot-grid absolute inset-0 opacity-70" />
        <div className="absolute -start-32 -top-32 h-96 w-96 rounded-full bg-blue-200/60 blur-3xl" />
        <div className="absolute end-0 top-40 h-80 w-80 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="hero-signature rise mb-6 flex items-center gap-4" style={{ animationDelay: '.04s' }}>
              <BrandMark size={76} className="shrink-0" />
              <div>
                <p className="brand-wordmark text-2xl font-extrabold uppercase tracking-[.22em] md:text-3xl">AQAR TENPO</p>
                <div className="mt-2 flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[.34em] text-slate-400 md:text-[10px]">
                  <span className="h-px w-7 bg-slate-500" />
                  <span>BUY</span><span>•</span><span>SELL</span><span>•</span><span>INVEST</span>
                  <span className="h-px w-7 bg-slate-500" />
                </div>
              </div>
            </div>
            <span className="rise inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('منصة عقارية رقمية · كل المحافظات والخليج', 'Digital real estate · All governorates & the Gulf')}
            </span>
            <h1 className="rise mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-7xl">
              {t('بيتك القادم', 'Your next home')}
              <br />
              <span className="text-blue-600">{t('بوضوح تام.', 'made clear.')}</span>
            </h1>
            <p className="rise mt-6 max-w-xl text-base leading-7 text-slate-600">
              {t(
                'ابحث في أي محافظة أو مدينة أو حي، قارن الأسعار، وشاهد العقار بجولة ثلاثية الأبعاد قبل أن تزوره.',
                'Search any governorate, city or district, compare prices, and walk through a 3D model before you visit.'
              )}
            </p>

            <div className="rise mt-8">
              <MainSearchBar filter={filter} setFilter={setFilter} onSearch={handleSearch} />
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                {t('27 محافظة مغطاة', '27 governorates covered')}
              </span>
              <span className="flex items-center gap-2">
                <Box size={16} className="text-blue-600" />
                {t('جولات 3D ومخططات', '3D tours & plans')}
              </span>
              <span className="flex items-center gap-2">
                <TrendingDown size={16} className="text-blue-600" />
                {t('سوق التنازل عن العقود', 'Contract assignments')}
              </span>
            </div>
          </div>

          {/* Collage */}
          <div className="relative hidden h-[580px] lg:block">
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-6 gap-3">
              <div className="col-start-1 col-end-4 row-start-1 row-end-5 overflow-hidden rounded-[32px]">
                <PropertyImage src={photos[0]} alt="" className="h-full w-full" />
              </div>
              <div className="col-start-4 col-end-6 row-start-1 row-end-4 overflow-hidden rounded-[28px]">
                <PropertyImage src={photos[1]} alt="" className="h-full w-full" />
              </div>
              <div className="col-start-4 col-end-6 row-start-4 row-end-7 overflow-hidden rounded-[28px]">
                <PropertyImage src={photos[2]} alt="" className="h-full w-full" />
              </div>
              <div className="col-start-1 col-end-4 row-start-5 row-end-7 overflow-hidden rounded-[28px]">
                <PropertyImage src={photos[3]} alt="" className="h-full w-full" />
              </div>
            </div>

            <div className="floaty absolute -start-8 bottom-12 rounded-2xl bg-white/95 p-4 shadow-[0_20px_40px_-18px_rgba(15,23,42,.4)] ring-1 ring-slate-200 backdrop-blur">
              <p className="text-[11px] font-bold text-slate-500">{t('عقارات متاحة الآن', 'Live listings')}</p>
              <p className="text-2xl font-black text-slate-950">{listings.length}</p>
            </div>
            <div className="floaty absolute -end-4 top-10 flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 pe-5 shadow-[0_20px_40px_-18px_rgba(15,23,42,.4)] ring-1 ring-slate-200 backdrop-blur" style={{ animationDelay: '1.5s' }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <Box size={18} />
              </span>
              <div>
                <p className="text-xs font-extrabold text-slate-950">{t('معاينة 3D', '3D preview')}</p>
                <p className="text-[11px] text-slate-500">{t('مجسم داخلي وخارجي', 'Exterior & cutaway')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap text-xs font-extrabold uppercase tracking-[0.25em] text-slate-400">
          {[...govs, ...govs].map((l, i) => (
            <span key={i} className="flex items-center gap-10">
              {lang === 'ar' ? l.nameAr : l.nameEn}
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
          ))}
        </div>
      </div>

      {/* 01 TYPES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionHead no="01" kicker={t('التصنيف', 'Classification')} title={t('تصنيف عقار تينبو', 'AqarTenpo categories')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TAXONOMY.map((c, i) => (
            <button key={c.id} onClick={() => go('/browse?cat=' + c.id)} className="rise rounded-[26px] bg-white p-5 text-start ring-1 ring-slate-200 transition hover:-translate-y-1 hover:ring-blue-300" style={{ animationDelay: `${i * 0.04}s` }}>
              <p className="text-lg font-black text-slate-950">{c[lang]}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{c.items.map(s => s[lang]).join(' · ')}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 02 FEATURED */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <SectionHead no="02" kicker={t('أحدث الإضافات', 'Latest')} title={t('عقارات مختارة لك', 'Hand-picked for you')} action={t('عرض الكل', 'View all')} onAction={() => go('/browse')} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings
            .filter(p => !p.assignment)
            .slice(0, 6)
            .map((p, i) => (
              <PropertyCard key={p.id} p={p} className={i === 0 ? 'lg:col-span-2' : ''} />
            ))}
        </div>
      </section>

      {/* 03 ASSIGNMENT */}
      {asg && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="grid overflow-hidden rounded-[36px] bg-white ring-1 ring-slate-200 md:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="text-xs font-extrabold tracking-[0.2em] text-blue-600">03 — {t('سوق التنازل', 'Assignments')}</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {t('اشترِ بسعر التعاقد القديم', 'Buy at the original contract price')}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {t(
                  'وحدات شُريت بالتقسيط ويرغب أصحابها في التنازل. تكمل الأقساط بنفس الشروط الأصلية، والبائع يسترد كاشه. الوساطة حصرية عبر عقار تينبو بعمولة 1.5% عند الإتمام.',
                  'Units bought on installments whose owners want out. You continue the original terms and the seller recovers their cash. Exclusive AqarTenpo brokerage, 1.5% on completion.'
                )}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] font-bold text-slate-500">{t('توفير تقديري', 'Estimated saving')}</p>
                  <p className="text-2xl font-black text-emerald-600">30%+</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] font-bold text-slate-500">{t('عمولة الوساطة', 'Brokerage fee')}</p>
                  <p className="text-2xl font-black text-slate-950">1.5%</p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => go('/assignments')} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600">
                  {t('تصفح فرص التنازل', 'Browse assignments')}
                  <ArrowRight size={16} className="rtl:rotate-180" />
                </button>
                <button onClick={() => go('/sell')} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 hover:border-blue-400">
                  {t('اعرض وحدتك', 'List yours')}
                </button>
              </div>
            </div>
            <div className="relative min-h-72">
              <img src={asg.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute bottom-5 start-5 end-5 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-950">{lang === 'ar' ? asg.title : asg.titleEn}</p>
                  <p className="text-xs text-slate-500">{asg.assignment?.developer}</p>
                </div>
                <p className="shrink-0 text-sm font-black text-blue-700">
                  {fmt(asg.assignment?.paidCash ?? 0, lang)} {t('ج.م كاش', 'EGP cash')}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 04 HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <SectionHead no="04" kicker={t('كيف تعمل', 'How it works')} title={t('ثلاث خطوات للعقار المناسب', 'Three steps to the right property')} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: '01', title: t('حدد المكان', 'Pick the location'), text: t('اكتب أول حروف المحافظة أو الحي واختر أكثر من مكان في نفس الوقت.', 'Type the first letters of a governorate or area and select several places at once.') },
            { n: '02', title: t('قارن واختر', 'Compare & choose'), text: t('فلتر بالسعر والمساحة والفرش والمزايا، ثم قارن حتى 3 عقارات جنباً إلى جنب.', 'Filter by price, area, furnishing and amenities, then compare up to three properties side by side.') },
            { n: '03', title: t('عاين بالـ 3D', 'Preview in 3D'), text: t('شاهد المجسم الخارجي والمخطط الداخلي قبل الزيارة، ثم احجز معاينتك.', 'View the exterior model and cutaway plan before visiting, then book your viewing.') },
          ].map(s => (
            <div key={s.n} className="rounded-[26px] bg-white p-7 ring-1 ring-slate-200">
              <p className="text-4xl font-black text-slate-200">{s.n}</p>
              <h3 className="mt-4 text-lg font-black text-slate-950">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 05 3D */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 lg:grid-cols-2">
        <div>
          <p className="text-xs font-extrabold tracking-[0.2em] text-blue-600">05 — {t('تقنية 3D', '3D technology')}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t('معاينة ثلاثية الأبعاد ومخططات مجسمة', '3D previews & cutaway plans')}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {t(
              'عند رفع مخطط الوحدة، يستخرج الموقع الجدران من خطوط الرسم ويبني منها مجسماً حقيقياً تدور حوله أو تمشي داخله وتتفاعل مع الجدران. الأبواب تظهر كفتحات، والمقياس تقريبي. الإعلان بدون مخطط لا تظهر له جولة. جرّب مخططك بنفسك.',
              'When a unit plan is uploaded, the site extracts walls from the drawing lines and builds a real model you can orbit or walk through, with walls blocking you. Doors appear as openings and scale is approximate. Listings without a plan get no tour. Try your own plan.'
            )}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              [Box, t('مجسمات تفاعلية', 'Interactive models')],
              [Layers, t('مخططات مجسمة', 'Cutaway plans')],
              [ShieldCheck, t('بيانات موثوقة', 'Verified data')],
              [Globe2, t('متاح للمستثمرين بالخارج', 'Open to overseas investors')],
            ].map(([I, l], i) => {
              const Ic = I as LucideIcon;
              return (
                <div key={i} className="flex items-center gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-slate-200">
                  <Ic size={16} className="shrink-0 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">{l as string}</span>
                </div>
              );
            })}
          </div>
        </div>
        <DeferredTour plans={DEMO_PLANS.apartment} areaM2={150} />
      </section>
    </>
  );
}

function TourSkeleton() {
  return <div className="grid h-[440px] w-full animate-pulse place-items-center rounded-[28px] bg-slate-100 text-xs font-bold text-slate-400">جارٍ تجهيز الجولة ثلاثية الأبعاد…</div>;
}

/* الصفحة الرئيسية لا تحمّل محرك three.js إلا عند اقتراب المستخدم من القسم، فيبقى أول تحميل خفيفًا. */
function DeferredTour({ plans, areaM2 }: { plans: string[]; areaM2?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === 'undefined') { setShow(true); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setShow(true); io.disconnect(); }
    }, { rootMargin: '250px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref}>
      {show
        ? <Suspense fallback={<TourSkeleton />}><PlanTour3D plans={plans} areaM2={areaM2} allowUpload /></Suspense>
        : <TourSkeleton />}
    </div>
  );
}

/* ---------- BROWSE ---------- */
function Seg({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
      {options.map(([v, l]) => (
        <button
          key={v || 'all'}
          onClick={() => onChange(v)}
          className={`rounded-xl px-2 py-2 text-xs font-bold transition ${value === v ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Browse() {
  const { t, lang, listings, route, user, setAuthOpen } = useApp();
  const [filter, setFilter] = useState<FilterState>(() => parseFilters(route));
  const [sort, setSort] = useState('new');
  const [drawer, setDrawer] = useState(false);
  const params = new URLSearchParams(route.split('?')[1] || '');
  const [cat, setCat] = useState(params.get('cat') || '');
  const [sub, setSub] = useState(params.get('sub') || '');
  const [savedNote, setSavedNote] = useState('');

  const set = (patch: Partial<FilterState>) => setFilter(prev => ({ ...prev, ...patch }));
  const visible = listings.filter(p => {
    if (p.reviewStatus === 'approved') return true;
    if (user && (isOwnerOf(p, user) || user.isAdmin)) return true;
    return false;
  });
  const items = useMemo(() => filterListings(visible, filter).filter(p => (!cat || p.category === cat) && (!sub || p.subtype === sub)), [visible, filter, cat, sub]);
  const sorted = useMemo(() => sortListings(items, sort), [items, sort]);
  const adv = activeAdvanced(filter);
  const hasAny = filter.locations.length > 0 || !!filter.deal || !!filter.type || filter.maxPrice > 0 || adv > 0;

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-6 rounded-[28px] bg-white p-5 ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950">{t('الفلترة السريعة', 'Quick filters')}</h3>
              {hasAny && (
                <button onClick={() => setFilter(initialFilterState)} className="flex items-center gap-1 text-xs font-bold text-rose-500">
                  <RotateCcw size={12} />
                  {t('مسح', 'Clear')}
                </button>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('الغرض', 'Purpose')}</p>
              <Seg
                value={filter.deal}
                options={[
                  ['', t('الكل', 'All')],
                  ['sale', t('شراء', 'Buy')],
                  ['rent', t('إيجار', 'Rent')],
                ]}
                onChange={v => set({ deal: v as FilterState['deal'] })}
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('تصنيف عقار تينبو', 'AqarTenpo categories')}</p>
              <div className="mb-3 flex flex-wrap gap-1">{[{ id: '', ar: 'الكل', en: 'All' }, ...TAXONOMY].map(c => <button key={c.id || 'all'} onClick={() => { setCat(c.id); setSub(''); }} className={`rounded-full px-2.5 py-1 text-[10px] font-black ${cat === c.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>{c[lang]}</button>)}</div>
              {!!cat && <div className="mb-3 flex flex-wrap gap-1">{TAXONOMY.find(c => c.id === cat)?.items.map(s => <button key={s.id} onClick={() => setSub(sub === s.id ? '' : s.id)} className={`rounded-full px-2 py-1 text-[10px] font-bold ${sub === s.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{s[lang]}</button>)}</div>}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{t('أقصى سعر', 'Max price')}</p>
              <select
                value={filter.maxPrice}
                onChange={e => set({ maxPrice: +e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              >
                <option value={0}>{t('أي سعر', 'Any price')}</option>
                {[1000000, 3000000, 5000000, 10000000, 20000000, 50000000].map(v => (
                  <option key={v} value={v}>
                    ≤ {fmt(v, lang)} {t('بعملة الإعلان', 'listing currency')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDrawer(true)}
                className="flex flex-1 items-center justify-between rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  {t('المزيد من خيارات البحث', 'More search options')}
                </span>
                {adv > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs text-blue-700">{adv}</span>}
              </button>
              <button
                onClick={() => document.getElementById('browse-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                <Search size={16} />
                {t('بحث', 'Search')}
              </button>
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <div id="browse-results" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">{t('نتائج البحث', 'Results')}</p>
              <button onClick={() => { if (!user) return setAuthOpen('login'); saveCurrentSearch(user.id, filter.locations.join(' + ') || t('بحث محفوظ', 'Saved search'), { locations: filter.locations, category: cat, subtype: sub, maxPrice: filter.maxPrice, minArea: filter.minArea, deal: filter.deal, status: filter.status }); setSavedNote(t('تم حفظ البحث. سنظهر المطابق الجديد في التنبيهات.', 'Search saved. New matches will appear in alerts.')); }} className="mt-1 text-xs font-bold text-blue-700">{t('احفظ هذا البحث', 'Save this search')}</button>
              {savedNote && <p className="text-[11px] text-emerald-700">{savedNote}</p>}
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                {sorted.length} <span className="text-base font-bold text-slate-400">{t('عقار', 'properties')}</span>
              </h1>
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
            >
              <option value="new">{t('الأحدث', 'Newest')}</option>
              <option value="low">{t('السعر: الأقل أولاً', 'Price: low to high')}</option>
              <option value="high">{t('السعر: الأعلى أولاً', 'Price: high to low')}</option>
              <option value="area">{t('الأكبر مساحة', 'Largest area')}</option>
              <option value="ppm">{t('أقل سعر للمتر', 'Lowest price / m²')}</option>
            </select>
          </div>

          <div className="mb-6">
            <MultiLocationSearch selected={filter.locations} onChange={locs => set({ locations: locs })} />
            {filter.locations.length > 0 && (
              <p className="mt-2 text-[11px] font-semibold text-slate-500">
                {t('نتائج أي من المواقع:', 'Matches any of:')} {filter.locations.join(' + ')}
              </p>
            )}
          </div>

          {sorted.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {sorted.map(p => (
                <PropertyCard key={p.id} p={p} onHover={undefined} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-white p-12 text-center ring-1 ring-slate-200">
              <Zap className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-3 text-lg font-black text-slate-950">{t('لا توجد نتائج مطابقة', 'No matching results')}</h3>
              <p className="mt-1 text-xs text-slate-500">{t('جرب موقعاً آخر أو امسح بعض الفلاتر.', 'Try another location or clear some filters.')}</p>
              <button onClick={() => setFilter(initialFilterState)} className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600">
                {t('إعادة ضبط الفلاتر', 'Reset filters')}
              </button>
            </div>
          )}
        </div>

      </div>
      <AdvancedFilterDrawer filter={filter} setFilter={setFilter} isOpen={drawer} onClose={() => setDrawer(false)} totalResults={sorted.length} />
    </div>
  );
}

/* ---------- DETAIL ---------- */
export function PropertyDetail({ id }: { id: string }) {
  const { t, lang, listings, favs, toggleFav, go, recordView, recordPhoneView, user } = useApp();
  const p = listings.find(x => x.id === id);
  const [phoneShown, setPhoneShown] = useState(false);
  const [img, setImg] = useState(0);
  const [tour, setTour] = useState(false);
  const [tab, setTab] = useState<'photos' | '3d'>('photos');
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (p && !viewRecorded.current) {
      viewRecorded.current = true;
      if (!isOwnerOf(p, user)) recordView(p.id);
    }
  }, [p, recordView, user]);

  if (p && (p.reviewStatus === 'pending' || p.reviewStatus === 'rejected') && !isOwnerOf(p, user) && !user?.isAdmin)
    return <div className="pt-40 text-center text-slate-800"><p className="text-xl font-bold">{t('هذا الإعلان ما زال قيد المراجعة', 'This listing is still under review')}</p></div>;
  if (!p)
    return (
      <div className="pt-40 text-center text-slate-800">
        <p className="text-xl font-bold">{t('العقار غير موجود', 'Property not found')}</p>
        <button onClick={() => go('/browse')} className="mt-4 text-sm font-bold text-blue-600">
          ← {t('العودة للتصفح', 'Back to browse')}
        </button>
      </div>
    );

  const isOwner = isOwnerOf(p, user);
  const isAdmin = Boolean(user?.isAdmin);
  const managed = isManaged(p);
  const waText = encodeURIComponent(`${t('مرحباً، أستفسر عن العقار', 'Hi, I am interested in')}: ${p.title} (AqarTenpo #${p.id})`);
  const contactPhone = managed ? PLATFORM_PHONE : p.phone;
  const similar = listings.filter(x => x.type === p.type && x.id !== p.id && !x.assignment).slice(0, 3);
  const loc = p.locationArea || (lang === 'ar' ? p.city : p.cityEn);
  const projectDrawings = p.projectDrawings || [];
  const has3D = projectDrawings.length > 0;
  const specs: [LucideIcon, string, string | number][] = [
    [BedDouble, t('غرف النوم', 'Bedrooms'), p.beds || '—'],
    [Bath, t('الحمامات', 'Bathrooms'), p.baths || '—'],
    [Maximize, t('المساحة', 'Area'), `${fmt(p.area, lang)} م²`],
    [CalendarDays, t('السنة', 'Year'), p.year],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 text-slate-800">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => go('/browse')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
          <ArrowRight size={16} className="rtl:rotate-180" />
          {t('العودة للبحث', 'Back to search')}
        </button>
        {has3D ? (
          <div className="flex rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(['photos', '3d'] as const).map(k => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === k ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
              >
                {k === 'photos' ? t('الصور', 'Photos') : t('جولة 3D من رسم المشروع', '3D from project drawing')}
              </button>
            ))}
          </div>
        ) : (
          <span className="rounded-full bg-white px-3 py-2 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200" title={t('تُفعّل الجولة 3D عند رفع رسومات المشروع', '3D is enabled once project drawings are uploaded')}>
            {t('لا تتوفر جولة 3D — لم تُرفع رسومات المشروع', 'No 3D tour — project drawings not uploaded')}
          </span>
        )}
      </div>

      {tab === 'photos' || !has3D ? (
        <div>
          <PropertyImage key={img} src={p.images[img] || p.images[0]} alt={p.title} className="fade-in h-[340px] w-full rounded-[32px] ring-1 ring-slate-200 md:h-[500px]" />
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {p.images.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setImg(i)}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl transition ${i === img ? 'ring-2 ring-blue-600' : 'opacity-60 hover:opacity-100'}`}
                >
                  <img src={s} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Suspense fallback={<TourSkeleton />}><PlanTour3D plans={projectDrawings} areaM2={p.area} /></Suspense>
          <div className="flex flex-wrap items-center gap-2">
            {projectDrawings.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                <img src={src} alt={t('رسم المشروع', 'Project drawing')} className="h-24 w-36 object-cover" />
              </a>
            ))}
            <p className="max-w-md text-[11px] font-semibold text-slate-500">
              {t('المجسم مبني على رسومات المشروع المرفوعة من صاحب الإعلان. الرفع يدعم الصور والمخططات المسطحة؛ ملفات BIM الكاملة غير مدعومة بعد.', 'The model is based on project drawings uploaded by the lister. Images and flat floor plans are supported; full BIM files are not supported yet.')}
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-6">
            <div className="text-3xl font-black text-slate-950">
              <Price p={p} />
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{lang === 'ar' ? p.title : p.titleEn}</h1>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={15} className="text-blue-600" />
                {loc}
              </p>
              <button onClick={() => toggleFav(p.id)} className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-slate-200 hover:ring-rose-300" title={t('المفضلة', 'Save')}>
                <Heart size={18} className={favs.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map(([Ic, l, v], i) => (
              <div key={i} className="rounded-[22px] bg-white p-4 ring-1 ring-slate-200">
                <Ic size={18} className="text-blue-600" />
                <p className="mt-3 text-[11px] font-bold text-slate-400">{l}</p>
                <p className="text-base font-black text-slate-950">{v}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <TrustBadges p={p} />
            <p className="text-[11px] font-bold text-slate-500">{t('آخر تحديث', 'Last updated')}: {new Date(p.updatedAt || Date.now()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</p>
          </div>
          <div className="rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
            <h2 className="mb-2 text-base font-black text-slate-950">{t('الوصف', 'Description')}</h2>
            <p className="text-sm leading-7 text-slate-600">{p.desc}</p>
            <p className="mt-3 text-xs font-bold text-slate-500">{listingCategory(p)[lang]} · {listingSubtype(p)[lang]} · {currencyOf(p)[lang]}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ReportButton id={p.id} />
              {has3D && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">3D · {projectDrawings.length} {t('رسم مشروع', 'project drawings')}</span>}
            </div>
            {p.amenities && p.amenities.length > 0 && (
              <p className="mt-4 text-xs font-semibold text-slate-500">
                {t('المزايا: ', 'Features: ')} {p.amenities.length} {t('ميزة مدرجة', 'listed')}
              </p>
            )}
          </div>

          <VirtualTour p={p} onBook={() => setTour(true)} />
          <div className="grid gap-4 md:grid-cols-2">
            <MortgageCalculator price={p.price} />
            <RoiCalculator price={p.price} rent={p.rent} />
          </div>
        </div>

        <aside>
          <div className="sticky top-28 rounded-[28px] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,.35)] ring-1 ring-slate-200">
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">{managed ? t('إعلان تديره تينبو', 'Managed by AqarTenpo') : t('التواصل', 'Contact')}</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{managed ? t('تواصل مع فريق عقار تينبو', 'Contact the AqarTenpo team') : t('تواصل مع صاحب العقار', 'Contact the owner')}</h3>
            <p className="mb-5 mt-1 text-xs leading-5 text-slate-500">
              {managed
                ? t('فريق تينبو هو الوسيط المعتمد لهذا العقار: يتواصل معك، ويرتّب المعاينة، ويتابع الإجراءات حتى الإتمام.', 'The AqarTenpo team is the broker for this property: it contacts you, arranges the viewing and follows the process to completion.')
                : t('الرد خلال ساعات العمل', 'Replies during business hours')}
            </p>
            <div className="space-y-2.5">
              {phoneShown || isOwner || isAdmin ? (
                <a href={`tel:+${contactPhone}`} dir="ltr" className="flex items-center justify-center gap-2 rounded-full bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-800">
                  <Phone size={16} />
                  {contactPhone ? `+${contactPhone}` : t('الرقم غير متاح', 'Number unavailable')}
                </a>
              ) : (
                <button
                  onClick={() => { setPhoneShown(true); recordPhoneView(p.id); }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  <Phone size={16} />
                  {t('عرض رقم الهاتف', 'Show phone number')}
                </button>
              )}
              {contactPhone && (
                <a
                  onClick={() => { if (!isOwner && !isAdmin) recordPhoneView(p.id); }}
                  href={`https://wa.me/${contactPhone}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <MessageCircle size={16} />
                  {t('واتساب', 'WhatsApp')}
                </a>
              )}
              {!isOwner && (
                <button onClick={() => setTour(true)} className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-3 text-sm font-bold text-slate-900 hover:border-blue-500">
                  <Calendar size={16} />
                  {t('احجز موعد معاينة', 'Book a viewing')}
                </button>
              )}
            </div>

            {managed && (isAdmin || isOwner) && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200">
                <p className="text-[11px] font-black text-amber-900">
                  {isAdmin ? t('رقم مالك العقار — يظهر لك أنت فقط', 'Owner number — visible to you only') : t('رقمك — مخفي عن الزوار', 'Your number — hidden from visitors')}
                </p>
                {p.phone ? (
                  <a href={`tel:+${p.phone}`} dir="ltr" className="mt-1.5 flex items-center gap-2 text-sm font-black text-slate-900">
                    <Phone size={14} />
                    +{p.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-amber-800">{t('لم يُسجَّل رقم لهذا الإعلان.', 'No number was recorded for this listing.')}</p>
                )}
              </div>
            )}
            {managed && !isAdmin && !isOwner && (
              <p className="mt-4 text-center text-[11px] font-semibold text-slate-400" dir="ltr">AqarTenpo · {PLATFORM_PHONE_DISPLAY}</p>
            )}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <SectionHead no="→" kicker={t('مشابهة', 'Similar')} title={t('عقارات قد تعجبك', 'You may also like')} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map(s => (
              <PropertyCard key={s.id} p={s} />
            ))}
          </div>
        </div>
      )}

      {tour && <ScheduleTourModal id={p.id} onClose={() => setTour(false)} />}
    </div>
  );
}

/* ---------- FAVORITES ---------- */
export function Favorites() {
  const { t, listings, favs, go } = useApp();
  const items = listings.filter(p => favs.includes(p.id));
  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-4 pt-28 pb-16 text-slate-800">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">{t('محفوظاتك', 'Your shortlist')}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{t('المفضلة', 'Saved properties')}</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500">
        {items.length} {t('عقار محفوظ', 'saved')}
      </p>
      {items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(p => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] bg-white py-20 text-center ring-1 ring-slate-200">
          <Heart className="mx-auto text-slate-300" size={48} />
          <h3 className="mt-4 text-lg font-black text-slate-950">{t('لم تحفظ أي عقار بعد', 'Nothing saved yet')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('اضغط على القلب في أي عقار لحفظه هنا.', 'Tap the heart on any property to save it here.')}</p>
          <button onClick={() => go('/browse')} className="mt-6 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-600">
            {t('تصفح العقارات', 'Browse properties')}
          </button>
        </div>
      )}
    </div>
  );
}
