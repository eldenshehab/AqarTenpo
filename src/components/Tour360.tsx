import { useRef, useState } from 'react';
import { Calendar, MoveHorizontal, Video } from 'lucide-react';
import { useApp } from '../store';
import type { Property } from '../data';

export function VirtualTour({ p, onBook }: { p: Property; onBook: () => void }) {
  const { t } = useApp();
  const rooms = p.panoramas || [];
  const [room, setRoom] = useState(0);
  const [x, setX] = useState(50);
  const drag = useRef<{ on: boolean; start: number; origin: number }>({ on: false, start: 0, origin: 50 });
  if (!p.videoUrl && rooms.length === 0) return null;
  const current = rooms[room];
  return (
    <section className="rounded-[28px] bg-white p-4 ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-950">{t('الجولة الافتراضية', 'Virtual tour')}</h2>
        <button onClick={onBook} className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white"><Calendar size={14} />{t('اطلب معاينة فعلية', 'Request a real viewing')}</button>
      </div>
      {p.videoUrl && (
        <div className="overflow-hidden rounded-2xl bg-slate-950">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white"><Video size={14} />{t('فيديو العقار', 'Property video')}</div>
          <video controls playsInline className="aspect-video w-full" src={p.videoUrl} />
        </div>
      )}
      {current && (
        <div className="mt-3">
          <div
            className="relative h-72 cursor-grab overflow-hidden rounded-2xl bg-slate-200 active:cursor-grabbing"
            onPointerDown={e => { drag.current = { on: true, start: e.clientX, origin: x }; e.currentTarget.setPointerCapture(e.pointerId); }}
            onPointerMove={e => { if (drag.current.on) setX(Math.max(0, Math.min(100, drag.current.origin - (e.clientX - drag.current.start) / 6))); }}
            onPointerUp={() => { drag.current.on = false; }}
          >
            <img src={current.src} alt={current.room} className="absolute top-0 h-full max-w-none" style={{ width: '180%', insetInlineStart: `${-x}%` }} />
            <span className="absolute bottom-3 start-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900">{current.room}</span>
            <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white"><MoveHorizontal size={12} />{t('اسحب لاستكشاف الغرفة', 'Drag to look around')}</span>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {rooms.map((r, i) => <button key={r.room} onClick={() => { setRoom(i); setX(40); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${i === room ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>{r.room}</button>)}
          </div>
        </div>
      )}
    </section>
  );
}
