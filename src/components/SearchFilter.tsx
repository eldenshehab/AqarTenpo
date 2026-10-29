import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Building,
  Layers,
  Sofa,
  KeyRound,
  Maximize2,
  Coins,
  Tag,
} from 'lucide-react';
import { useApp } from '../store';
import { searchLocations } from '../locations';
import {
  AMENITIES_LIST,
  FLOOR_LEVELS,
  FURNISHING_OPTIONS,
  STATUS_OPTIONS,
  type LocationSuggestion,
  type PType,
} from '../data';

export interface FilterState {
  locations: string[]; // selected location names
  deal: '' | 'sale' | 'rent';
  type: '' | PType;
  maxPrice: number;
  minPrice: number;
  furnishing: string; // 'all' | 'furnished' | 'unfurnished' | 'semi_furnished'
  status: string; // 'all' | 'under_construction' | 'ready'
  minArea: number;
  maxArea: number;
  minPricePerMeter: number;
  maxPricePerMeter: number;
  amenities: string[];
  floorLevel: string;
  keywords: string;
}

export const initialFilterState: FilterState = {
  locations: [],
  deal: '',
  type: '',
  maxPrice: 0,
  minPrice: 0,
  furnishing: 'all',
  status: 'all',
  minArea: 0,
  maxArea: 0,
  minPricePerMeter: 0,
  maxPricePerMeter: 0,
  amenities: [],
  floorLevel: 'all',
  keywords: '',
};

export function MultiLocationSearch({
  selected,
  onChange,
  placeholder,
  className = '',
}: {
  selected: string[];
  onChange: (locs: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const { lang, t } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => searchLocations(query, selected), [query, selected]);

  const addLocation = (name: string) => {
    if (!selected.includes(name)) {
      onChange([...selected, name]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeLocation = (name: string) => {
    onChange(selected.filter(s => s !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addLocation(suggestions[0].nameAr);
      } else if (query.trim()) {
        addLocation(query.trim());
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeLocation(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative flex-1 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-xs transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <MapPin size={18} className="shrink-0 text-blue-600" />

        {/* Selected Location Chips */}
        {selected.map(loc => (
          <span
            key={loc}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-800 animate-fadeIn"
          >
            <span>{loc}</span>
            <button
              type="button"
              onClick={() => removeLocation(loc)}
              className="rounded-full p-0.5 text-blue-600 hover:bg-blue-200 transition"
              title={t('حذف', 'Remove')}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selected.length > 0
              ? t('أضف موقعاً آخر...', 'Add another location...')
              : placeholder || t('ابحث بالمدينة أو الحي (مثلاً: جن أو رو أو زايد)...', 'Search city or area (e.g. جن, رو, زايد)...')
          }
          className="min-w-[160px] flex-1 bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
        />

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition px-1"
          >
            {t('مسح الكل', 'Clear')}
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl slide-down">
          <div className="mb-1.5 flex items-center justify-between px-2 text-xs font-bold text-slate-400">
            <span>{t('المواقع المقترحة (اختر مكاناً أو أكثر)', 'Suggested Locations (select one or more)')}</span>
            <span className="text-[10px] text-blue-600">{suggestions.length} {t('نتيجة', 'results')}</span>
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((loc: LocationSuggestion) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => addLocation(loc.nameAr)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm transition hover:bg-blue-50 text-slate-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition">
                      <MapPin size={14} />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700">
                        {lang === 'ar' ? loc.nameAr : loc.nameEn}
                      </p>
                      <p className="text-xs text-slate-400">
                        {lang === 'ar' ? loc.cityAr : loc.cityEn}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <span>+ {t('إضافة', 'Add')}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500">
              <p>{t('لم نجد هذا الموقع بالتحديد، يمكنك الضغط على Enter لإضافته كنص بحث.', 'Location not listed, press Enter to search as custom keyword.')}</p>
              {query && (
                <button
                  type="button"
                  onClick={() => addLocation(query)}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <span>+ {t('إضافة', 'Add')} "{query}"</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdvancedFilterDrawer({
  filter,
  setFilter,
  isOpen,
  onClose,
  totalResults,
}: {
  filter: FilterState;
  setFilter: (f: FilterState | ((prev: FilterState) => FilterState)) => void;
  isOpen: boolean;
  onClose: () => void;
  totalResults?: number;
}) {
  const { lang, t } = useApp();
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);
  const [showMoreFloors, setShowMoreFloors] = useState(false);

  if (!isOpen) return null;

  const toggleAmenity = (id: string) => {
    setFilter(prev => {
      const exists = prev.amenities.includes(id);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== id)
          : [...prev.amenities, id],
      };
    });
  };

  const activeCount =
    (filter.furnishing !== 'all' ? 1 : 0) +
    (filter.status !== 'all' ? 1 : 0) +
    (filter.floorLevel !== 'all' ? 1 : 0) +
    (filter.minArea > 0 || filter.maxArea > 0 ? 1 : 0) +
    (filter.minPricePerMeter > 0 || filter.maxPricePerMeter > 0 ? 1 : 0) +
    filter.amenities.length +
    (filter.keywords ? 1 : 0);

  const resetAdvanced = () => {
    setFilter(prev => ({
      ...prev,
      furnishing: 'all',
      status: 'all',
      minArea: 0,
      maxArea: 0,
      minPricePerMeter: 0,
      maxPricePerMeter: 0,
      amenities: [],
      floorLevel: 'all',
      keywords: '',
    }));
  };

  const buildingAmenities = AMENITIES_LIST.filter(a => a.building);
  const extraAmenities = AMENITIES_LIST.filter(a => !a.building);
  const primaryFloors = FLOOR_LEVELS.slice(0, 3);
  const extraFloors = FLOOR_LEVELS.slice(3);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="modal-in relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {t('المزيد من خيارات البحث', 'More Search Options')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('خصص معايير البحث بدقة لتصل للعقار المثالي', 'Customize your search criteria accurately')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={resetAdvanced}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <RotateCcw size={12} />
                <span>{t('إعادة ضبط', 'Reset')} ({activeCount})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. الفرش (Furnishing) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <Sofa size={16} className="text-blue-600" />
              <span>{t('الفرش', 'Furnishing')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FURNISHING_OPTIONS.map(opt => {
                const active = filter.furnishing === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, furnishing: opt.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {opt[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. حالة العقار (Property Completion / Handover Status) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <KeyRound size={16} className="text-blue-600" />
              <span>{t('حالة العقار', 'Property Status')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(opt => {
                const active = filter.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, status: opt.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {opt[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. مساحة العقار (متر مربع) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <Maximize2 size={16} className="text-blue-600" />
              <span>{t('مساحة العقار (متر مربع)', 'Property Area (m²)')}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  {t('أقل متر مربع', 'Min Area (m²)')}
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={filter.minArea || ''}
                  onChange={e => setFilter(prev => ({ ...prev, minArea: +e.target.value }))}
                  placeholder={t('مثلاً: 100', 'e.g. 100')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  {t('أكبر متر مربع', 'Max Area (m²)')}
                </span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={filter.maxArea || ''}
                  onChange={e => setFilter(prev => ({ ...prev, maxArea: +e.target.value }))}
                  placeholder={t('مثلاً: 500', 'e.g. 500')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 4. السعر لكل مساحة (متر مربع) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <Coins size={16} className="text-blue-600" />
              <span>{t('السعر لكل مساحة (جنيه / متر مربع)', 'Price per Area (EGP / m²)')}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  {t('أقل جنيه/متر مربع', 'Min EGP/m²')}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={filter.minPricePerMeter || ''}
                  onChange={e => setFilter(prev => ({ ...prev, minPricePerMeter: +e.target.value }))}
                  placeholder={t('مثلاً: 20000', 'e.g. 20,000')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  {t('أكبر جنيه/متر مربع', 'Max EGP/m²')}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={filter.maxPricePerMeter || ''}
                  onChange={e => setFilter(prev => ({ ...prev, maxPricePerMeter: +e.target.value }))}
                  placeholder={t('مثلاً: 80000', 'e.g. 80,000')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 5. مزايا (خاص بالمبنى أو المجمع + عرض المزيد) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-1 flex items-center gap-2 text-sm font-black text-slate-900">
              <Building size={16} className="text-blue-600" />
              <span>{t('مزايا', 'Amenities')}</span>
            </label>
            <p className="mb-3 text-xs text-slate-500">
              {t('خاص بالمبنى أو المجمع', 'Building or Community Features')}
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {buildingAmenities.map(am => {
                const checked = filter.amenities.includes(am.id);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.id)}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition text-start ${
                      checked
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{am[lang]}</span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-md border text-xs ${
                        checked
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check size={12} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Extra Amenities (عرض المزيد) */}
            {showMoreAmenities && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 animate-fadeIn border-t border-slate-200 pt-3">
                {extraAmenities.map(am => {
                  const checked = filter.amenities.includes(am.id);
                  return (
                    <button
                      key={am.id}
                      type="button"
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition text-start ${
                        checked
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{am[lang]}</span>
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-md border text-xs ${
                          checked
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMoreAmenities(!showMoreAmenities)}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>{showMoreAmenities ? t('عرض أقل', 'Show less') : t('عرض المزيد من المزايا', 'Show more amenities')}</span>
              {showMoreAmenities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 6. مستوى الوحدة (Unit Level / Floor + عرض المزيد) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <Layers size={16} className="text-blue-600" />
              <span>{t('مستوى الوحدة', 'Unit Floor Level')}</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFilter(prev => ({ ...prev, floorLevel: 'all' }))}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  filter.floorLevel === 'all'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {t('جميع الطوابق', 'All Floors')}
              </button>
              {primaryFloors.map(fl => {
                const active = filter.floorLevel === fl.id;
                return (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setFilter(prev => ({ ...prev, floorLevel: fl.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {fl[lang]}
                  </button>
                );
              })}
            </div>

            {showMoreFloors && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-fadeIn border-t border-slate-200 pt-3">
                {extraFloors.map(fl => {
                  const active = filter.floorLevel === fl.id;
                  return (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => setFilter(prev => ({ ...prev, floorLevel: fl.id }))}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {fl[lang]}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMoreFloors(!showMoreFloors)}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>{showMoreFloors ? t('عرض أقل', 'Show less') : t('عرض المزيد من خيارات الطوابق', 'Show more floor options')}</span>
              {showMoreFloors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 7. كلمات بحث (Keywords) */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-black text-slate-900">
              <Tag size={16} className="text-blue-600" />
              <span>{t('كلمات بحث', 'Keywords')}</span>
            </label>
            <input
              type="text"
              value={filter.keywords}
              onChange={e => setFilter(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder={t('كلمات بحث مثلا: شاطئ ، مبرد مجاني ، إطلالة بحرية ، تشطيب سوبر لوكس', 'Keywords e.g.: beach, free chiller, sea view, luxury finish')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['شاطئ', 'مبرد مجاني', 'مسبح مشترك', 'خدمة بواب', 'تقسيط', 'نيل'].map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() =>
                    setFilter(prev => ({
                      ...prev,
                      keywords: prev.keywords ? `${prev.keywords} ${kw}` : kw,
                    }))
                  }
                  className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Apply CTA */}
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-between border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <button
            type="button"
            onClick={resetAdvanced}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            {t('مسح التخصيص', 'Clear filters')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            <span>{t('تطبيق النتائج', 'Apply Filters')}</span>
            {totalResults !== undefined && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {totalResults} {t('عقار', 'properties')}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainSearchBar({
  filter,
  setFilter,
  onSearch,
}: {
  filter: FilterState;
  setFilter: (f: FilterState | ((prev: FilterState) => FilterState)) => void;
  onSearch: () => void;
}) {
  const { t } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeAdvancedCount =
    (filter.furnishing !== 'all' ? 1 : 0) +
    (filter.status !== 'all' ? 1 : 0) +
    (filter.floorLevel !== 'all' ? 1 : 0) +
    (filter.minArea > 0 || filter.maxArea > 0 ? 1 : 0) +
    (filter.minPricePerMeter > 0 || filter.maxPricePerMeter > 0 ? 1 : 0) +
    filter.amenities.length +
    (filter.keywords ? 1 : 0);

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-xl">
        {/* Deal Toggle: Buy / Rent */}
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => setFilter(prev => ({ ...prev, deal: 'sale' }))}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter.deal === 'sale' || !filter.deal
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            {t('شراء', 'Buy')}
          </button>
          <button
            type="button"
            onClick={() => setFilter(prev => ({ ...prev, deal: 'rent' }))}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter.deal === 'rent'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            {t('إيجار', 'Rent')}
          </button>
        </div>

        {/* Search Row */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {/* Multi-Location Smart Autocomplete */}
          <MultiLocationSearch
            selected={filter.locations}
            onChange={locs => setFilter(prev => ({ ...prev, locations: locs }))}
            className="flex-1"
          />

          {/* Advanced Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`relative flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition shadow-xs ${
              activeAdvancedCount > 0
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>{t('المزيد من الخيارات', 'More Filters')}</span>
            {activeAdvancedCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                {activeAdvancedCount}
              </span>
            )}
          </button>

          {/* Submit Search Button */}
          <button
            type="button"
            onClick={onSearch}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition"
          >
            <Search size={18} />
            <span>{t('بحث', 'Search')}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Modal/Drawer */}
      <AdvancedFilterDrawer
        filter={filter}
        setFilter={setFilter}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
