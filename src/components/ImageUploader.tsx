import { useRef, useState } from 'react';
import { ImagePlus, Camera, X, Star, Loader2, UploadCloud } from 'lucide-react';
import { useApp } from '../store';

const MAX_SIDE = 1280;
export const MAX_IMAGES = 8;

/* Compress once, then upload the JPEG blob to cloud storage. */
function compressImage(file: File, maxSide = MAX_SIDE, quality = 0.82): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('no-canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error('compression-failed'));
        resolve({ blob, preview: canvas.toDataURL('image/jpeg', Math.min(0.85, quality)) });
      }, 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad-image'));
    };
    img.src = url;
  });
}

export function ImageUploader({ images, onChange, folder = 'properties', drawing = false }: { images: string[]; onChange: (imgs: string[]) => void; folder?: string; drawing?: boolean }) {
  const { t, user, cloudEnabled, uploadMedia, setAuthOpen } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');

  const handle = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setErr(t(`الحد الأقصى ${MAX_IMAGES} صور`, `Maximum ${MAX_IMAGES} photos`));
      return;
    }
    const files = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, room);
    if (!files.length) {
      setErr(t('الملفات المختارة ليست صوراً', 'Selected files are not images'));
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const out: string[] = [];
      for (const f of files) {
        // floor plans keep far more resolution so thin wall lines survive and the 3D tour can read them
        const compressed = drawing ? await compressImage(f, 2400, 0.92) : await compressImage(f);
        if (cloudEnabled) {
          if (!user) {
            setAuthOpen('login');
            throw new Error('LOGIN_REQUIRED');
          }
          out.push(await uploadMedia(compressed.blob, folder));
        } else {
          // Local preview only. Production must configure Supabase Storage.
          out.push(compressed.preview);
        }
      }
      onChange([...images, ...out]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'LOGIN_REQUIRED' || message.startsWith('UPLOAD_AUTH_REQUIRED')) {
        setErr(t('انتهت جلسة الدخول. سجّل الدخول مرة ثانية ثم أعد رفع الصورة.', 'Your sign-in session expired. Sign in again and retry the upload.'));
      } else if (message === 'UPLOAD_SESSION_MISMATCH') {
        setErr(t('جلسة الحساب تغيرت أثناء الرفع. حدّث الصفحة وسجّل الدخول من جديد.', 'The account session changed. Refresh and sign in again.'));
      } else if (message === 'UPLOAD_TOO_LARGE') {
        setErr(t('حجم الصورة بعد الضغط أكبر من 10 ميجابايت. اختر صورة أصغر.', 'The compressed image is over 10 MB. Choose a smaller image.'));
      } else if (message === 'CLOUD_STORAGE_NOT_CONFIGURED') {
        setErr(t('رفع الصور السحابي غير مفعّل في نسخة الموقع المنشورة. أضف مفاتيح Supabase وأعد النشر.', 'Cloud image uploads are not enabled in this deployment. Add the Supabase environment keys and redeploy.'));
      } else if (message.includes('STORAGE_UPLOAD_FAILED:')) {
        const detail = message.split('STORAGE_UPLOAD_FAILED:')[1]?.trim() || 'unknown error';
        const lower = detail.toLowerCase();
        if (lower.includes('bucket') || lower.includes('not found') || lower.includes('404')) {
          setErr(t('باكت property-media غير موجود. شغّل Migration 004 في Supabase SQL Editor.', 'Storage bucket property-media is missing. Run migration 004 in Supabase SQL Editor.'));
        } else if (lower.includes('row-level security') || lower.includes('policy') || lower.includes('permission') || lower.includes('unauthorized') || lower.includes('jwt') || lower.includes('403')) {
          setErr(t('رفضت سياسة Storage عملية الرفع. شغّل Migration 004، ثم سجّل خروجاً ودخولاً.', 'Storage RLS rejected the upload. Run migration 004, then sign out and back in.') + ` (${detail})`);
        } else if (lower.includes('payload too large') || lower.includes('maximum') || lower.includes('413')) {
          setErr(t('حجم الملف تجاوز حد Storage في Supabase.', 'The file exceeds the Supabase Storage size limit.') + ` (${detail})`);
        } else {
          setErr(`${t('Supabase Storage أعاد هذا الخطأ', 'Supabase Storage returned this error')}: ${detail}`);
        }
      } else {
        setErr(`${t('تعذر رفع الصورة', 'Image upload failed')}: ${message || t('خطأ غير معروف', 'unknown error')}`);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
      if (camRef.current) camRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files);
        }}
        className={`rounded-[24px] border-2 border-dashed p-6 text-center transition ${
          drag ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50/70'
        }`}
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
          {busy ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
        </div>
        <p className="mt-3 text-sm font-extrabold text-slate-900">
          {t('اسحب الصور هنا أو اختر من جهازك', 'Drag photos here or choose from your device')}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {t(`JPG أو PNG أو WEBP · حتى ${MAX_IMAGES} صور · تُضغط تلقائياً`, `JPG, PNG or WEBP · up to ${MAX_IMAGES} photos · auto-compressed`)}
        </p>
        <p className={`mt-1 text-[10px] font-bold ${cloudEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
          {cloudEnabled
            ? t('رفع سحابي آمن عبر Supabase Storage', 'Secure cloud upload via Supabase Storage')
            : t('معاينة محلية فقط حتى تضيف مفاتيح Supabase', 'Local preview only until Supabase keys are added')}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <ImagePlus size={16} />
            <span>{t('من الكمبيوتر أو الهاتف', 'From computer or phone')}</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => camRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:border-blue-400 transition disabled:opacity-50"
          >
            <Camera size={16} />
            <span>{t('التقاط بالكاميرا', 'Take a photo')}</span>
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={e => handle(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => handle(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute start-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {t('الغلاف', 'Cover')}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                {i !== 0 ? (
                  <button
                    type="button"
                    title={t('اجعلها الغلاف', 'Set as cover')}
                    onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}
                    className="rounded-full bg-white p-1.5 text-slate-800"
                  >
                    <Star size={12} />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  title={t('حذف', 'Remove')}
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  className="rounded-full bg-white p-1.5 text-rose-600"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">
          {images.length} / {MAX_IMAGES} {t('صورة', 'photos')}
        </span>
        {err && <span className="font-bold text-rose-500">{err}</span>}
      </div>
    </div>
  );
}
