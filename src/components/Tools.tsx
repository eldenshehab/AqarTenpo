import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { fmt, type Property } from '../data';
import { currencyOf } from '../catalog';
import { Calculator, TrendingUp } from 'lucide-react';

const PLATES = [
  { id: 'US', keys: ['US', 'أمريكا', 'USA'], ar: 'أمريكا', en: 'USA', flag: '🇺🇸', x: 2, y: 12, w: 14, h: 18 },
  { id: 'GB', keys: ['GB', 'بريطانيا', 'UK'], ar: 'بريطانيا', en: 'UK', flag: '🇬🇧', x: 20, y: 7, w: 10, h: 11 },
  { id: 'MA', keys: ['MA', 'المغرب'], ar: 'المغرب', en: 'Morocco', flag: '🇲🇦', x: 8, y: 40, w: 14, h: 16 },
  { id: 'TR', keys: ['TR', 'تركيا'], ar: 'تركيا', en: 'Turkey', flag: '🇹🇷', x: 41, y: 7, w: 15, h: 13 },
  { id: 'EG', keys: ['EG', 'مصر', 'Egypt'], ar: 'مصر', en: 'Egypt', flag: '🇪🇬', x: 28, y: 26, w: 25, h: 40 },
  { id: 'JO', keys: ['JO', 'الأردن'], ar: 'الأردن', en: 'Jordan', flag: '🇯🇴', x: 56, y: 28, w: 10, h: 11 },
  { id: 'SA', keys: ['SA', 'السعودية'], ar: 'السعودية', en: 'Saudi Arabia', flag: '🇸🇦', x: 54, y: 44, w: 18, h: 24 },
  { id: 'KW', keys: ['KW', 'الكويت'], ar: 'الكويت', en: 'Kuwait', flag: '🇰🇼', x: 69, y: 31, w: 10, h: 10 },
  { id: 'QA', keys: ['QA', 'قطر'], ar: 'قطر', en: 'Qatar', flag: '🇶🇦', x: 74, y: 46, w: 8, h: 9 },
  { id: 'AE', keys: ['AE', 'الإمارات', 'UAE'], ar: 'الإمارات', en: 'UAE', flag: '🇦🇪', x: 78, y: 59, w: 12, h: 14 },
];

function plateOf(p: Property) {
  const key = `${p.country || 'مصر'} ${p.currency || ''}`;
  return PLATES.find(c => c.keys.some(k => key.includes(k))) || PLATES[4];
}

/* Deterministic, evenly spaced pin grid. No random coordinates and no overlapping pins. */
function gridLayout<T>(list: T[], plate: (typeof PLATES)[number], cap: number) {
  // small country plates get at most two pins in one tidy row
  const small = plate.w < 14 || plate.h < 14;
  const pins = list.slice(0, small ? Math.min(cap, 2) : cap);
  const cols = pins.length <= 1 ? 1 : 2;
  const rows = Math.max(1, Math.ceil(pins.length / cols));
  const area = { x: plate.x + 1.5, y: plate.y + 5.5, w: plate.w - 3, h: plate.h - 7.5 };
  return {
    pins: pins.map((item, i) => ({
      item,
      x: area.x + ((i % cols) + 0.5) * (area.w / cols),
      y: area.y + (Math.floor(i / cols) + 0.5) * (area.h / rows),
    })),
    hidden: list.length - pins.length,
  };
}

export function MapView({
  items,
  hover,
  setHover,
  active = '',
  onCompound,
}: {
  items: Property[];
  hover: string | null;
  setHover: (id: string | null) => void;
  compounds?: { name: string; lat: number; lng: number }[];
  active?: string;
  onCompound?: (name: string) => void;
}) {
  const { lang, go, t } = useApp();
  const [country, setCountry] = useState('');
  const short = (n: number) =>
    n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);

  const grouped = PLATES.map(plate => {
    const rows = items.filter(p => plateOf(p).id === plate.id);
    // stable order: by city, then price so pins read like a list
    rows.sort((a, b) => `${a.city}`.localeCompare(`${b.city}`, 'ar') || a.price - b.price);
    return { plate, rows };
  });
  const total = items.length;
  const selected = grouped.find(g => g.plate.id === country);

  return (
    <div className="relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white" dir="ltr">
      {/* Country filter: every country we operate in */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-200 bg-white/95 p-2.5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <button onClick={() => setCountry('')} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${!country ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
          {t('كل الدول', 'All')} · {total}
        </button>
        {grouped.map(({ plate, rows }) => (
          <button key={plate.id} onClick={() => setCountry(country === plate.id ? '' : plate.id)} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${country === plate.id ? 'bg-blue-600 text-white' : rows.length ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-400'}`}>
            {plate.flag} {lang === 'ar' ? plate.ar : plate.en} · {rows.length}
          </button>
        ))}
      </div>

      <div className="relative min-h-[380px] flex-1 overflow-hidden bg-[#eef6fb]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <rect width="100" height="100" fill="#eef6fb" />
          <path d="M0 10 Q25 4 55 9 T100 5 V0 H0Z" fill="#bae6fd" opacity=".7" />
          {grouped.map(({ plate }) => {
            const on = !country || country === plate.id;
            return (
              <g key={plate.id} opacity={on ? 1 : 0.35}>
                <rect x={plate.x} y={plate.y} width={plate.w} height={plate.h} rx="2" fill={country === plate.id ? '#dbeafe' : '#ffffff'} stroke={country === plate.id ? '#2563eb' : '#cbd5e1'} strokeWidth=".35" />
              </g>
            );
          })}
          {/* simple sea route / distance cues */}
          <path d="M40 30 Q52 26 60 32 M40 40 Q55 40 63 50" stroke="#93c5fd" strokeWidth=".4" strokeDasharray="1 1.2" fill="none" />
        </svg>

        {/* country labels are always visible so every market is on the map */}
        {grouped.map(({ plate, rows }) => (
          <button key={'label-' + plate.id} onClick={() => setCountry(country === plate.id ? '' : plate.id)}
            className={`absolute z-10 flex max-w-[92px] items-center gap-1 overflow-hidden rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-black shadow-sm ring-1 ${country === plate.id ? 'text-blue-700 ring-blue-400' : 'text-slate-800 ring-slate-200'} ${rows.length ? '' : 'opacity-60'}`}
            style={{ left: `${plate.x + 0.8}%`, top: `${plate.y + 0.7}%`, maxWidth: `${plate.w - 1.6}%` }}>
            <span>{plate.flag}</span>
            <span className="truncate">{lang === 'ar' ? plate.ar : plate.en}</span>
            <span className="text-slate-400">{rows.length}</span>
          </button>
        ))}

        {grouped.map(({ plate, rows }) => {
          if (!rows.length) return null;
          const on = !country || country === plate.id;
          const { pins, hidden } = gridLayout(rows, plate, country === plate.id ? 8 : plate.id === 'EG' ? 6 : 2);
          return (
            <div key={plate.id} className={`absolute inset-0 ${on ? '' : 'pointer-events-none'}`}>
              {pins.map(({ item: p, x, y }) => {
                const hot = hover === p.id;
                return (
                  <button
                    key={p.id}
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => go('/property/' + p.id)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full font-black shadow-sm transition ${plate.id === 'EG' ? 'px-2 py-1 text-[11px]' : 'px-1.5 py-0.5 text-[9px]'} ${
                      hot ? 'z-30 scale-110 bg-blue-600 text-white ring-4 ring-blue-200' : 'z-10 border border-slate-200 bg-white text-slate-900 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {short(p.price)}
                    {hot && (
                      <span className={`pointer-events-none absolute bottom-full z-40 mb-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white text-start shadow-xl ${lang === 'ar' ? 'right-0' : 'left-0'}`}>
                        <img src={p.images[0]} alt="" className="h-24 w-full object-cover" />
                        <span className="block p-2.5">
                          <span className="block text-xs font-black text-blue-700">{fmt(p.price, lang)} {currencyOf(p)[lang]}</span>
                          <span className="line-clamp-1 text-[11px] font-bold text-slate-800">{lang === 'ar' ? p.title : p.titleEn}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-500">{p.locationArea || p.city}</span>
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
              {hidden > 0 && (
                <button onClick={() => setCountry(plate.id)} style={{ left: `${plate.x + plate.w - 9}%`, top: `${plate.y + plate.h - 3.5}%` }} className="absolute rounded-full bg-slate-950 px-1.5 py-0.5 text-[9px] font-black text-white">
                  +{hidden}
                </button>
              )}
            </div>
          );
        })}

        {(total === 0 || (selected && selected.rows.length === 0)) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 grid place-items-center text-center">
            <p className="rounded-2xl bg-white/95 px-4 py-2 text-xs font-bold text-slate-700 shadow ring-1 ring-slate-200">
              {selected && selected.rows.length === 0
                ? t('لا توجد إعلانات في هذه الدولة حالياً', 'No listings in this country yet')
                : t('لا توجد إعلانات مطابقة على الخريطة', 'No matching listings on the map')}
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <span>{total} {t('إعلان على الخريطة', 'listings on the map')}{selected ? ` · ${lang === 'ar' ? selected.plate.ar : selected.plate.en}` : ''}</span>
        <span className="text-slate-400">{t('الدبوس = سعر الطلب بعملة البلد · اضغط دولة للتصفية', 'Pin = asking price in local currency · click a country to filter')}</span>
      </div>

      {active && (
        <button onClick={() => onCompound?.(active)} className="absolute bottom-12 start-3 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white shadow">
          {t('إلغاء تصفية المنطقة', 'Clear area filter')}: {active}
        </button>
      )}
    </div>
  );
}

const Slider = ({
  label,
  v,
  set,
  min,
  max,
  step,
  show,
}: {
  label: string;
  v: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step: number;
  show: string;
}) => (
  <label className="block text-xs font-bold text-slate-600">
    <div className="mb-1.5 flex justify-between">
      <span>{label}</span>
      <b className="text-slate-900 font-black">{show}</b>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={e => set(+e.target.value)}
      className="w-full accent-blue-600 cursor-pointer"
    />
  </label>
);

export function MortgageCalculator({ price }: { price: number }) {
  const { t, lang } = useApp();
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);

  const monthly = useMemo(() => {
    const P = price * (1 - down / 100);
    const r = rate / 1200;
    const n = years * 12;
    return r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
  }, [price, down, years, rate]);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Calculator size={18} />
        </span>
        <h3 className="text-base font-black text-slate-900">
          {t('حاسبة التمويل العقاري', 'Mortgage Calculator')}
        </h3>
      </div>

      <Slider
        label={t('المقدم المطلوب (%)', 'Down payment (%)')}
        v={down}
        set={setDown}
        min={0}
        max={80}
        step={5}
        show={`${down}% (${fmt(Math.round((price * down) / 100), lang)} ${t('ج.م', 'EGP')})`}
      />
      <Slider
        label={t('مدة السداد (سنوات)', 'Repayment period (years)')}
        v={years}
        set={setYears}
        min={1}
        max={30}
        step={1}
        show={`${years} ${t('سنوات', 'years')}`}
      />
      <Slider
        label={t('الفائدة السنوية المتوقعة', 'Annual interest rate')}
        v={rate}
        set={setRate}
        min={0}
        max={30}
        step={0.5}
        show={`${rate}%`}
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
        <p className="text-xs font-semibold text-slate-600">{t('القسط الشهري التقديري', 'Estimated Monthly Payment')}</p>
        <p className="mt-1 text-2xl font-black text-blue-700">
          {fmt(Math.round(monthly), lang)} {t('ج.م', 'EGP')}
        </p>
      </div>
    </div>
  );
}

export function RoiCalculator({ price, rent }: { price: number; rent: number }) {
  const { t, lang } = useApp();
  const [r, setR] = useState(rent);
  const [exp, setExp] = useState(15);
  const [growth, setGrowth] = useState(8);

  const net = r * 12 * (1 - exp / 100);
  const roi = (net / price) * 100;
  const fiveY = price * Math.pow(1 + growth / 100, 5);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <TrendingUp size={18} />
        </span>
        <h3 className="text-base font-black text-slate-900">
          {t('حاسبة العائد على الاستثمار', 'ROI & Rental Yield Calculator')}
        </h3>
      </div>

      <Slider
        label={t('الإيجار الشهري المتوقع', 'Expected Monthly Rent')}
        v={r}
        set={setR}
        min={0}
        max={Math.max(rent * 3, 1000)}
        step={500}
        show={`${fmt(r, lang)} ${t('ج.م', 'EGP')}`}
      />
      <Slider
        label={t('المصروفات والصيانة (%)', 'Expenses & Maintenance (%)')}
        v={exp}
        set={setExp}
        min={0}
        max={50}
        step={1}
        show={`${exp}%`}
      />
      <Slider
        label={t('الزيادة السنوية في القيمة (%)', 'Annual Appreciation (%)')}
        v={growth}
        set={setGrowth}
        min={0}
        max={30}
        step={1}
        show={`${growth}%`}
      />

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-[11px] font-semibold text-slate-600">{t('العائد الصافي السنوي', 'Annual Net Yield')}</p>
          <p className="mt-1 text-xl font-black text-emerald-600">{roi.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
          <p className="text-[11px] font-semibold text-slate-600">{t('القيمة بعد 5 سنوات', 'Value in 5 Years')}</p>
          <p className="mt-1 text-base font-black text-blue-700">{fmt(Math.round(fiveY), lang)}</p>
        </div>
      </div>
    </div>
  );
}
