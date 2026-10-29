import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/* Keeps one broken widget from blanking the whole site. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AqarTenpo render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
        <div className="w-full rounded-[28px] bg-white p-8 ring-1 ring-slate-200">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-rose-600">خطأ غير متوقع</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">تعذر عرض هذا الجزء من الموقع</h1>
          <p className="mt-2 text-sm text-slate-500">
            حصل خطأ أثناء تحميل الصفحة، وباقي الموقع يعمل. جرّب تحديث الصفحة أو العودة للرئيسية.
          </p>
          <p className="mt-3 max-h-24 overflow-auto rounded-xl bg-slate-50 p-2 text-start text-[11px] text-slate-500" dir="ltr">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={() => this.setState({ error: null })} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">حاول مرة أخرى</button>
            <button onClick={() => { location.hash = '/'; this.setState({ error: null }); }} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800">الرئيسية</button>
            <button onClick={() => location.reload()} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800">تحديث الصفحة</button>
          </div>
        </div>
      </div>
    );
  }
}
