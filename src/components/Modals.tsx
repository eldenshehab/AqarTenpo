import { useState, type ReactNode } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User as UserIcon, Calendar, CheckCircle2, GitCompare, Building2, BadgeCheck } from 'lucide-react';
import { api, useApp, LISTING_MONTHS } from '../store';
import { COUNTRIES, fmt, TYPES } from '../data';
import { PropertyImage, Price } from './Common';

export function Modal({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[140] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`modal-in relative max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl ${
          wide ? 'max-w-4xl' : 'max-w-md'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition';

export function PhoneInput({
  dial,
  setDial,
  phone,
  setPhone,
}: {
  dial: string;
  setDial: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  const { lang } = useApp();
  return (
    <div className="flex gap-2" dir="ltr">
      <select
        value={dial}
        onChange={e => setDial(e.target.value)}
        className="w-32 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
      >
        {COUNTRIES.map(c => (
          <option key={c.code} value={c.dial}>
            {c.flag} {c.dial} {lang === 'ar' ? c.name : c.en}
          </option>
        ))}
      </select>
      <input
        value={phone}
        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
        placeholder="1001234567"
        className={inputCls}
      />
    </div>
  );
}

export function AuthModal() {
  const { authOpen, setAuthOpen, signUp, signIn, signInGoogle, cloudEnabled, t } = useApp();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', email: '', pass: '' });
  const [accountType, setAccountType] = useState<'individual' | 'company' | 'broker'>('individual');
  const [company, setCompany] = useState({ name: '', registration: '', office: '', license: '' });
  const [dial, setDial] = useState('+20');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  if (!authOpen) return null;
  const signup = authOpen === 'signup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setNotice('');
    if (!/\S+@\S+\.\S+/.test(f.email)) return setErr(t('بريد إلكتروني غير صالح', 'Invalid email'));
    if (f.pass.length < 6)
      return setErr(t('كلمة المرور 6 أحرف على الأقل', 'Password must be 6+ characters'));
    if (signup && !f.name) return setErr(t('أدخل الاسم', 'Enter your name'));
    if (signup && accountType === 'company' && (!company.name.trim() || !company.registration.trim()))
      return setErr(t('أدخل اسم الشركة ورقم السجل التجاري', 'Enter your company name and registration number'));
    if (signup && accountType === 'broker' && (!company.office.trim() || !company.license.trim()))
      return setErr(t('أدخل اسم المكتب ورقم الرخصة', 'Enter the office name and license number'));
    const email = f.email.trim().toLowerCase();
    setBusy(true);
    try {
      if (signup) {
        const result = await signUp({
          email, password: f.pass, name: f.name || email.split('@')[0], phone: phone ? dial + phone : undefined,
          accountType, companyName: accountType === 'company' ? company.name.trim() : undefined,
          commercialRegistration: accountType === 'company' ? company.registration.trim() : undefined,
          office: accountType === 'broker' ? company.office.trim() : undefined,
          license: accountType === 'broker' ? company.license.trim() : undefined,
          bio: accountType === 'broker' ? t('وسيط مسجل على عقار تينبو', 'Broker registered on AqarTenpo') : undefined,
        });
        if (result.confirmationRequired) {
          setNotice(t('تم إنشاء الحساب. افتح رسالة التأكيد في بريدك ثم سجل الدخول.', 'Account created. Confirm the email we sent, then log in.'));
          return;
        }
      } else {
        await signIn(email, f.pass);
      }
      setAuthOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setErr(
        message.includes('Invalid login') || message === 'INVALID_CREDENTIALS'
          ? t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Incorrect email or password')
          : message === 'EMAIL_EXISTS'
          ? t('هذا البريد مسجل بالفعل', 'This email is already registered')
          : t('تعذر إتمام التسجيل. تحقق من البيانات وإعدادات الخدمة.', 'Authentication failed. Check the details and service configuration.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => setAuthOpen(false)}>
      <h2 className="text-2xl font-black text-slate-900">
        {signup ? t('إنشاء حساب جديد', 'Create account') : t('مرحباً بعودتك', 'Welcome back')}
      </h2>
      <p className="mb-5 text-xs text-slate-500">{t('انضم إلى منصة عقار تينبو الرقمية', 'Join AqarTenpo Real Estate')}</p>

      {!cloudEnabled && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800 ring-1 ring-amber-200">
          {t('هذا الجهاز فقط: الحساب الذي تنشئه هنا لن يفتح من هاتف آخر، وإعلاناتك لن يراها غيرك. أضف مفاتيح Supabase في Vercel لتفعيل الحسابات الحقيقية وجوجل.', 'Device-only mode: an account created here will not open on another phone, and your listings stay private to this browser. Add the Supabase keys in Vercel to enable real accounts and Google.')}
        </p>
      )}

      {signup && (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {([
            ['individual', t('فرد', 'Individual'), UserIcon],
            ['company', t('شركة · 50 إعلان', 'Company · 50 ads'), Building2],
            ['broker', t('وسيط', 'Broker'), BadgeCheck],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${
                accountType === value ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {signup && accountType === 'company' && (
        <div className="mb-4 rounded-2xl border border-white/15 bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2 text-sm font-black">
            <BadgeCheck size={17} className="text-slate-300" />
            {t('باقة الشركات: 50 إعلان مجاني', 'Company launch offer: 50 free listings')}
          </div>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            {t(`حتى 50 إعلاناً نشطاً مجاناً. تنتهي صلاحية كل إعلان بعد ${LISTING_MONTHS} أشهر.`, `Up to 50 active ads at no charge. Each listing expires after ${LISTING_MONTHS} months.`)}
          </p>
        </div>
      )}

      {/* Google Login Button */}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!cloudEnabled) {
            setErr(t(
              'تسجيل جوجل يتطلب ربط مفاتيح VITE_SUPABASE_ في Vercel أولاً. للمعاينة الحالية يمكنك استخدام البريد.',
              'Google Sign-In requires Supabase keys in Vercel. For local preview, please sign in with email.'
            ));
            return;
          }
          if (signup && accountType !== 'individual') {
            setErr(t('أنشئ حساب الشركة أو الوسيط بالبريد وكلمة المرور أولاً.', 'Create company or broker accounts with email first.'));
            return;
          }
          setBusy(true);
          setErr('');
          try {
            await signInGoogle();
          } catch (e) {
            const m = e instanceof Error ? e.message : String(e);
            setErr(t(`فشل بدء تسجيل الدخول بـ Google: ${m}`, `Google Sign-In failed: ${m}`));
            setBusy(false);
          }
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
          />
        </svg>
        <span>{t('المتابعة باستخدام Google', 'Continue with Google')}</span>
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>{t('أو عبر البريد الإلكتروني', 'or with email')}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        {signup && (
          <div className="relative">
            <UserIcon className="absolute top-3.5 start-3 text-slate-400" size={18} />
            <input
              placeholder={t('الاسم الكامل', 'Full name')}
              className={inputCls + ' ps-10'}
              value={f.name}
              onChange={e => setF({ ...f, name: e.target.value })}
            />
          </div>
        )}
        {signup && accountType === 'company' && (
          <>
            <div className="relative">
              <Building2 className="absolute top-3.5 start-3 text-slate-400" size={18} />
              <input
                required
                placeholder={t('اسم الشركة / المكتب العقاري', 'Company / agency name')}
                className={inputCls + ' ps-10'}
                value={company.name}
                onChange={e => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <input
              required
              placeholder={t('رقم السجل التجاري', 'Commercial registration number')}
              className={inputCls}
              value={company.registration}
              onChange={e => setCompany({ ...company, registration: e.target.value })}
            />
          </>
        )}
        {signup && accountType === 'broker' && (
          <>
            <input required placeholder={t('اسم المكتب', 'Office name')} className={inputCls} value={company.office} onChange={e => setCompany({ ...company, office: e.target.value })} />
            <input required placeholder={t('رقم الرخصة', 'License number')} className={inputCls} value={company.license} onChange={e => setCompany({ ...company, license: e.target.value })} />
          </>
        )}
        <div className="relative">
          <Mail className="absolute top-3.5 start-3 text-slate-400" size={18} />
          <input
            type="email"
            placeholder={t('البريد الإلكتروني', 'Email')}
            className={inputCls + ' ps-10'}
            value={f.email}
            onChange={e => setF({ ...f, email: e.target.value })}
          />
        </div>
        {signup && <PhoneInput dial={dial} setDial={setDial} phone={phone} setPhone={setPhone} />}
        <div className="relative">
          <Lock className="absolute top-3.5 start-3 text-slate-400" size={18} />
          <input
            type={show ? 'text' : 'password'}
            placeholder={t('كلمة المرور', 'Password')}
            className={inputCls + ' px-10'}
            value={f.pass}
            onChange={e => setF({ ...f, pass: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute top-3.5 end-3 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {err && <p className="text-xs font-bold text-rose-500">{err}</p>}
        {notice && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{notice}</p>}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
        >
          {busy ? '...' : signup ? t('إنشاء الحساب', 'Create account') : t('دخول', 'Log in')}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        {signup ? t('لديك حساب بالفعل؟', 'Have an account?') : t('ليس لديك حساب؟', 'No account?')}{' '}
        <button
          onClick={() => {
            setErr('');
            setAuthOpen(signup ? 'login' : 'signup');
          }}
          className="font-bold text-blue-600 hover:underline"
        >
          {signup ? t('تسجيل الدخول', 'Log in') : t('حساب جديد', 'Sign up')}
        </button>
      </p>
    </Modal>
  );
}

export function ScheduleTourModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, user } = useApp();
  const [f, setF] = useState({ name: user?.name || '', date: '', time: '10:00', note: '' });
  const [dial, setDial] = useState('+20');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);

  return (
    <Modal onClose={onClose}>
      {done ? (
        <div className="py-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h3 className="mt-3 text-xl font-bold text-slate-900">
            {t('تم حجز موعد المعاينة بنجاح!', 'Tour booked successfully!')}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t('سيتواصل معك فريق الوساطة أو المالك لتأكيد الموعد.', 'The broker or owner will contact you shortly.')}
          </p>
        </div>
      ) : (
        <form
          onSubmit={async e => {
            e.preventDefault();
            await api.bookTour({ id, ...f, phone: dial + phone });
            setDone(true);
          }}
          className="space-y-3.5"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar size={18} />
            </span>
            <span>{t('حجز موعد معاينة', 'Schedule a tour')}</span>
          </h2>
          <input
            required
            placeholder={t('الاسم', 'Name')}
            className={inputCls}
            value={f.name}
            onChange={e => setF({ ...f, name: e.target.value })}
          />
          <PhoneInput dial={dial} setDial={setDial} phone={phone} setPhone={setPhone} />
          <div className="flex gap-2">
            <input
              required
              type="date"
              className={inputCls}
              value={f.date}
              onChange={e => setF({ ...f, date: e.target.value })}
            />
            <input
              type="time"
              className={inputCls}
              value={f.time}
              onChange={e => setF({ ...f, time: e.target.value })}
            />
          </div>
          <textarea
            placeholder={t('أي ملاحظات أو استفسار خاص...', 'Any notes or questions...')}
            className={inputCls}
            rows={2}
            value={f.note}
            onChange={e => setF({ ...f, note: e.target.value })}
          />
          <button className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition">
            {t('تأكيد حجز المعاينة', 'Confirm Tour Booking')}
          </button>
        </form>
      )}
    </Modal>
  );
}

export function CompareModal({ onClose }: { onClose: () => void }) {
  const { compare, listings, lang, t } = useApp();
  const ps = listings.filter(p => compare.includes(p.id));
  const rows: [string, (p: typeof ps[0]) => ReactNode][] = [
    [t('السعر', 'Price'), p => <Price p={p} />],
    [t('النوع', 'Type'), p => TYPES.find(x => x.id === p.type)?.[lang] || p.type],
    [t('المدينة / الحي', 'Location'), p => p.locationArea || (lang === 'ar' ? p.city : p.cityEn)],
    [t('المساحة', 'Area'), p => fmt(p.area, lang) + ' m²'],
    [t('سعر المتر', 'Price/m²'), p => fmt(Math.round(p.price / p.area), lang) + ' EGP'],
    [t('الفرش', 'Furnishing'), p => p.furnishing === 'furnished' ? t('مفروش', 'Furnished') : p.furnishing === 'semi_furnished' ? t('مفروش جزئياً', 'Semi-Furnished') : t('غير مفروش', 'Unfurnished')],
    [t('حالة العقار', 'Status'), p => p.status === 'ready' ? t('جاهز للاستلام', 'Ready') : t('تحت الإنشاء', 'Under Construction')],
    [t('الغرف', 'Beds'), p => p.beds || '—'],
    [t('الحمامات', 'Baths'), p => p.baths || '—'],
    [t('سنة البناء / التسليم', 'Year'), p => p.year],
  ];

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <GitCompare size={18} />
        </span>
        <h2 className="text-xl font-black text-slate-900">
          {t('مقارنة العقارات المحددة', 'Compare Selected Properties')}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-start font-bold text-slate-400">{t('المواصفات', 'Features')}</th>
              {ps.map(p => (
                <th key={p.id} className="p-2 text-start font-bold text-slate-800 min-w-[180px]">
                  <PropertyImage src={p.images[0]} alt="" className="h-28 rounded-2xl mb-2" />
                  <p className="line-clamp-2">{lang === 'ar' ? p.title : p.titleEn}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([l, f]) => (
              <tr key={l} className="hover:bg-slate-50 transition">
                <td className="p-2.5 font-bold text-slate-500">{l}</td>
                {ps.map(p => (
                  <td key={p.id} className="p-2.5 font-bold text-slate-800">
                    {f(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export function ComparisonBar() {
  const { compare, clearCompare, t } = useApp();
  const [open, setOpen] = useState(false);
  if (!compare.length) return null;

  return (
    <>
      <div className="fade-up fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 text-slate-800 shadow-2xl backdrop-blur-md">
        <span className="text-xs font-bold text-slate-600">
          {t('محدد للمقارنة', 'Selected')}: <b className="text-blue-600">{compare.length}</b>/3
        </span>
        <button
          disabled={compare.length < 2}
          onClick={() => setOpen(true)}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 transition"
        >
          {t('قارن الآن', 'Compare')}
        </button>
        <button
          onClick={clearCompare}
          title={t('مسح', 'Clear')}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X size={16} />
        </button>
      </div>
      {open && <CompareModal onClose={() => setOpen(false)} />}
    </>
  );
}
