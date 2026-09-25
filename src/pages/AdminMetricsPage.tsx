import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react';
import AdminNav from '../components/AdminNav';

type MetricsRange = '7d' | '30d' | '90d';

type MetricsPayload = {
  configured: boolean;
  range: MetricsRange;
  error?: string;
  summary: {
    views: number;
    paths: number;
  };
  daily: {
    day: string;
    views: number;
  }[];
  topPages: {
    path: string;
    views: number;
  }[];
  referrers: {
    referrer: string;
    views: number;
  }[];
};

const emptyPayload: MetricsPayload = {
  configured: true,
  range: '7d',
  summary: {
    views: 0,
    paths: 0,
  },
  daily: [],
  topPages: [],
  referrers: [],
};

const rangeLabels: Record<MetricsRange, string> = {
  '7d': '7 jours',
  '30d': '30 jours',
  '90d': '90 jours',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminMetricsPage() {
  const [range, setRange] = useState<MetricsRange>('7d');
  const [metrics, setMetrics] = useState<MetricsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setStatus('');

    fetch(`/api/admin/metrics?range=${range}`, {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<MetricsPayload>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setMetrics(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('Impossible de charger les statistiques.');
          setMetrics({ ...emptyPayload, range });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const maxDailyViews = useMemo(
    () => Math.max(...metrics.daily.map((item) => item.views), 1),
    [metrics.daily],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Administration
              </p>
              <h1 className="mt-1 text-2xl font-bold">Statistiques</h1>
            </div>

            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au site
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            Admin
          </p>
          <h1 className="mt-1 text-xl font-bold">Gestion du site</h1>
          <AdminNav active="metrics" />
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Statistiques
                </p>
                <h2 className="mt-1 text-2xl font-bold">Visites des pages</h2>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(Object.keys(rangeLabels) as MetricsRange[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      range === option
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                    onClick={() => setRange(option)}
                  >
                    {rangeLabels[option]}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des statistiques...
              </p>
            ) : null}

            {status ? (
              <p className="mt-4 text-sm font-semibold text-red-700">{status}</p>
            ) : null}

            {!metrics.configured ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  Statistiques à configurer
                </p>
                <p className="mt-2 leading-6">
                  Les visites sont collectées si le binding Analytics Engine existe. Pour lire les
                  métriques ici, configurez aussi CLOUDFLARE_ACCOUNT_ID et le secret
                  ANALYTICS_READ_TOKEN.
                </p>
                {metrics.error ? <p className="mt-2 font-mono text-xs">{metrics.error}</p> : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard
              icon={MousePointerClick}
              label="Visites"
              value={formatNumber(metrics.summary.views)}
            />
            <StatCard
              icon={FileText}
              label="Pages consultées"
              value={formatNumber(metrics.summary.paths)}
            />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-700" />
              <h3 className="text-lg font-bold">Évolution quotidienne</h3>
            </div>

            {metrics.daily.length > 0 ? (
              <div className="mt-5 flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-2">
                {metrics.daily.map((item) => (
                  <div key={item.day} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {formatNumber(item.views)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-blue-600"
                      style={{ height: `${Math.max((item.views / maxDailyViews) * 190, 6)}px` }}
                      title={`${formatDay(item.day)} : ${formatNumber(item.views)} visites`}
                    />
                    <span className="text-xs text-slate-500">{formatDay(item.day)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Aucune visite enregistrée sur cette période.</p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold">Pages les plus consultées</h3>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                {metrics.topPages.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Page</th>
                        <th className="px-4 py-3 text-right">Visites</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {metrics.topPages.map((item) => (
                        <tr key={item.path}>
                          <td className="px-4 py-3">
                            <a
                              href={item.path}
                              className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline"
                            >
                              {item.path}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatNumber(item.views)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-slate-500">Aucune page à afficher.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold">Sources principales</h3>
              <div className="mt-4 space-y-3">
                {metrics.referrers.length > 0 ? (
                  metrics.referrers.map((item) => (
                    <div key={item.referrer} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-semibold">{item.referrer}</span>
                        <span className="font-bold text-slate-950">{formatNumber(item.views)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucune source à afficher.</p>
                )}
              </div>
            </section>
          </div>
        </section>
        </div>
      </div>
    </main>
  );
}
