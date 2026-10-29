import { TriangleAlert, X } from 'lucide-react';
import { useApp } from '../store';

/* Shown when Google / Supabase sends the user back with an error, so a failed sign-in is never silent. */
export function AuthNotice() {
  const { authNotice, clearAuthNotice, t, go } = useApp();
  if (!authNotice) return null;

  const raw = authNotice;
  const message = /access_denied|denied|cancel/i.test(raw)
    ? t('تم إلغاء تسجيل الدخول بجوجل.', 'Google sign-in was cancelled.')
    : /database error saving new user|saving new user/i.test(raw)
    ? t('تعذّر إنشاء الحساب في قاعدة البيانات. شغّل ملفات SQL في Supabase بالترتيب (001 ثم 002 ثم 003) ثم حاول مرة أخرى.', 'The account could not be created in the database. Run the SQL files in Supabase in order (001, 002, 003) and try again.')
    : /provider is not enabled|unsupported provider/i.test(raw)
    ? t('Google غير مفعّل داخل Supabase. فعّله من Authentication ثم Providers ثم Google.', 'Google is not enabled in Supabase. Enable it under Authentication, Providers, Google.')
    : /email not confirmed/i.test(raw)
    ? t('البريد لم يُؤكَّد بعد. افتح رسالة التأكيد ثم سجّل الدخول.', 'The email is not confirmed yet. Open the confirmation email, then sign in.')
    : t('تعذّر تسجيل الدخول بجوجل.', 'Google sign-in failed.');

  return (
    <div role="alert" className="fixed inset-x-3 top-20 z-[150] mx-auto max-w-lg rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-rose-200">
      <div className="flex items-start gap-3">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">{message}</p>
          <p className="mt-1 break-words text-[11px] text-slate-400" dir="ltr">{raw}</p>
          <button
            onClick={() => { clearAuthNotice(); go('/status'); }}
            className="mt-2 text-[11px] font-black text-blue-700 underline underline-offset-2"
          >
            {t('افتح صفحة حالة الموقع للتشخيص', 'Open the site status page to diagnose')}
          </button>
        </div>
        <button onClick={clearAuthNotice} aria-label={t('إغلاق', 'Close')} className="shrink-0 text-slate-400 hover:text-slate-700">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
