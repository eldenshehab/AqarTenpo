import { useMemo, useState, type ReactNode } from 'react';
import { Bell, Building2, Handshake, MapPinned, MessageSquareText, Scale, Search, ShieldCheck, Sparkles, TrendingDown, Users } from 'lucide-react';
import { useApp } from '../store';
import { fmt } from '../data';
import { AREAS, BROKERS, currencyOf, listingCategory, listingSubtype, marketRows, matchesParsed, parseRequest, TAXONOMY, type ParsedRequest } from '../catalog';
import { addLead, readBox, writeBox, useBox, type CollabPost, type Lead, type SavedSearch } from '../localbox';
import { PropertyCard } from '../components/Common';

function Page({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <div className="mx-auto min-h-[70vh] max-w-7xl px-4 pb-20 pt-28 text-slate-800"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-700">{kicker}</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{title}</h1>{children}</div>;
}

export function MarketCenter() {
  const { t, lang, listings } = useApp();
  const rows = useMemo(() => marketRows(listings.filter(p => p.reviewStatus === 'approved')), [listings]);
  const max = Math.max(...rows.map(r => r.avg), 1);
  return (
    <Page kicker={t('مركز المعلومات', 'Market desk')} title={t('أسعار العرض، لا أسعار الصفقات', 'Asking prices, not completed-sale prices')}>
      <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-950"><ShieldCheck className="mb-1 text-blue-700" />{t('المتوسطات هنا محسوبة من أسعار الإعلانات المعروضة على المنصة فقط. لا نملك بيانات صفقات بيع فعلية، لذلك لا تُقرأ هذه الأرقام على أنها سعر السوق المنفذ.', 'These averages come only from asking prices listed on the platform. We do not have completed transaction data, so they must not be read as prices actually paid.')}</div>
      <div className="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3 text-start">{t('المنطقة / الكمبوند', 'Area / compound')}</th><th>{t('إعلانات البيع', 'Sale ads')}</th><th>{t('متوسط سعر عرض المتر', 'Avg. asking price / m²')}</th><th>{t('النطاق', 'Range')}</th><th>{t('تغير العرض', 'Asking-price change')}</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.name} className="border-t border-slate-100"><td className="p-3 font-black">{r.name}</td><td className="text-center">{r.count}</td><td className="px-3"><div className="font-black">{fmt(Math.round(r.avg), lang)} {r.currency[lang]}</div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${r.avg / max * 100}%` }} /></div></td><td className="text-center text-xs">{fmt(Math.round(r.min), lang)} – {fmt(Math.round(r.max), lang)}</td><td className={`text-center font-black ${r.change < 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{r.change ? `${r.change > 0 ? '+' : ''}${Math.round(r.change * 100)}%` : '—'}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">{t('تغير العرض يقارن أول وآخر سعر معلن لنفس الإعلان، وليس سعر بيع تم توثيقه.', 'The change compares the first and latest asking price of the same listing, not a documented sale price.')}</p>
    </Page>
  );
}

export function AreaIndex() {
  const { t, go } = useApp();
  return <Page kicker={t('اكتشف المنطقة', 'Discover the area')} title={t('ابدأ بالتجمع وأكتوبر', 'Start with New Cairo and October')}><div className="mt-6 grid gap-4 md:grid-cols-2">{AREAS.map(a => <button key={a.slug} onClick={() => go('/area/' + a.slug)} className="overflow-hidden rounded-[28px] bg-white text-start ring-1 ring-slate-200"><img src={a.cover} alt="" className="h-52 w-full object-cover" /><div className="p-5"><h2 className="text-2xl font-black">{t(a.nameAr, a.nameEn)}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{a.about}</p></div></button>)}</div></Page>;
}

export function AreaPage({ slug }: { slug: string }) {
  const { t, lang, listings, go } = useApp();
  const area = AREAS.find(a => a.slug === slug);
  if (!area) return <Page kicker="" title={t('المنطقة غير متاحة بعد', 'Area guide not available yet')}><p className="mt-3">{t('الإطلاق بدأ بالتجمع وأكتوبر.', 'Launch starts with New Cairo and October.')}</p></Page>;
  const items = listings.filter(p => p.reviewStatus === 'approved' && area.keys.some(k => `${p.city} ${p.locationArea || ''} ${p.compound || ''}`.includes(k)));
  const sale = items.filter(p => p.deal === 'sale' && p.area);
  const avg = sale.length ? sale.reduce((s, p) => s + p.price / p.area, 0) / sale.length : 0;
  return (
    <div className="pb-20 pt-24 text-slate-800">
      <div className="relative h-72 overflow-hidden"><img src={area.cover} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" /><div className="absolute bottom-6 mx-auto w-full max-w-7xl px-4 text-white"><p className="text-xs font-bold">{t('دليل منطقة', 'Area guide')}</p><h1 className="text-4xl font-black">{t(area.nameAr, area.nameEn)}</h1></div></div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-600">{area.about}</p>
          <div className="grid gap-3 sm:grid-cols-3">{[listingCategory, listingSubtype].length && TAXONOMY.filter(c => items.some(p => p.category === c.id)).map(c => <div key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="font-black">{c[lang]}</p><p className="text-xs text-slate-500">{c.items.filter(s => items.some(p => p.subtype === s.id)).map(s => s[lang]).join(' · ') || t('لا توجد وحدات حالياً', 'No units yet')}</p></div>)}</div>
          <h2 className="text-2xl font-black">{t('المتاح للبيع والإيجار', 'Available to buy and rent')}</h2>
          <div className="grid gap-5 md:grid-cols-2">{items.map(p => <PropertyCard key={p.id} p={p} />)}</div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200"><p className="text-xs font-bold text-slate-500">{t('متوسط سعر عرض المتر', 'Average asking price / m²')}</p><p className="text-2xl font-black">{avg ? fmt(Math.round(avg), lang) + ' ' + currencyOf(sale[0])[lang] : '—'}</p><p className="mt-1 text-[11px] text-slate-500">{t('من الإعلانات فقط، وليس سعر بيع فعلي.', 'From listings only, not a completed sale price.')}</p></div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200"><h3 className="font-black">{t('الخدمات', 'Services')}</h3>{area.services.map(s => <p key={s} className="mt-2 text-sm text-slate-600">• {s}</p>)}</div>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200"><h3 className="font-black">{t('المسافات التقريبية', 'Approximate distances')}</h3>{area.roads.map(r => <p key={r.name} className="mt-2 text-sm"><b>{r.name}</b><span className="block text-slate-500">{r.distance}</span></p>)}<button onClick={() => go('/areas')} className="mt-4 text-sm font-bold text-blue-700">{t('كل أدلة المناطق', 'All area guides')}</button></div>
        </aside>
      </div>
    </div>
  );
}

export function Assistant() {
  const { t, listings } = useApp();
  const [text, setText] = useState('عايز شقة 150 متر في التجمع، استلام فوري، ومقدم مليون جنيه');
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const matches = parsed ? listings.filter(p => p.reviewStatus === 'approved' && matchesParsed(p, parsed)) : [];
  return (
    <Page kicker={t('المساعد العقاري', 'Property assistant')} title={t('اكتب طلبك كما تقوله', 'Write the request as you would say it')}>
      <form onSubmit={e => { e.preventDefault(); setParsed(parseRequest(text)); }} className="mt-5 rounded-[28px] bg-white p-3 ring-1 ring-slate-200">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} className="w-full resize-none px-3 py-2 text-sm outline-none" />
        <button className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white"><Search size={14} className="inline" /> {t('حوّل الطلب لنتائج', 'Turn this into results')}</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">{['عايز فيلا في أكتوبر بحد أقصى 10 ملايين', 'عايز شقة بالتجمع بمقدم مليون جنيه'].map(s => <button key={s} onClick={() => { setText(s); setParsed(parseRequest(s)); }} className="rounded-full bg-white px-3 py-1.5 font-bold ring-1 ring-slate-200">{s}</button>)}</div>
      {parsed && <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]"><div className="rounded-3xl bg-blue-50 p-4 text-sm text-blue-950"><Sparkles size={16} />{parsed.missing.map(m => <p key={m} className="mt-2">• {m}</p>)}{parsed.notes.map(m => <p key={m} className="mt-2">• {m}</p>)}{!parsed.missing.length && <p className="mt-2">{t('كل الشروط المذكورة لها مقابل في الفلاتر.', 'Every stated condition mapped to a filter.')}</p>}</div><div>{matches.length ? <div className="grid gap-4 md:grid-cols-2">{matches.map(p => <PropertyCard key={p.id} p={p} />)}</div> : <p className="rounded-3xl bg-white p-8 text-sm ring-1 ring-slate-200">{t('لا يوجد إعلان محقق لكل الشروط معاً. وسّع المساحة أو الميزانية.', 'No reviewed listing satisfies every condition together. Widen the area or budget.')}</p>}</div></div>}
    </Page>
  );
}

export function Brokers() {
  const { t, go, listings } = useApp();
  return <Page kicker={t('الوسطاء', 'Brokers')} title={t('صفحة احترافية لكل وسيط', 'A professional page for every broker')}><div className="mt-6 grid gap-4 md:grid-cols-3">{BROKERS.map(b => <button key={b.id} onClick={() => go('/broker/' + b.id)} className="rounded-[28px] bg-white p-5 text-start ring-1 ring-slate-200"><img src={b.photo} alt="" className="h-28 w-full rounded-2xl object-cover" /><p className="mt-3 text-lg font-black">{t(b.name, b.nameEn)}</p><p className="text-xs text-slate-500">{b.office} · {b.city}</p><p className="mt-2 text-xs font-bold text-blue-700">{listings.filter(p => p.brokerId === b.id).length} {t('إعلانات', 'listings')}</p></button>)}</div><p className="mt-4 text-xs text-slate-500">{t('أدوات المتابعة المتقدمة وإدارة العملاء مرشحة لاشتراك مهني مدفوع لاحقاً، وليست مفعلة كخدمة مدفوعة الآن.', 'Advanced lead tools are planned as a future paid professional subscription and are not a paid service today.')}</p></Page>;
}

export function BrokerPage({ id }: { id: string }) {
  const { t, listings, user } = useApp();
  const b = BROKERS.find(x => x.id === id);
  const owned = listings.filter(p => p.brokerId === id || (user?.id === id && p.ownerId === id));
  if (!b && id !== user?.id) return <Page kicker="" title={t('الوسيط غير موجود', 'Broker not found')}><span /></Page>;
  const name = b ? t(b.name, b.nameEn) : user?.name || '';
  return <Page kicker={t('ملف وسيط', 'Broker profile')} title={name}><div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]"><div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">{b && <img src={b.photo} alt="" className="h-40 w-full rounded-2xl object-cover" />}<p className="mt-3 font-black">{b?.office || user?.office}</p><p className="text-sm text-slate-500">{b?.bio || user?.bio}</p><p className="mt-2 text-xs" dir="ltr">{b?.phone}</p><p className="text-xs text-slate-500">{t('رخصة', 'License')}: {b?.license || user?.license}</p></div><div className="grid gap-4 md:grid-cols-2">{owned.map(p => <PropertyCard key={p.id} p={p} />)}</div></div></Page>;
}

export function Network() {
  const { t, user, setAuthOpen } = useApp();
  const [posts, setPosts] = useBox<CollabPost[]>('at_collab', []);
  const [f, setF] = useState({ title: '', city: '6 أكتوبر', budget: '', commission: '50/50 بعد إتمام الصفقة', note: '' });
  const broker = user?.accountType === 'broker';
  return (
    <Page kicker={t('تعاون الوسطاء', 'Broker network')} title={t('مشتري عند وسيط، وعقار عند وسيط آخر', 'One broker has the buyer, another has the property')}>
      <div className="mt-4 grid gap-3 md:grid-cols-3">{[[Users, t('تسجيل العميل', 'Client registration'), t('أول وسيط يسجل اسم العميل وطلبه يحتفظ بأولوية التعريف لمدة 30 يوماً.', 'The first broker to register the client keeps introduction priority for 30 days.')], [Scale, t('العمولة', 'Commission'), t('نسبة المشاركة تُكتب قبل الرد، ولا تُستحق إلا بعد إتمام الصفقة.', 'The split is written before a response and is due only after completion.')], [Handshake, t('منع النزاع', 'Dispute prevention'), t('الردود والعملاء محفوظون بتاريخ، والمنصة لا تفصل في نزاع قانوني خارج هذه القواعد.', 'Responses are time-stamped. The platform does not adjudicate a legal dispute beyond these rules.')]].map(([I, h, p]) => { const Ic = I as typeof Users; return <div key={String(h)} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><Ic className="text-blue-700" /><h2 className="mt-2 font-black">{h as string}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{p as string}</p></div>; })}</div>
      {broker ? <form onSubmit={e => { e.preventDefault(); setPosts([{ id: 'cb' + Date.now(), brokerId: user!.id, brokerName: user!.office || user!.name, title: f.title, city: f.city, budget: +f.budget, currency: 'EGP', commission: f.commission, note: f.note, at: Date.now(), responses: [] }, ...posts]); setF({ ...f, title: '', note: '' }); }} className="mt-5 grid gap-2 rounded-3xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-2"><input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={t('مثال: مشتري يبحث عن فيلا', 'Example: buyer seeking a villa')} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm md:col-span-2" /><input value={f.city} onChange={e => setF({ ...f, city: e.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" /><input required type="number" value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })} placeholder={t('الميزانية', 'Budget')} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" /><input value={f.commission} onChange={e => setF({ ...f, commission: e.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm md:col-span-2" /><textarea value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder={t('تفاصيل الطلب', 'Request details')} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm md:col-span-2" /><button className="rounded-full bg-slate-950 py-3 text-sm font-bold text-white">{t('نشر طلب التعاون', 'Post collaboration request')}</button></form> : <button onClick={() => setAuthOpen('signup')} className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">{t('سجل كوسيط للمشاركة', 'Register as a broker to participate')}</button>}
      <div className="mt-5 space-y-3">{posts.map(p => <CollabCard key={p.id} post={p} />)}</div>
    </Page>
  );
}
function CollabCard({ post }: { post: CollabPost }) {
  const { t, user } = useApp();
  const [posts, setPosts] = useBox<CollabPost[]>('at_collab', []);
  const [note, setNote] = useState('');
  return <article className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="flex justify-between gap-3"><h3 className="font-black">{post.title}</h3><span className="text-xs font-bold">{fmt(post.budget, 'ar')} {post.currency}</span></div><p className="text-xs text-slate-500">{post.brokerName} · {post.city} · {post.commission}</p><p className="mt-2 text-sm">{post.note}</p>{user?.accountType === 'broker' && <form onSubmit={e => { e.preventDefault(); setPosts(posts.map(x => x.id === post.id ? { ...x, responses: [...x.responses, { name: user.office || user.name, note, at: Date.now() }] } : x)); setNote(''); }} className="mt-3 flex gap-2"><input value={note} onChange={e => setNote(e.target.value)} placeholder={t('رد بعقار مطابق واتفاق العمولة', 'Reply with a match and the agreed split')} className="flex-1 rounded-full border border-slate-200 px-3 text-sm" /><button className="rounded-full bg-slate-100 px-4 text-xs font-bold">{t('رد', 'Reply')}</button></form>}{post.responses.map((r, i) => <p key={i} className="mt-2 rounded-2xl bg-slate-50 p-2 text-xs"><b>{r.name}: </b>{r.note}</p>)}</article>;
}

export function Alerts() {
  const { t, lang, user, listings, setAuthOpen } = useApp();
  const [searches, setSearches] = useBox<SavedSearch[]>('at_searches', []);
  const mine = searches.filter(s => s.userId === user?.id);
  const drops = listings.filter(p => p.priceHistory && p.priceHistory.length > 1 && p.priceHistory.at(-1)!.price < p.priceHistory[0].price);
  return (
    <Page kicker={t('عقار على مقاسك', 'A property that fits')} title={t('احفظ الطلب مرة واحدة', 'Save the request once')}>
      {!user && <button onClick={() => setAuthOpen('login')} className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">{t('سجل الدخول لحفظ التنبيهات', 'Log in to save alerts')}</button>}
      <div className="mt-5 grid gap-3">{mine.map(s => <div key={s.id} className="flex items-center justify-between rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div><Bell className="text-blue-700" size={16} /><b className="mx-2">{s.label}</b><p className="text-xs text-slate-500">{listings.filter(p => p.reviewStatus === 'approved' && (!s.locations.length || s.locations.some(l => `${p.city} ${p.locationArea || ''}`.includes(l))) && (!s.maxPrice || p.price <= s.maxPrice)).length} {t('إعلان مطابق حالياً', 'current matches')}</p></div><button onClick={() => setSearches(searches.filter(x => x.id !== s.id))} className="text-xs font-bold text-rose-600">{t('حذف', 'Delete')}</button></div>)}{!mine.length && <p className="text-sm text-slate-500">{t('من صفحة التصفح اضغط «احفظ هذا البحث». عند نشر إعلان جديد مطابق سيظهر هنا.', 'From Browse, choose Save this search. A new matching listing will appear here.')}</p>}</div>
      <h2 className="mt-8 text-2xl font-black">{t('انخفاضات سعر العرض', 'Asking-price reductions')}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{drops.slice(0, 4).map(p => <div key={p.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><TrendingDown className="text-emerald-700" /><p className="mt-2 font-black">{p.title}</p><p className="text-sm">{fmt(p.priceHistory![0].price, lang)} ← {fmt(p.price, lang)} {currencyOf(p)[lang]}</p><p className="text-[11px] text-slate-500">{t('هذا انخفاض في السعر المعلن، وليس توثيقاً لصفقة.', 'This is a reduction in the advertised price, not a documented transaction.')}</p></div>)}</div>
    </Page>
  );
}

export function BrokerDesk() {
  const { t, user, listings, setAuthOpen } = useApp();
  const [leads] = useBox<Lead[]>('at_leads', []);
  if (!user) return <Page kicker="" title={t('مكتب الوسيط', 'Broker desk')}><button onClick={() => setAuthOpen('login')} className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">{t('تسجيل الدخول', 'Log in')}</button></Page>;
  const mine = listings.filter(p => p.ownerId === user.id);
  const myLeads = leads.filter(l => l.ownerId === user.id || l.brokerId === user.id);
  return <Page kicker={user.office || t('مكتب الوسيط', 'Broker desk')} title={t('العملاء والاستفسارات والمعاينات', 'Clients, inquiries and viewings')}><div className="mt-4 grid gap-3 sm:grid-cols-3"><Stat n={String(mine.length)} l={t('إعلانات', 'Listings')} /><Stat n={String(myLeads.length)} l={t('عملاء محتملون', 'Leads')} /><Stat n={String(mine.reduce((s, p) => s + (p.views || 0), 0))} l={t('مشاهدات', 'Views')} /></div><div className="mt-5 space-y-2">{myLeads.map(l => <div key={l.id} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-200"><b>{l.name}</b> · {l.kind} · <span dir="ltr">{l.phone}</span><p className="text-xs text-slate-500">{l.note}</p></div>)}{!myLeads.length && <p className="text-sm text-slate-500">{t('سيظهر هنا حجز المعاينة أو كشف الهاتف أو الاستفسار.', 'Tour bookings, phone reveals and inquiries will appear here.')}</p>}</div><p className="mt-4 text-xs text-slate-500">{t('لوحة العملاء الأساسية مجانية. أدوات التوزيع والحملات المدفوعة غير مفعلة في هذه النسخة.', 'The basic lead desk is free. Paid distribution and campaign tools are not enabled in this version.')}</p></Page>;
}
function Stat({ n, l }: { n: string; l: string }) { return <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><p className="text-2xl font-black">{n}</p><p className="text-xs text-slate-500">{l}</p></div>; }

export function saveCurrentSearch(userId: string, label: string, data: Omit<SavedSearch, 'id' | 'userId' | 'createdAt' | 'label'>) {
  const all = readBox<SavedSearch[]>('at_searches', []);
  writeBox('at_searches', [{ id: 'ss' + Date.now(), userId, label, createdAt: Date.now(), ...data }, ...all]);
}
export { addLead, MapPinned, Building2, MessageSquareText };

/* موجّه صفحات المنصة (يُحمَّل عند الطلب لتسريع الصفحة الرئيسية) */
export type PlatformRouteName = 'areas' | 'area' | 'market' | 'assistant' | 'brokers' | 'broker' | 'network' | 'alerts' | 'desk';
export function PlatformRoute({ which, slug, brokerId }: { which: PlatformRouteName; slug?: string; brokerId?: string }) {
  switch (which) {
    case 'areas': return <AreaIndex />;
    case 'area': return <AreaPage slug={slug || ''} />;
    case 'market': return <MarketCenter />;
    case 'assistant': return <Assistant />;
    case 'brokers': return <Brokers />;
    case 'broker': return <BrokerPage id={brokerId || ''} />;
    case 'network': return <Network />;
    case 'alerts': return <Alerts />;
    case 'desk': return <BrokerDesk />;
  }
}
