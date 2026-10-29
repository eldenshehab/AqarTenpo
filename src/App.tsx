import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './store';
import { isOwnerOf } from './config';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar, Footer } from './components/Common';
import { AuthModal, ComparisonBar } from './components/Modals';
import { Home, Browse, PropertyDetail, Favorites } from './views/Views';
const Sell = lazy(() => import('./views/Sell').then(m => ({ default: m.Sell })));
const MyListings = lazy(() => import('./views/MyListings'));
const Assignments = lazy(() => import('./views/Assignments'));
const AssignmentDetail = lazy(() => import('./views/AssignmentDetail').then(m => ({ default: m.AssignmentDetail })));
const PlatformRoute = lazy(() => import('./views/Platform').then(m => ({ default: m.PlatformRoute })));
const Admin = lazy(() => import('./views/Admin'));
const Status = lazy(() => import('./views/Status'));
import { CloudBanner } from './components/CloudBanner';
import { AuthNotice } from './components/AuthNotice';

function Loading() {
  return <div className="grid min-h-[60vh] place-items-center pt-24 text-xs font-bold text-slate-400">جارٍ التحميل…</div>;
}

function Router() {
  const { route, listings, user, t, go } = useApp();
  const path = route.split('?')[0];

  if (path.startsWith('/property/')) {
    const id = path.slice(10);
    const p = listings.find(x => x.id === id);
    const visible = p && ((p.reviewStatus || 'approved') === 'approved' || isOwnerOf(p, user) || user?.isAdmin);
    if (p?.assignment && visible)
      return (
        <div className="mx-auto max-w-7xl px-4 pt-28 pb-16">
          <button onClick={() => go('/assignments')} className="mb-5 text-xs font-bold text-slate-500 hover:text-slate-950">
            ← {t('العودة لفرص التنازل عن العقود', 'Back to assignments')}
          </button>
          <AssignmentDetail p={p} />
        </div>
      );
    return <PropertyDetail id={id} />;
  }

  if (path === '/browse') return <Browse key={route} />;
  if (path === '/favorites') return <Favorites />;
  if (path === '/sell') return <Sell />;
  if (path === '/my-listings') return <MyListings />;
  if (path === '/assignments') return <Assignments />;
  if (path === '/market') return <PlatformRoute which="market" />;
  if (path === '/assistant') return <PlatformRoute which="assistant" />;
  if (path === '/areas' || path === '/map') return <PlatformRoute which="areas" />;
  if (path.startsWith('/area/')) return <PlatformRoute which="area" slug={path.slice(6)} />;
  if (path === '/brokers') return <PlatformRoute which="brokers" />;
  if (path.startsWith('/broker/')) return <PlatformRoute which="broker" brokerId={path.slice(8)} />;
  if (path === '/network') return <PlatformRoute which="network" />;
  if (path === '/alerts') return <PlatformRoute which="alerts" />;
  if (path === '/desk') return <PlatformRoute which="desk" />;
  if (path === '/admin') return <Admin />;
  if (path === '/status') return <Status />;
  return <Home />;
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#f7f6f3] text-slate-800 antialiased">
          <Navbar />
          <main>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Router />
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
          <CloudBanner />
          <AuthNotice />
          <ComparisonBar />
          <AuthModal />
        </div>
      </ErrorBoundary>
    </AppProvider>
  );
}
