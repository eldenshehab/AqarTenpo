import { useState } from 'react';
import { CheckCircle2, UserRound, KeyRound, ShieldCheck, FileSignature, Info, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api, useApp, LISTING_MONTHS } from '../store';
import { AMENITIES_LIST, COUNTRIES, FLOOR_LEVELS, FURNISHING_OPTIONS, STATUS_OPTIONS, type PMode, type PType, type Property } from '../data';
import { TAXONOMY, currencyOf } from '../catalog';
import { ALL_LOCATIONS } from '../locations';
import { inputCls, PhoneInput } from '../components/Modals';
import { ImageUploader } from '../components/ImageUploader';

type Kind = 'personal_sale' | 'personal_rent' | 'brokerage' | 'assignment';

interface KindDef {
  id: Kind;
  icon: LucideIcon;
  ar: string;
  en: string;
  dAr: string;
  dEn: string;
  badgeAr: string;
  badgeEn: string;
  deal: 'sale' | 'rent';
  mode: PMode;
  assign: boolean;
}

const KINDS: KindDef[] = [
  {
    id: 'personal_sale', icon: UserRound, ar: 'إعلان شخصي - للبيع', en: 'Personal listing - For sale',
    dAr: 'اعرض عقارك بنفسك. التواصل وإدارة العملاء على البائع مباشرة.', dEn: 'List it yourself. You handle buyers and viewings directly.',
    badgeAr: 'مجاني', badgeEn: 'Free', deal: 'sale', mode: 'direct', assign: false,
  },
  {
    id: 'personal_rent', icon: KeyRound, ar: 'إعلان شخصي - للإيجار', en: 'Personal listing - For rent',
    dAr: 'اعرض وحدتك للإيجار بنفسك وبدون عمولة من المنصة.', dEn: 'Rent out your unit yourself with no platform commission.',
    badgeAr: 'مجاني', badgeEn: 'Free', deal: 'rent', mode: 'direct', assign: false,
  },
  {
    id: 'brokerage', icon: ShieldCheck, ar: 'وساطة حصرية عبر عقار تينبو', en: 'Exclusive brokerage via AqarTenpo',
    dAr: 'تنشر المنصة الإعلان وتفحص المستندات وتدير العملاء والمعاينات نيابة عنك.', dEn: 'We publish, verify documents, manage clients and viewings for you.',
    badgeAr: 'عمولة 1.5%', badgeEn: '1.5% fee', deal: 'sale', mode: 'brokerage', assign: false,
  },
  {
    id: 'assignment', icon: FileSignature, ar: 'تنازل عن عقد تقسيط', en: 'Installment contract assignment',
    dAr: 'وحدة مشتراة بالتقسيط من مطور عقاري وتريد التنازل عنها. وساطة إجبارية.', dEn: 'Unit bought on installments from a developer. Mandatory brokerage.',
    badgeAr: 'وساطة إجبارية', badgeEn: 'Mandatory brokerage', deal: 'sale', mode: 'brokerage', assign: true,
  },
];

interface FormState {
  title: string;
  type: PType;
  category: string;
  subtype: string;
  country: string;
  area: string;
  price: string;
  size: string;
  beds: string;
  baths: string;
  furnishing: 'furnished' | 'unfurnished' | 'semi_furnished';
  status: 'under_construction' | 'ready';
  floor: 'ground' | 'middle' | 'top' | 'roof' | 'duplex';
  amenities: string[];
  keywords: string;
  desc: string;
  images: string[];
  drawings: string[];
}

const EMPTY: FormState = {
  title: '', type: 'apartment', category: 'residential', subtype: 'apartment', country: 'EG', area: '', price: '', size: '', beds: '', baths: '',
  furnishing: 'unfurnished', status: 'ready', floor: 'middle', amenities: [], keywords: '', desc: '', images: [], drawings: [],
};

const EMPTY_AS = { developer: '', project: '', originalPrice: '', paidCash: '', remaining: '', installment: '', period: 'quarterly' as 'monthly' | 'quarterly', handover: '', premium: '' };

export function Sell() {
  const { t, lang, user, setAuthOpen, refresh, go, listings, publishListing } = useApp();
  const [kindId, setKindId] = useState<Kind | null>(null);
  const [f, setF] = useState<FormState>(EMPTY);
  const [as, setAs] = useState(EMPTY_AS);
  const [dial, setDial] = useState('+20');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [doneLive, setDoneLive] = useState(true);
  const companyAds = user ? listings.filter(p => p.ownerId === user.id).length : 0;
  const companyFull = user?.accountType === 'company' && companyAds >= 50;

  const kind = KINDS.find(k => k.id === kindId) || null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(prev => ({ ...prev, [k]: v }));
  const onCountry = (code: string) => {
    set('country', code);
    const c = COUNTRIES.find(x => x.code === code);
    if (c) setDial(c.dial);
  };
  const toggleAmenity = (id: string) =>
    set('amenities', f.amenities.includes(id) ? f.amenities.filter(a => a !== id) : [...f.amenities, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!user) return setAuthOpen('login');
    if (!kind) return setErr(t('اختر نوع الإعلان أولاً', 'Choose a listing type first'));
    if (f.images.length === 0) return setErr(t('أضف صورة واحدة على الأقل من جهازك', 'Add at least one photo from your device'));
    const duplicate = await api.findDuplicate({ title: f.title, phone: dial + phone, price: +f.price, location: f.area });
    if (duplicate) return setErr(t(`إعلان مشابه موجود بالفعل: ${duplicate.title}. عدّل البيانات أو أبلغ عن التكرار.`, `A similar listing already exists: ${duplicate.title}. Change the details or report the duplicate.`));
    if (kind.mode === 'brokerage' && !agree)
      return setErr(t('وافق على شروط الوساطة وعمولة 1.5% للمتابعة', 'Accept the brokerage terms and 1.5% fee to continue'));

    const price = +f.price;
    const area = +f.size;
    const loc = ALL_LOCATIONS.find(l => l.nameAr === f.area);
    const country = COUNTRIES.find(c => c.code === f.country);

    const p: Property = {
      id: 'u' + Date.now(),
      title: f.title,
      titleEn: f.title,
      type: f.type,
      deal: kind.deal,
      mode: kind.mode,
      city: loc ? (loc.kind === 'area' ? loc.cityAr : loc.nameAr) : f.area,
      cityEn: loc ? (loc.kind === 'area' ? loc.cityEn : loc.nameEn) : f.area,
      locationArea: f.area,
      locationAreaEn: loc?.nameEn ?? f.area,
      country: country ? country.name : 'مصر',
      currency: currencyOf(country?.code || 'EG').code,
      category: f.category,
      subtype: f.subtype,
      reviewStatus: 'pending',
      phoneVerified: false,
      docsVerified: false,
      updatedAt: Date.now(),
      price,
      area,
      beds: +f.beds || 0,
      baths: +f.baths || 0,
      lat: 30 + Math.random() * 0.3,
      lng: 31.2 + Math.random() * 0.3,
      images: f.images,
      desc: f.desc || '—',
      rent: kind.deal === 'rent' ? price : Math.round(price * 0.006),
      year: new Date().getFullYear(),
      phone: (dial + phone).replace('+', ''),
      furnishing: f.furnishing,
      status: f.status,
      floorLevel: f.floor,
      amenities: f.amenities,
      keywords: f.keywords.split(/[,،]/).map(s => s.trim()).filter(Boolean),
      pricePerMeter: area ? Math.round(price / area) : 0,
      projectDrawings: f.drawings,
    };

    if (kind.assign) {
      p.assignment = {
        developer: as.developer,
        project: as.project,
        originalPrice: +as.originalPrice,
        paidCash: +as.paidCash,
        remaining: +as.remaining,
        installment: +as.installment,
        period: as.period,
        handover: as.handover,
        premium: +as.premium || 0,
      };
    }

    setBusy(true);
    try {
      const created = await publishListing(p);
      refresh();
      setDoneLive(created.reviewStatus === 'approved');
      setDone(created.id);
    } catch (error) {
      if (error instanceof Error && error.message === 'COMPANY_LISTING_LIMIT') {
        setErr(t('وصلت إلى الحد الأقصى وهو 50 إعلاناً نشطاً. احذف إعلاناً أو انتظر انتهاء صلاحيته.', 'You have reached the 50 active listing limit. Delete a listing or wait for one to expire.'));
      } else {
        setErr(t('تعذر حفظ الإعلان. قلل عدد الصور أو حجمها ثم حاول مرة أخرى.', 'Could not save the listing. Reduce the number or size of photos and try again.'));
      }
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div className="grid min-h-[80vh] place-items-center px-4 pt-28 text-center text-slate-800">
        <div className="max-w-md rounded-[32px] bg-white p-10 shadow-[0_30px_60px_-30px_rgba(15,23,42,.35)] ring-1 ring-slate-200">
          <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">
            {doneLive ? t('تم نشر إعلانك بنجاح', 'Your listing is live') : t('تم استلام طلبك', 'Your request was received')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {doneLive
              ? t('إعلانك ظاهر الآن للجميع، ويمكنك تعديله أو حذفه ومتابعة المشاهدات من «إعلاناتي».', 'Your listing is now public. Edit it, delete it and follow views from My ads.')
              : t('فريق عقار تينبو سيراجع الإعلان وينشره ويتواصل مع المشترين نيابة عنك. رقمك يظهر لإدارة تينبو فقط ولن يراه الزوار.', 'The AqarTenpo team will review the listing, publish it and talk to buyers on your behalf. Your number is visible to AqarTenpo only, never to visitors.')}
            {f.drawings.length > 0 && <> {t('تم رفع المخطط، وستظهر الجولة 3D مع الإعلان.', 'Your plan was uploaded, so the listing will carry a 3D tour.')}</>}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={() => go('/my-listings')} className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
              {t('افتح إعلاناتي', 'Open My ads')}
            </button>
            <button onClick={() => go('/property/' + done)} className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">
              {t('عرض صفحة الإعلان', 'View listing')}
            </button>
            <button onClick={() => { setDone(null); setKindId(null); setF(EMPTY); setAs(EMPTY_AS); setAgree(false); }} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 hover:border-blue-400">
              {t('إضافة إعلان آخر', 'Add another listing')}
            </button>
          </div>
        </div>
      </div>
    );

  const label = (text: string) => <label className="mb-1.5 block text-xs font-extrabold text-slate-700">{text}</label>;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-20 text-slate-800">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">{t('أضف عقارك', 'List your property')}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{t('اختر نوع الإعلان', 'Choose your listing type')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        {t(`أربع طرق للنشر على عقار تينبو. اختر الأنسب لك ثم أكمل البيانات. صلاحية كل إعلان ${LISTING_MONTHS} أشهر.`, `Four ways to list on AqarTenpo. Choose one and complete the details. Every listing stays active for ${LISTING_MONTHS} months.`)}
      </p>

      {user?.accountType === 'company' && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs font-bold text-blue-900">
          <span>{t('رصيد إعلانات الشركة المجاني', 'Company free listing allowance')}</span>
          <span>{companyAds} / 50 {t('إعلان نشط', 'active listings')}</span>
        </div>
      )}

      {/* 4 listing options */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {KINDS.map((k, i) => {
          const Ic = k.icon;
          const on = kindId === k.id;
          return (
            <button
              type="button"
              key={k.id}
              onClick={() => setKindId(k.id)}
              className={`rise group relative rounded-[26px] p-5 text-start transition duration-300 ${
                on ? 'bg-slate-950 text-white shadow-[0_24px_50px_-24px_rgba(37,99,235,.6)] ring-2 ring-blue-500' : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:ring-blue-300'
              }`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${on ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Ic size={22} />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${on ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {lang === 'ar' ? k.badgeAr : k.badgeEn}
                </span>
              </div>
              <h3 className="mt-4 text-base font-black">{lang === 'ar' ? k.ar : k.en}</h3>
              <p className={`mt-1.5 text-xs leading-5 ${on ? 'text-slate-300' : 'text-slate-500'}`}>{lang === 'ar' ? k.dAr : k.dEn}</p>
              {on && (
                <span className="absolute end-4 bottom-4 grid h-6 w-6 place-items-center rounded-full bg-blue-500">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {kind && kind.mode === 'brokerage' && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-xs leading-6 text-blue-900 ring-1 ring-blue-200">
          <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <span>
            {t(
              'في الوساطة الحصرية تتولى عقار تينبو نشر الإعلان وفحص المستندات وإدارة العملاء وتحديد المواعيد نيابة عنك. تطبق عمولة 1.5% فقط عند إتمام البيع أو التنازل من خلال وسيط تينبو.',
              'With exclusive brokerage, AqarTenpo publishes, verifies documents, manages clients and sets viewings for you. A 1.5% fee applies only upon completed sale or assignment through our broker.'
            )}{' '}
            <b>{t('رقمك يظهر لإدارة تينبو فقط، والمشترون يتواصلون مع فريق تينبو.', 'Your number is visible to AqarTenpo only; buyers contact the AqarTenpo team.')}</b>
          </span>
        </div>
      )}

      {/* Form */}
      {kind && (
        <form onSubmit={submit} className="mt-8 space-y-8 rounded-[32px] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,.25)] ring-1 ring-slate-200 md:p-8">
          {!user && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              <span>{t('يجب تسجيل الدخول لنشر الإعلان.', 'Log in to publish your listing.')}</span>
              <button type="button" onClick={() => setAuthOpen('login')} className="rounded-full bg-slate-950 px-4 py-1.5 text-white">
                {t('تسجيل الدخول', 'Log in')}
              </button>
            </div>
          )}

          {/* Section 1 */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-950">{t('1. بيانات العقار', '1. Property details')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {label(t('عنوان الإعلان', 'Listing title'))}
                <input required className={inputCls} value={f.title} onChange={e => set('title', e.target.value)} placeholder={t('مثال: شقة 180م بجنوب الأكاديمية', 'e.g. 180m apartment in South Academy')} />
              </div>
              <div>
                {label(t('التصنيف الرئيسي', 'Main category'))}
                <select className={inputCls} value={f.category} onChange={e => { const c = TAXONOMY.find(x => x.id === e.target.value)!; set('category', c.id); set('subtype', c.items[0].id); set('type', c.items[0].type); }}>
                  {TAXONOMY.map(c => <option key={c.id} value={c.id}>{c[lang]}</option>)}
                </select>
              </div>
              <div>
                {label(t('التصنيف الفرعي', 'Subtype'))}
                <select className={inputCls} value={f.subtype} onChange={e => { const s = TAXONOMY.flatMap(c => c.items).find(x => x.id === e.target.value)!; set('subtype', s.id); set('type', s.type); }}>
                  {TAXONOMY.find(c => c.id === f.category)?.items.map(s => <option key={s.id} value={s.id}>{s[lang]}</option>)}
                </select>
              </div>
              <div>
                {label(t('الدولة', 'Country'))}
                <select className={inputCls} value={f.country} onChange={e => onCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {lang === 'ar' ? c.name : c.en}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                {label(t('المحافظة / المدينة / الحي', 'Governorate / city / area'))}
                <input
                  required
                  list="aqar-locations"
                  className={inputCls}
                  value={f.area}
                  onChange={e => set('area', e.target.value)}
                  placeholder={t('ابدأ بالكتابة واختر من القائمة (مثال: جن، رو، زايد)', 'Start typing and pick from the list (e.g. جن، رو، زايد)')}
                />
                <datalist id="aqar-locations">
                  {ALL_LOCATIONS.map(l => <option key={l.id} value={l.nameAr}>{l.cityAr}</option>)}
                </datalist>
              </div>
              <div>
                {label(t('السعر الإجمالي (ج.م)', 'Total price (EGP)'))}
                <input required type="number" min={0} className={inputCls} value={f.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                {label(t('المساحة (متر مربع)', 'Area (m²)'))}
                <input required type="number" min={1} className={inputCls} value={f.size} onChange={e => set('size', e.target.value)} />
              </div>
              <div>
                {label(t('غرف النوم', 'Bedrooms'))}
                <input type="number" min={0} className={inputCls} value={f.beds} onChange={e => set('beds', e.target.value)} />
              </div>
              <div>
                {label(t('الحمامات', 'Bathrooms'))}
                <input type="number" min={0} className={inputCls} value={f.baths} onChange={e => set('baths', e.target.value)} />
              </div>
              <div>
                {label(t('الفرش', 'Furnishing'))}
                <select className={inputCls} value={f.furnishing} onChange={e => set('furnishing', e.target.value as FormState['furnishing'])}>
                  {FURNISHING_OPTIONS.filter(o => o.id !== 'all').map(o => <option key={o.id} value={o.id}>{o[lang]}</option>)}
                </select>
              </div>
              <div>
                {label(t('حالة العقار', 'Status'))}
                <select className={inputCls} value={f.status} onChange={e => set('status', e.target.value as FormState['status'])}>
                  {STATUS_OPTIONS.filter(o => o.id !== 'all').map(o => <option key={o.id} value={o.id}>{o[lang]}</option>)}
                </select>
              </div>
              <div>
                {label(t('مستوى الوحدة', 'Floor level'))}
                <select className={inputCls} value={f.floor} onChange={e => set('floor', e.target.value as FormState['floor'])}>
                  {FLOOR_LEVELS.map(o => <option key={o.id} value={o.id}>{o[lang]}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                {label(kind?.mode === 'brokerage' ? t('رقمك (يظهر لإدارة تينبو فقط)', 'Your number (AqarTenpo admin only)') : t('رقم الهاتف للتواصل (يظهر للزوار)', 'Contact phone (shown to visitors)'))}
                <PhoneInput dial={dial} setDial={setDial} phone={phone} setPhone={setPhone} />
              </div>
            </div>
          </div>

          {/* Section 2: photos from device */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-950">{t('2. صور العقار', '2. Property photos')}</h2>
            <ImageUploader images={f.images} onChange={imgs => set('images', imgs)} folder="listing-photos" />
          </div>

          {/* Section 3: project drawings -> enables 3D */}
          <div className="space-y-3 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div>
              <h2 className="text-sm font-black text-slate-950">{t('3. رسومات المشروع (لتفعيل الجولة 3D)', '3. Project drawings (enables the 3D tour)')}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {t(
                  'الجولة ثلاثية الأبعاد تُبنى من مخطط الوحدة: يستخرج الموقع الجدران من خطوط الرسم ويحوّلها لمجسم يمكن المشي داخله. الأفضل مخطط بخطوط داكنة على خلفية بيضاء بصيغة JPG أو PNG (ليس PDF). الأبواب تظهر كفتحات. اختيارية، وبدونها لن تظهر الجولة.',
                  'The 3D tour is built from the unit plan: the site extracts the walls from the drawing lines and turns them into a model you can walk through. Best with dark lines on a white background as JPG or PNG (not PDF). Doors show as openings. Optional, and without a plan there is no tour.'
                )}
              </p>
            </div>
            <ImageUploader images={f.drawings} onChange={imgs => set('drawings', imgs)} folder="project-drawings" drawing />
          </div>

          {/* Section 4: amenities & description */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-950">{t('4. المزايا والوصف', '4. Amenities & description')}</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(am => {
                const on = f.amenities.includes(am.id);
                return (
                  <button
                    type="button"
                    key={am.id}
                    onClick={() => toggleAmenity(am.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      on ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {on && <Check size={12} />}
                    {am[lang]}
                  </button>
                );
              })}
            </div>
            <div>
              {label(t('كلمات بحث (مفصولة بفاصلة)', 'Search keywords (comma separated)'))}
              <input className={inputCls} value={f.keywords} onChange={e => set('keywords', e.target.value)} placeholder={t('مثال: شاطئ، مبرد مجاني، إطلالة بحرية', 'e.g. beach, free chiller, sea view')} />
            </div>
            <div>
              {label(t('وصف العقار', 'Description'))}
              <textarea rows={4} className={inputCls} value={f.desc} onChange={e => set('desc', e.target.value)} placeholder={t('اكتب تفاصيل العقار وتشطيباته وموقعه...', 'Describe finishes, location and features...')} />
            </div>
          </div>

          {/* Assignment fields */}
          {kind.assign && (
            <div className="space-y-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
              <h2 className="text-sm font-black text-slate-950">{t('4. بيانات التنازل وعقد التطوير', '4. Assignment & developer contract')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input required className={inputCls} placeholder={t('شركة التطوير العقاري', 'Developer name')} value={as.developer} onChange={e => setAs({ ...as, developer: e.target.value })} />
                <input required className={inputCls} placeholder={t('اسم المشروع / الكومباوند', 'Project name')} value={as.project} onChange={e => setAs({ ...as, project: e.target.value })} />
                <input required type="number" className={inputCls} placeholder={t('سعر التعاقد الأصلي', 'Original contract price')} value={as.originalPrice} onChange={e => setAs({ ...as, originalPrice: e.target.value })} />
                <input required type="number" className={inputCls} placeholder={t('المبلغ المدفوع كاش', 'Cash paid so far')} value={as.paidCash} onChange={e => setAs({ ...as, paidCash: e.target.value })} />
                <input required type="number" className={inputCls} placeholder={t('إجمالي الأقساط المتبقية', 'Remaining installments total')} value={as.remaining} onChange={e => setAs({ ...as, remaining: e.target.value })} />
                <input required type="number" className={inputCls} placeholder={t('قيمة القسط', 'Installment amount')} value={as.installment} onChange={e => setAs({ ...as, installment: e.target.value })} />
                <select className={inputCls} value={as.period} onChange={e => setAs({ ...as, period: e.target.value as 'monthly' | 'quarterly' })}>
                  <option value="monthly">{t('سداد شهري', 'Monthly')}</option>
                  <option value="quarterly">{t('سداد ربع سنوي', 'Quarterly')}</option>
                </select>
                <input required className={inputCls} placeholder={t('تاريخ الاستلام (مثال: 2027-Q4)', 'Handover date (e.g. 2027-Q4)')} value={as.handover} onChange={e => setAs({ ...as, handover: e.target.value })} />
                <input type="number" className={inputCls + ' sm:col-span-2'} placeholder={t('بريميوم / زيادة (اختياري)', 'Premium (optional)')} value={as.premium} onChange={e => setAs({ ...as, premium: e.target.value })} />
              </div>
            </div>
          )}

          {kind.mode === 'brokerage' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" />
              <span className="text-xs font-semibold leading-6 text-blue-900">
                {t(
                  'أوافق على تفويض عقار تينبو كوسيط رسمي لهذا العقار، وعلى عمولة الوساطة بنسبة 1.5% تُستحق حصراً عند إتمام البيع أو التنازل.',
                  'I authorize AqarTenpo as the official broker for this property and accept a 1.5% commission due only upon completed sale or assignment.'
                )}
              </span>
            </label>
          )}

          {err && <p className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 ring-1 ring-rose-200">{err}</p>}

          <button
            disabled={busy || companyFull}
            className="w-full rounded-full bg-slate-950 py-4 text-sm font-black text-white shadow-[0_18px_36px_-16px_rgba(15,23,42,.6)] transition hover:bg-blue-600 disabled:opacity-60"
          >
            {companyFull ? t('اكتمل الحد المجاني', 'Free listing limit reached') : busy ? t('جاري النشر...', 'Publishing...') : t('نشر الإعلان', 'Publish listing')}
          </button>
        </form>
      )}
    </div>
  );
}
