import { useState } from 'react';
import { BadgeCheck, FileCheck2, Flag, ShieldAlert } from 'lucide-react';
import type { Property } from '../data';
import { api, useApp } from '../store';

export function TrustBadges({ p, dark = false }: { p: Property; dark?: boolean }) {
  const { t } = useApp();
  const chip = dark ? 'bg-white/90 text-slate-900' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
  const wait = dark ? 'bg-white/80 text-slate-700' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.reviewStatus === 'pending' && <span className={`rounded-full px-2 py-1 text-[10px] font-black ${wait}`}>{t('قيد المراجعة', 'Under review')}</span>}
      {p.phoneVerified && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${chip}`}><BadgeCheck size={12} />{t('تم التحقق من رقم الهاتف', 'Phone verified')}</span>}
      {p.docsVerified ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${chip}`}><FileCheck2 size={12} />{t('مستندات مراجعة', 'Documents reviewed')}</span> : p.reviewStatus === 'approved' && <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${dark ? 'bg-white/75 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>{t('المستندات لم تُراجع بعد', 'Documents not reviewed')}</span>}
    </div>
  );
}

export function ReportButton({ id }: { id: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('بيانات غير صحيحة');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600"><Flag size={13} />{t('الإبلاغ عن إعلان غير صحيح', 'Report an incorrect listing')}</button>
      {open && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={async e => { e.preventDefault(); setBusy(true); try { await api.reportListing(id, reason, note); setDone(true); } finally { setBusy(false); } }} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><ShieldAlert className="text-rose-500" />{t('بلاغ عن الإعلان', 'Report listing')}</h3>
            {done ? <p className="mt-4 text-sm text-slate-600">{t('وصل البلاغ وسيراجعه فريق الثقة. لا يعني ذلك حذف الإعلان تلقائياً.', 'The report was received for trust review. It does not automatically remove the listing.')}</p> : <>
              <select value={reason} onChange={e => setReason(e.target.value)} className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                {['بيانات غير صحيحة', 'إعلان مكرر', 'صور لا تخص العقار', 'سعر مضلل', 'احتيال محتمل'].map(r => <option key={r}>{r}</option>)}
              </select>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('تفاصيل تساعد المراجعة', 'Details that help the review')} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" rows={3} />
              <button disabled={busy} className="mt-3 w-full rounded-full bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? '...' : t('إرسال البلاغ', 'Send report')}</button>
            </>}
          </form>
        </div>
      )}
    </>
  );
}
