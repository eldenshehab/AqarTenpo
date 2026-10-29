import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Footprints, Layers, Loader2, Minus, Plus, TriangleAlert, Upload } from 'lucide-react';
import { useApp } from '../store';
import { analyzePlan, metersPerCell, planQuality, type WallGrid } from '../lib/planModel';
import { createTourScene, WALL_HEIGHT, type MoveKey, type TourMode, type TourScene } from '../lib/tourScene';

interface Analysis { grid: WallGrid; canvas: HTMLCanvasElement; mpc: number }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD'));
    img.src = src;
  });
}

/* Draws the drawing on a white canvas and turns its ink lines into a wall grid. */
async function analyze(src: string, luminance: number, areaM2?: number): Promise<Analysis> {
  const img = await loadImage(src);
  const nw = img.naturalWidth || img.width || 1000;
  const nh = img.naturalHeight || img.height || 700;
  const scale = 1700 / Math.max(nw, nh);
  const w = Math.max(64, Math.round(nw * scale));
  const h = Math.max(64, Math.round(nh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('NO_CANVAS');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h); // throws if the image host blocks cross-origin reads
  const grid = analyzePlan(pixels.data, w, h, { luminance });
  return { grid, canvas, mpc: metersPerCell(grid, areaM2) };
}

interface Props {
  plans: string[];
  areaM2?: number; // unit area; sets the real-world scale
  allowUpload?: boolean; // lets a visitor try their own drawing (demo section)
  className?: string;
}

export default function PlanTour3D({ plans, areaM2, allowUpload = false, className = '' }: Props) {
  const { t } = useApp();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TourScene | null>(null);
  const modeRef = useRef<TourMode>('orbit');
  const [custom, setCustom] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [luminance, setLuminance] = useState(150);
  const [mode, setMode] = useState<TourMode>('orbit');
  const [result, setResult] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [glError, setGlError] = useState(false);

  const sources = custom ? [custom] : plans;
  const src = sources[Math.min(idx, sources.length - 1)] || '';
  const perPlanArea = areaM2 ? areaM2 / Math.max(1, sources.length) : undefined;

  // 1) analyse the drawing (debounced so the sensitivity slider stays smooth)
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setStatus('loading');
    const timer = window.setTimeout(async () => {
      try {
        const next = await analyze(src, luminance, perPlanArea);
        if (cancelled) return;
        setResult(next);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'ERR');
      }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [src, luminance, perPlanArea]);

  // 2) create the 3D scene once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    try {
      sceneRef.current = createTourScene(el);
    } catch {
      setGlError(true);
      return;
    }
    return () => { sceneRef.current?.dispose(); sceneRef.current = null; };
  }, []);

  // 3) push each new model into the scene
  useEffect(() => {
    if (result && sceneRef.current) {
      sceneRef.current.setModel(result.grid, result.canvas, result.mpc);
      sceneRef.current.setMode(modeRef.current);
    }
  }, [result]);

  useEffect(() => {
    modeRef.current = mode;
    sceneRef.current?.setMode(mode);
  }, [mode]);

  const quality = result ? planQuality(result.grid) : 'good';
  const modes: [TourMode, string, typeof Box][] = [
    ['orbit', t('مجسم 3D', '3D model'), Box],
    ['top', t('عرض علوي', 'Top view'), Layers],
    ['walk', t('جولة مشي', 'Walk-through'), Footprints],
  ];
  const hold = (k: MoveKey) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); sceneRef.current?.press(k, true); },
    onPointerUp: () => sceneRef.current?.press(k, false),
    onPointerLeave: () => sceneRef.current?.press(k, false),
    onPointerCancel: () => sceneRef.current?.press(k, false),
  });

  return (
    <div className={`overflow-hidden rounded-[28px] bg-white ring-1 ring-slate-200 ${className}`}>
      <div className="relative h-[440px] bg-slate-100 md:h-[540px]">
        <div ref={mountRef} tabIndex={0} className="absolute inset-0 cursor-grab outline-none active:cursor-grabbing" aria-label={t('جولة ثلاثية الأبعاد', '3D tour')} />

        {glError && (
          <div className="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center text-sm font-bold text-slate-600">
            {t('المتصفح لا يدعم WebGL المطلوب للجولة ثلاثية الأبعاد.', 'This browser does not support the WebGL needed for the 3D tour.')}
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-2">
          {modes.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black shadow-sm transition ${mode === id ? 'bg-slate-950 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          {sources.length > 1 && (
            <div className="ms-auto flex gap-1 rounded-full bg-white/95 p-1 shadow-sm">
              {sources.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${i === idx ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                  {t(`الدور ${i + 1}`, `Floor ${i + 1}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode !== 'walk' && (
          <div className="absolute bottom-3 end-3 flex flex-col gap-1.5">
            <button onClick={() => sceneRef.current?.zoom(0.8)} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-md" aria-label="zoom in"><Plus size={16} /></button>
            <button onClick={() => sceneRef.current?.zoom(1.25)} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-md" aria-label="zoom out"><Minus size={16} /></button>
          </div>
        )}

        {mode === 'walk' && (
          <div className="absolute bottom-3 start-3 grid select-none grid-cols-3 gap-1.5" dir="ltr">
            <span />
            <button {...hold('f')} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-md active:bg-blue-600 active:text-white" aria-label="forward"><ArrowUp size={18} /></button>
            <span />
            <button {...hold('l')} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-md active:bg-blue-600 active:text-white" aria-label="left"><ArrowLeft size={18} /></button>
            <button {...hold('b')} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-md active:bg-blue-600 active:text-white" aria-label="back"><ArrowDown size={18} /></button>
            <button {...hold('r')} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-md active:bg-blue-600 active:text-white" aria-label="right"><ArrowRight size={18} /></button>
          </div>
        )}

        {status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-white/55">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow"><Loader2 size={14} className="animate-spin" />{t('جاري بناء المجسم من الرسم...', 'Building the model from the drawing...')}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center bg-white/92 p-6 text-center">
            <div className="max-w-sm text-sm font-bold text-rose-600">
              <TriangleAlert className="mx-auto mb-2" />
              {t('تعذر قراءة الرسم لبناء المجسم. ارفع الرسم من جهازك كصورة JPG أو PNG.', 'Could not read the drawing to build the model. Upload the drawing from your device as a JPG or PNG.')}
              <p className="mt-1 text-[10px] font-semibold text-slate-400" dir="ltr">{error}</p>
            </div>
          </div>
        )}

        {status === 'ready' && quality !== 'good' && (
          <div className="absolute inset-x-3 bottom-16 mx-auto max-w-md rounded-2xl bg-amber-50 p-3 text-center text-[11px] font-bold leading-5 text-amber-900 ring-1 ring-amber-200">
            <TriangleAlert size={14} className="mb-0.5 inline" />{' '}
            {quality === 'empty'
              ? t('لم تُكتشف جدران كافية. جرّب رفع مخطط بخطوط داكنة على خلفية بيضاء، أو ارفع حساسية الجدران.', 'Not enough walls were detected. Try a plan with dark lines on a white background, or raise wall sensitivity.')
              : t('الرسم كثيف جداً (ربما صورة فوتوغرافية). لنتيجة أدق استخدم مخططاً هندسياً نظيفاً أو خفّض حساسية الجدران.', 'The drawing is very dense (maybe a photo). For a better result use a clean floor plan or lower wall sensitivity.')}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 px-4 py-3 text-[11px] font-bold text-slate-600">
        <label className="flex items-center gap-2">
          {t('حساسية الجدران', 'Wall sensitivity')}
          <input type="range" min={60} max={230} value={luminance} onChange={e => setLuminance(+e.target.value)} className="w-28 accent-blue-600" />
        </label>
        {result && status !== 'error' && (
          <span>
            {t('اكتُشف', 'Detected')} {result.grid.rects.length} {t('جدار', 'wall segments')} · {t('ارتفاع', 'height')} {WALL_HEIGHT} {t('م', 'm')} · {t('المقياس تقريبي', 'scale is approximate')} ({(result.mpc * 100).toFixed(0)} {t('سم/خلية', 'cm/cell')})
          </span>
        )}
        <span className="text-slate-400">
          {mode === 'walk'
            ? t('اسحب للنظر · W A S D أو الأسهم أو الأزرار للحركة · الجدران تمنعك من العبور', 'Drag to look · W A S D, arrows or buttons to move · walls block you')
            : t('اسحب للتدوير · عجلة الماوس للتكبير', 'Drag to rotate · mouse wheel to zoom')}
        </span>
        {allowUpload && (
          <label className="ms-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-2 text-[11px] font-black text-white">
            <Upload size={13} />
            {t('جرّب مخططك أنت', 'Try your own plan')}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => { setCustom(String(reader.result)); setIdx(0); };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
        {allowUpload && custom && (
          <button onClick={() => { setCustom(null); setIdx(0); }} className="text-[11px] font-black text-blue-700">{t('العودة للمخطط التجريبي', 'Back to the demo plan')}</button>
        )}
      </div>
    </div>
  );
}
