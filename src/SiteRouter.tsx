import MairieWangenHome from './App';
import {
  getAssociationBySlug,
  getAssociationEventBySlugs,
  listAssociationEventPaths,
  listAssociationPaths,
} from './data/associations';
import AssociationPage from './pages/AssociationPage';
import EventPage from './pages/EventPage';

function normalizePathname(pathname: string) {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function NotFoundPage() {
  const knownPaths = [...listAssociationPaths(), ...listAssociationEventPaths()];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Page introuvable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Cette page n'existe pas. Voici les pages disponibles.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-blue-700">
            <li>
              <a href="/" className="font-medium hover:underline">
                /
              </a>
            </li>
            {knownPaths.map((path) => (
              <li key={path}>
                <a href={path} className="font-medium hover:underline">
                  {path}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function SiteRouter() {
  const pathname = normalizePathname(window.location.pathname);

  if (pathname === '/') {
    return <MairieWangenHome />;
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1) {
    const association = getAssociationBySlug(segments[0]);

    if (association) {
      return <AssociationPage association={association} />;
    }
  }

  if (segments.length === 3 && segments[1] === 'events') {
    const match = getAssociationEventBySlugs(segments[0], segments[2]);

    if (match) {
      return <EventPage association={match.association} event={match.event} />;
    }
  }

  return <NotFoundPage />;
}
