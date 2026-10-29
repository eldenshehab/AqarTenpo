import { useState } from 'react';
import { CloudOff, X } from 'lucide-react';
import { useApp } from '../store';

/* Device-only mode is easy to miss: everything looks like it works, but accounts and listings
   never leave the browser that created them. This makes that state impossible to overlook. */
export function CloudBanner() {
  const { cloudEnabled, t, go } = useApp();
  const [hidden, setHidden] = useState(false);
  if (cloudEnabled || hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-amber-300 bg-amber-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-2.5">
        <CloudOff size={16} className="mt-0.5 shrink-0 text-amber-700" />
        <p className="flex-1 text-[11px] font-bold leading-5 text-amber-900">
          {t(
            'وضع هذا الجهاز فقط: الحسابات والإعلانات والصور محفوظة داخل هذا المتصفح ولا تظهر على أي هاتف آخر، وتسجيل جوجل معطّل. لتشغيل الموقع للجميع أضف مفاتيح Supabase في Vercel.',
            'Device-only mode: accounts, listings and photos stay inside this browser, are invisible on other phones, and Google sign-in is disabled. Add the Supabase keys in Vercel to run the site for everyone.'
          )}{' '}
          <button onClick={() => go('/status')} className="underline underline-offset-2">
            {t('افتح صفحة الحالة', 'Open the status page')}
          </button>
        </p>
        <button onClick={() => setHidden(true)} aria-label={t('إخفاء', 'Dismiss')} className="shrink-0 text-amber-700 hover:text-amber-900">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
