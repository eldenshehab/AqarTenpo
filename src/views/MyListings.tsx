import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FilePenLine,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp, LISTING_DAYS, LISTING_MONTHS } from '../store';
import { fmt, TYPES, type Property, type PType } from '../data';
import { inputCls, Modal } from '../components/Modals';
import { PropertyImage, Price } from '../components/Common';
import { ImageUploader } from '../components/ImageUploader';

function expiryLabel(expiresAt: number, t: (ar: string, en: string) => string, lang: string) {
  const remaining = Math.max(0, expiresAt - Date.now());
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  const date = new Date(expiresAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  return { days, date, text: days === 0 ? t('ينتهي اليوم', 'Expires today') : t(`متبقي ${days} يوم`, `${days} days left`) };
}

function EditListingModal({
  property,
  onClose,
  onSave,
}: {
  property: Property;
  onClose: () => void;
  onSave: (p: Property) => Promise<Property>;
}) {
  const { t, lang } = useApp();
  const [draft, setDraft] = useState({
    title: property.title,
    location: property.locationArea || property.city,
    type: property.type,
    price: String(property.price),
    area: String(property.area),
    beds: String(property.beds),
    baths: String(property.baths),
    phone: property.phone,
    desc: property.desc,
    images: property.images,
    drawings: property.projectDrawings || [],
  });
  const [assignment, setAssignment] = useState(property.assignment ? { ...property.assignment } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof typeof draft, value: string | string[] | PType) => setDraft(prev => ({ ...prev, [key]: value }));

  return (
    <Modal onClose={onClose} wide>
      <div className="mb-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[.25em] text-slate-500">{t('إدارة الإعلان', 'Listing management')}</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{t('تعديل بيانات العقار', 'Edit property details')}</h2>
      </div>
      <form
        onSubmit={async e => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const updated: Property = {
            ...property,
            title: draft.title,
            titleEn: draft.title,
            locationArea: draft.location,
            locationAreaEn: draft.location,
            city: draft.location,
            cityEn: draft.location,
            type: draft.type,
            price: +draft.price,
            area: +draft.area,
            beds: +draft.beds || 0,
            baths: +draft.baths || 0,
            phone: draft.phone.replace(/\D/g, ''),
            desc: draft.desc,
            images: draft.images,
            projectDrawings: draft.drawings,
            pricePerMeter: +draft.area ? Math.round(+draft.price / +draft.area) : 0,
            ...(assignment ? { assignment } : {}),
          };
          try {
            await onSave(updated);
            onClose();
          } catch {
            setError(t('تعذر حفظ التعديلات. قلل حجم الصور وحاول مجدداً.', 'Could not save changes. Reduce photo size and try again.'));
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            {t('عنوان الإعلان', 'Listing title')}
            <input required className={inputCls + ' mt-1'} value={draft.title} onChange={e => set('title', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            {t('المحافظة / المدينة / المنطقة', 'Governorate / city / area')}
            <input required className={inputCls + ' mt-1'} value={draft.location} onChange={e => set('location', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            {t('نوع العقار', 'Property type')}
            <select className={inputCls + ' mt-1'} value={draft.type} onChange={e => set('type', e.target.value as PType)}>
              {TYPES.map(type => <option key={type.id} value={type.id}>{type[lang]}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            {t('السعر بالجنيه', 'Price in EGP')}
            <input required type="number" min={0} className={inputCls + ' mt-1'} value={draft.price} onChange={e => set('price', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            {t('المساحة م²', 'Area m²')}
            <input required type="number" min={1} className={inputCls + ' mt-1'} value={draft.area} onChange={e => set('area', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            {t('غرف النوم', 'Bedrooms')}
            <input type="number" min={0} className={inputCls + ' mt-1'} value={draft.beds} onChange={e => set('beds', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            {t('الحمامات', 'Bathrooms')}
            <input type="number" min={0} className={inputCls + ' mt-1'} value={draft.baths} onChange={e => set('baths', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            {t('رقم الهاتف', 'Phone number')}
            <input dir="ltr" required className={inputCls + ' mt-1'} value={draft.phone} onChange={e => set('phone', e.target.value)} />
          </label>
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            {t('وصف العقار', 'Property description')}
            <textarea rows={3} className={inputCls + ' mt-1'} value={draft.desc} onChange={e => set('desc', e.target.value)} />
          </label>
        </div>

        {assignment && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-xs font-black">{t('بيانات التنازل', 'Assignment details')}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder={t('المطور العقاري', 'Developer')} value={assignment.developer} onChange={e => setAssignment({ ...assignment, developer: e.target.value })} />
              <input className={inputCls} placeholder={t('اسم المشروع', 'Project')} value={assignment.project} onChange={e => setAssignment({ ...assignment, project: e.target.value })} />
              <input type="number" className={inputCls} placeholder={t('السعر الأصلي', 'Original price')} value={assignment.originalPrice} onChange={e => setAssignment({ ...assignment, originalPrice: +e.target.value })} />
              <input type="number" className={inputCls} placeholder={t('الكاش المدفوع', 'Cash paid')} value={assignment.paidCash} onChange={e => setAssignment({ ...assignment, paidCash: +e.target.value })} />
              <input type="number" className={inputCls} placeholder={t('الأقساط المتبقية', 'Remaining installments')} value={assignment.remaining} onChange={e => setAssignment({ ...assignment, remaining: +e.target.value })} />
              <input type="number" className={inputCls} placeholder={t('قيمة القسط', 'Installment amount')} value={assignment.installment} onChange={e => setAssignment({ ...assignment, installment: +e.target.value })} />
              <input className={inputCls} placeholder={t('تاريخ التسليم', 'Handover date')} value={assignment.handover} onChange={e => setAssignment({ ...assignment, handover: e.target.value })} />
              <select className={inputCls} value={assignment.period} onChange={e => setAssignment({ ...assignment, period: e.target.value as 'monthly' | 'quarterly' })}>
                <option value="monthly">{t('شهري', 'Monthly')}</option>
                <option value="quarterly">{t('ربع سنوي', 'Quarterly')}</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-black">{t('صور الإعلان', 'Listing photos')}</h3>
          <ImageUploader images={draft.images} onChange={images => set('images', images)} folder="listing-photos" />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <h3 className="text-xs font-black">{t('رسومات المشروع (تفعّل الجولة 3D)', 'Project drawings (enables 3D)')}</h3>
          <p className="mb-2 mt-1 text-[11px] leading-5 text-slate-500">{t('أضف مخطط المسطح أو رسم الوحدة ليظهر تبويب الجولة 3D في الإعلان. حذف كل الرسومات يلغي الجولة.', 'Add the floor plan or unit drawing to show the 3D tour tab. Removing all drawings disables the tour.')}</p>
          <ImageUploader images={draft.drawings} onChange={drawings => set('drawings', drawings)} folder="project-drawings" drawing />
        </div>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="flex-1 rounded-full bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-50">
            {busy ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save changes')}
          </button>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700">
            {t('إلغاء', 'Cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MyListings() {
  const { t, lang, user, listings, go, setAuthOpen, editListing, removeListing } = useApp();
  const [editing, setEditing] = useState<Property | null>(null);
  const [busyId, setBusyId] = useState('');
  const owned = useMemo(() => user ? listings.filter(p => p.ownerId === user.id) : [], [user, listings]);
  const totalViews = owned.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalPhoneViews = owned.reduce((sum, p) => sum + (p.phoneViews || 0), 0);
  const remaining = user?.accountType === 'company' ? Math.max(0, 50 - owned.length) : null;

  if (!user) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-4 pt-28 text-center">
        <div className="max-w-md">
          <BarChart3 size={42} className="mx-auto text-slate-500" />
          <h1 className="mt-4 text-3xl font-black text-slate-950">{t('إعلاناتي', 'My listings')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('سجل الدخول لإدارة إعلاناتك ومتابعة المشاهدات.', 'Log in to manage your listings and track views.')}</p>
          <button onClick={() => setAuthOpen('login')} className="mt-5 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">
            {t('تسجيل الدخول', 'Log in')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-4 pt-28 pb-20 text-slate-800">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.25em] text-slate-500">{t('لوحة البائع', 'Seller dashboard')}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{t('إعلاناتي', 'My listings')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.accountType === 'company' ? `${user.companyName || user.name} · ${t('حساب شركة', 'Company account')}` : user.name}
          </p>
        </div>
        <button onClick={() => go('/sell')} className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
          <Plus size={16} />{t('إضافة إعلان', 'Add listing')}
        </button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={CheckCircle2} label={t('إعلانات نشطة', 'Active listings')} value={String(owned.length)} />
        <Metric icon={Eye} label={t('مرات المشاهدة', 'Listing views')} value={fmt(totalViews, lang)} />
        <Metric icon={Phone} label={t('مشاهدات الهاتف', 'Phone reveals')} value={fmt(totalPhoneViews, lang)} />
        <Metric icon={CalendarClock} label={t('مدة الإعلان', 'Listing duration')} value={t(`${LISTING_MONTHS} أشهر`, `${LISTING_MONTHS} months`)} hint={remaining !== null ? `${remaining} ${t('إعلاناً مجانياً متبقياً', 'free ads remaining')}` : t('يتجدد بعد الحذف أو الانتهاء', 'Slots reopen after expiry or deletion')} />
      </div>

      {user.accountType === 'company' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-950 p-4 text-white">
          <div>
            <p className="text-sm font-black">{t('عرض الشركة: 50 إعلاناً مجانياً', 'Company offer: 50 free listings')}</p>
            <p className="mt-1 text-xs text-slate-400">{t(`رصيدك محسوب على الإعلانات النشطة، وكل إعلان ينتهي بعد ${LISTING_MONTHS} أشهر (${LISTING_DAYS} يوماً).`, `Allowance counts active listings; each expires after ${LISTING_MONTHS} months (${LISTING_DAYS} days).`)}</p>
          </div>
          <div className="text-end">
            <p className="text-2xl font-black">{owned.length}<span className="text-sm text-slate-400"> / 50</span></p>
            <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-slate-400 to-white" style={{ width: `${Math.min(100, owned.length * 2)}%` }} /></div>
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-xl font-black text-slate-950">{t('إعلاناتك المنشورة', 'Published listings')}</h2>
        <span className="text-xs font-bold text-slate-500">{owned.length} {t('إعلان', 'listings')}</span>
      </div>

      {owned.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <FilePenLine size={38} className="mx-auto text-slate-400" />
          <h3 className="mt-3 text-lg font-black text-slate-950">{t('لسه ما نشرتش أي إعلان', 'No listings yet')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('أضف عقارك وابدأ بمتابعة المشاهدات والتواصل.', 'Publish a property and start tracking views and phone interest.')}</p>
          <button onClick={() => go('/sell')} className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white">{t('أضف أول إعلان', 'Add your first listing')}</button>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {owned.map(p => {
            const expiry = expiryLabel(p.expiresAt || (p.createdAt || Date.now()) + LISTING_DAYS * 24 * 60 * 60 * 1000, t, lang);
            return (
              <article key={p.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm md:flex md:gap-4">
                <button onClick={() => go('/property/' + p.id)} className="block w-full shrink-0 overflow-hidden rounded-[20px] text-start md:w-52">
                  <PropertyImage src={p.images[0]} alt={p.title} className="h-48 md:h-full md:min-h-48" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col p-2 md:py-2 md:pe-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {p.assignment ? t('تنازل عن عقد', 'Assignment') : TYPES.find(x => x.id === p.type)?.[lang]}
                        {p.reviewStatus === 'pending' && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-800">{t('قيد المراجعة', 'Pending review')}</span>}
                        {p.reviewStatus === 'rejected' && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] text-rose-700">{t('مرفوض', 'Rejected')}</span>}
                        {p.reviewStatus === 'approved' && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] text-emerald-700">{t('منشور', 'Live')}</span>}
                        {p.projectDrawings?.length ? <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">3D · {p.projectDrawings.length}</span> : <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{t('بدون 3D', 'No 3D')}</span>}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-base font-black text-slate-950">{p.title}</h3>
                      <p className="mt-1 text-sm font-extrabold text-slate-300"><Price p={p} /></p>
                    </div>
                    <button onClick={() => go('/property/' + p.id)} title={t('فتح الإعلان', 'Open listing')} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Eye size={16} /></button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniMetric icon={Eye} label={t('مشاهدة', 'Views')} value={fmt(p.views || 0, lang)} />
                    <MiniMetric icon={Phone} label={t('الهاتف', 'Phone')} value={fmt(p.phoneViews || 0, lang)} />
                    <MiniMetric icon={Clock3} label={expiry.text} value={expiry.date} />
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <button onClick={() => setEditing(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
                      <FilePenLine size={14} />{t('تعديل', 'Edit')}
                    </button>
                    <button
                      disabled={busyId === p.id}
                      onClick={async () => {
                        if (!confirm(t('هل أنت متأكد من حذف هذا الإعلان؟', 'Delete this listing?'))) return;
                        setBusyId(p.id);
                        try { await removeListing(p.id); } finally { setBusyId(''); }
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-500 disabled:opacity-50"
                    >
                      <Trash2 size={14} />{t('حذف', 'Delete')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && <EditListingModal property={editing} onClose={() => setEditing(null)} onSave={editListing} />}
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof Eye; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <Icon size={16} className="text-slate-300" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-2 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><Icon size={11} /><span className="truncate">{label}</span></div>
      <p className="mt-1 truncate text-[10px] font-black text-slate-900">{value}</p>
    </div>
  );
}