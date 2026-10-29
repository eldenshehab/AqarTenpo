import { Heart, BedDouble, Bath, Maximize, MapPin, GitCompare, Menu, X, Globe, LogOut, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';
import { fmt, TYPES, type Property } from '../data';
import { currencyOf } from '../catalog';
import { PLATFORM_PHONE_DISPLAY } from '../config';
import { BrandMark } from './BrandMark';

export function PropertyImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`img-zoom relative overflow-hidden bg-slate-100 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      <span className="pointer-events-none absolute bottom-3 end-3 rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-bold text-slate-700 backdrop-blur-sm">
        عقار تينبو | AqarTenpo
      </span>
    </div>
  );
}

export function Price({ p }: { p: Property }) {
  const { lang, t } = useApp();
  return (
    <>
      {fmt(p.price, lang)} <span className="text-xs font-bold text-slate-500">{currencyOf(p)[lang]}</span>
      {p.deal === 'rent' && <span className="text-xs font-medium text-slate-400"> / {t('شهر', 'mo')}</span>}
    </>
  );
}

export function PropertyCard({ p, onHover, className = '' }: { p: Property; onHover?: (id: string | null) => void; className?: string }) {
  const { lang, t, favs, toggleFav, compare, toggleCompare, go } = useApp();
  const [img, setImg] = useState(0);
  const fav = favs.includes(p.id);
  const inCompare = compare.includes(p.id);
  const typeLabel = TYPES.find(x => x.id === p.type)?.[lang] || p.type;
  const kindLabel = p.assignment ? t('تنازل عن عقد', 'Assignment') : p.deal === 'rent' ? t('للإيجار', 'For rent') : t('للبيع', 'For sale');
  const loc = p.locationArea || (lang === 'ar' ? p.city : p.cityEn);

  return (
    <article
      onMouseEnter={() => onHover?.(p.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => go('/property/' + p.id)}
      className={`rise group cursor-pointer rounded-[28px] bg-white p-2.5 ring-1 ring-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,.35)] transition duration-500 hover:-translate-y-1 hover:ring-blue-300 hover:shadow-[0_30px_60px_-30px_rgba(37,99,235,.35)] ${className}`}
    >
      <div
        className="relative h-64 overflow-hidden rounded-[22px]"
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          const idx = Math.min(p.images.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * p.images.length)));
          setImg(idx);
        }}
      >
        <PropertyImage src={p.images[img] || p.images[0]} alt={p.title} className="h-full w-full" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="flex flex-wrap items-center gap-1">
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold backdrop-blur ${p.assignment ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-900'}`}>
              {kindLabel} · {typeLabel}
            </span>
            {!!p.projectDrawings?.length && <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white backdrop-blur">3D</span>}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              title={t('قارن', 'Compare')}
              onClick={e => {
                e.stopPropagation();
                toggleCompare(p.id);
              }}
              className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${inCompare ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-800 hover:bg-white'}`}
            >
              <GitCompare size={14} />
            </button>
            <button
              type="button"
              title={t('المفضلة', 'Save')}
              onClick={e => {
                e.stopPropagation();
                toggleFav(p.id);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-white"
            >
              <Heart size={14} className={fav ? 'fill-rose-500 text-rose-500' : 'text-slate-800'} />
            </button>
          </div>
        </div>

        {p.images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
            {p.images.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === img ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="px-2 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-extrabold text-slate-900 transition group-hover:text-blue-700">
              {lang === 'ar' ? p.title : p.titleEn}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <MapPin size={13} className="shrink-0 text-blue-600" />
              <span className="truncate">{loc}</span>
            </p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-white transition group-hover:bg-blue-600">
            <ArrowUpRight size={16} className="rtl:-scale-x-100" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="text-lg font-black text-slate-950">
            <Price p={p} />
          </div>
          <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-bold text-slate-500">
            {p.beds > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} />
                {p.beds}
              </span>
            )}
            {p.baths > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={13} />
                {p.baths}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize size={13} />
              {fmt(p.area, lang)} {t('م²', 'm²')}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Navbar() {
  const { t, lang, setLang, user, signOut, setAuthOpen, go, route } = useApp();
  const [open, setOpen] = useState(false);

  const links: [string, string][] = [
    ['/', t('الرئيسية', 'Home')],
    ['/browse', t('تصفح', 'Browse')],
    ['/market', t('السوق', 'Market')],
    ['/assistant', t('المساعد', 'Assistant')],
    ...(user ? [['/my-listings', t('إعلاناتي', 'My ads')] as [string, string]] : []),
    ...(user?.isAdmin ? [['/admin', t('الإدارة', 'Admin')] as [string, string]] : []),
  ];
  const isActive = (h: string) => (h === '/' ? route === '/' : route.startsWith(h));

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 md:top-4 md:px-4">
      <div className="mx-auto max-w-6xl rounded-full border border-white/80 bg-white/75 shadow-[0_12px_40px_-18px_rgba(15,23,42,.35)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between ps-2 pe-2 md:h-16 md:ps-3">
          <button onClick={() => go('/')} className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-black ring-1 ring-white/20">
              <BrandMark size={35} />
            </span>
            <span className="text-start leading-none">
              <span className="brand-wordmark block text-[13px] font-extrabold uppercase tracking-[.2em]">AQAR TENPO</span>
              <span className="mt-1 block text-[9px] font-bold tracking-[.12em] text-slate-400">{t('عقار تينبو', 'BUY · SELL · INVEST')}</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map(([h, l]) => (
              <button
                key={h}
                onClick={() => go(h)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                  isActive(h) ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {l}
              </button>
            ))}
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full px-3.5 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-100">{t('المنصة', 'Platform')}</summary>
              <div className="absolute end-0 top-11 z-50 w-52 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                {[['/areas', t('المناطق', 'Areas')], ['/assignments', t('التنازل', 'Assignments')], ['/brokers', t('الوسطاء', 'Brokers')], ['/network', t('تعاون الوسطاء', 'Broker network')], ['/alerts', t('التنبيهات', 'Alerts')], ['/desk', t('مكتب الوسيط', 'Broker desk')], ['/sell', t('أضف عقارك', 'List property')], ['/my-listings', t('إعلاناتي', 'My ads')], ['/favorites', t('المفضلة', 'Saved')], ...(user?.role === 'admin' ? [['/admin', t('لوحة التحكم', 'Admin panel')]] : [])].map(([h, l]) => <button key={h} onClick={() => go(h)} className="block w-full rounded-xl px-3 py-2 text-start text-xs font-bold text-slate-700 hover:bg-slate-50">{l}</button>)}
              </div>
            </details>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              <Globe size={14} />
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            {user ? (
              <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 ps-1 pe-3 text-sm font-bold text-slate-800">
                <button onClick={() => go('/my-listings')} className="flex items-center gap-2" title={t('إعلاناتي', 'My listings')}>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{user.name[0]?.toUpperCase() || 'U'}</span>
                  <span className="max-w-[100px] truncate text-xs">{user.name}</span>
                </button>
                {user.isAdmin && <button onClick={() => go('/admin')} className="rounded-full bg-slate-950 px-2 py-1 text-[9px] font-black text-white">ADMIN</button>}
                {user.accountType === 'company' && <span className="hidden xl:inline text-[9px] font-black uppercase tracking-wider">50 FREE</span>}
                <button onClick={() => signOut()} title={t('تسجيل الخروج', 'Log out')} className="text-slate-400 hover:text-rose-500">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setAuthOpen('login')} className="rounded-full px-3.5 py-2 text-[13px] font-bold text-slate-700 hover:text-blue-600">
                  {t('دخول', 'Log in')}
                </button>
                <button onClick={() => setAuthOpen('signup')} className="rounded-full bg-blue-600 px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700">
                  {t('حساب جديد', 'Sign up')}
                </button>
              </>
            )}
          </div>

          <button onClick={() => setOpen(!open)} aria-label="menu" className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white lg:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="slide-down border-t border-slate-200 p-3 lg:hidden">
            {user && (
              <div className="mb-2 flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{user.name[0]?.toUpperCase() || 'U'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-slate-900">{user.name}</span>
                  <span className="block truncate text-[10px] text-slate-500" dir="ltr">{user.email}</span>
                </span>
                {user.isAdmin && <span className="rounded-full bg-slate-950 px-2 py-1 text-[9px] font-black text-white">ADMIN</span>}
              </div>
            )}
            {[...links, ['/areas', t('المناطق', 'Areas')], ['/sell', t('أضف عقارك', 'List')], ['/alerts', t('التنبيهات', 'Alerts')], ['/favorites', t('المفضلة', 'Saved')], ['/status', t('حالة الموقع', 'Site status')]].map(([h, l]) => (
              <button
                key={h}
                onClick={() => {
                  go(h);
                  setOpen(false);
                }}
                className={`block w-full rounded-2xl px-4 py-3 text-start text-sm font-bold ${isActive(h) ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {l}
              </button>
            ))}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="flex items-center gap-1 px-2 text-sm font-bold text-slate-700">
                <Globe size={15} />
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="text-xs font-bold text-rose-500"
                >
                  {t('خروج', 'Log out')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAuthOpen('login');
                      setOpen(false);
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800"
                  >
                    {t('دخول', 'Log in')}
                  </button>
                  <button
                    onClick={() => {
                      setAuthOpen('signup');
                      setOpen(false);
                    }}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    {t('حساب جديد', 'Sign up')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  const { t, go } = useApp();
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-black ring-1 ring-white/20"><BrandMark size={35} /></span>
              <h3 className="brand-wordmark text-sm font-black uppercase tracking-[.2em]">AQAR TENPO</h3>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">
              {t(
                'منصة عقارية رقمية تربط المشترين والمستثمرين والبائعين لعرض وتصفح ومقارنة العقارات في جميع المحافظات، مع سوق حصري للتنازل عن عقود التقسيط وجولات 3D.',
                'A digital real-estate platform connecting buyers, investors and sellers to browse and compare properties across all governorates, with an exclusive installment-assignment market and 3D tours.'
              )}
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('التصفح', 'Browse')}</h4>
            <div className="space-y-2.5">
              {[
                ['/browse', t('تصفح العقارات', 'All properties')],
                ['/market', t('مركز السوق', 'Market desk')],
                ['/areas', t('التجمع وأكتوبر', 'New Cairo & October')],
                ['/assistant', t('المساعد العقاري', 'Assistant')],
                ['/brokers', t('الوسطاء', 'Brokers')],
                ['/network', t('تعاون الوسطاء', 'Broker network')],
              ].map(([h, l]) => (
                <button key={h} onClick={() => go(h)} className="block text-xs font-semibold text-slate-600 hover:text-blue-600">
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('للبائعين', 'Sellers')}</h4>
            <div className="space-y-2.5">
              <button onClick={() => go('/sell')} className="block text-xs font-semibold text-slate-600 hover:text-blue-600">
                {t('أضف عقارك مجاناً', 'List for free')}
              </button>
              <button onClick={() => go('/assignments')} className="block text-xs font-semibold text-slate-600 hover:text-blue-600">
                {t('الوساطة الحصرية 1.5%', 'Exclusive brokerage 1.5%')}
              </button>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-slate-400">{t('تواصل', 'Contact')}</h4>
            <p className="text-xs text-slate-600">info@aqartenpo.com</p>
            <p className="mt-1 text-xs text-slate-600" dir="ltr">{PLATFORM_PHONE_DISPLAY}</p>
          </div>
        </div>

        <div className="pointer-events-none mt-12 select-none text-center text-[14vw] font-black leading-none tracking-tighter text-slate-100 md:text-[8.5rem]">
          AqarTenpo
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 py-6 text-[11px] text-slate-400 sm:flex-row">
          <p>© 2026 {t('عقار تينبو. جميع الحقوق محفوظة.', 'AqarTenpo. All rights reserved.')}</p>
          <p>{t('مصر · الخليج · العالم', 'Egypt · Gulf · World')}</p>
        </div>
      </div>
    </footer>
  );
}
