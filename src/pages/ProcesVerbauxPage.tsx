import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Search,
} from 'lucide-react';
import type { ProcesVerbal } from '../lib/procesVerbalSchema';

const ProcesVerbalFlipbook = lazy(() => import('../components/BulletinFlipbook'));

const COLORS = {
  blue: '#1457F2',
  blueSoft: '#EAF2FF',
  green: '#2FA653',
  greenSoft: '#EAF8EE',
  gold: '#F2B705',
  goldSoft: '#FFF4CF',
  ink: '#10182F',
};

type YearGroup = {
  year: number;
  procesVerbaux: ProcesVerbal[];
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFileSize(value?: number) {
  if (!value) {
    return 'PDF';
  }

  const megaBytes = value / 1024 / 1024;
  return `${megaBytes.toLocaleString('fr-FR', {
    maximumFractionDigits: 1,
  })} Mo`;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        background:
          'radial-gradient(circle at top left, #EAF2FF 0, transparent 32%), radial-gradient(circle at top right, #FFF4CF 0, transparent 28%), linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 42%, #FFFDF7 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </main>
  );
}

function groupProcesVerbauxByYear(procesVerbaux: ProcesVerbal[]): YearGroup[] {
  const groups = new Map<number, ProcesVerbal[]>();

  for (const procesVerbal of procesVerbaux) {
    const yearProcesVerbaux = groups.get(procesVerbal.year) ?? [];
    yearProcesVerbaux.push(procesVerbal);
    groups.set(procesVerbal.year, yearProcesVerbaux);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, yearProcesVerbaux]) => ({
      year,
      procesVerbaux: yearProcesVerbaux.sort((a, b) =>
        b.issueDate.localeCompare(a.issueDate),
      ),
    }));
}

export default function ProcesVerbauxPage() {
  const [procesVerbaux, setProcesVerbaux] = useState<ProcesVerbal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Chargement des procès-verbaux...');

  useEffect(() => {
    let cancelled = false;

    fetch('/proces-verbaux/data.json', {
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        console.log('Fetched response:', response);
        return response.json() as Promise<{ procesVerbaux: ProcesVerbal[] }>;
      })
      .then((content) => {
        if (cancelled) {
          return;
        }

        const loadedProcesVerbaux = content.procesVerbaux ?? [];
        setProcesVerbaux(loadedProcesVerbaux);
        setSelectedId(loadedProcesVerbaux[0]?.id ?? null);
        setStatus('');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('Impossible de charger les procès-verbaux.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProcesVerbaux = useMemo(() => {
    const query = normalizeSearchValue(search.trim());

    if (!query) {
      return procesVerbaux;
    }

    return procesVerbaux.filter((procesVerbal) =>
      normalizeSearchValue(
        `${procesVerbal.title} ${procesVerbal.year} ${procesVerbal.description ?? ''}`,
      ).includes(query),
    );
  }, [procesVerbaux, search]);

  const yearGroups = useMemo(
    () => groupProcesVerbauxByYear(filteredProcesVerbaux),
    [filteredProcesVerbaux],
  );

  const selectedProcesVerbal =
    filteredProcesVerbaux.find((procesVerbal) => procesVerbal.id === selectedId) ??
    filteredProcesVerbaux[0] ??
    null;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(20,33,61,0.08)] sm:p-7">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </a>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                Archives communales
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Procès-verbaux
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Retrouvez les procès-verbaux publiés par année, avec consultation directe et téléchargement.
              </p>
            </div>

            <label className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un procès-verbal"
              />
            </label>
          </div>
        </section>

        {status ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
            {status}
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            {yearGroups.length > 0 ? (
              yearGroups.map((group) => (
                <section
                  key={group.year}
                  className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(20,33,61,0.06)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-extrabold text-slate-950">{group.year}</h2>
                    <span className="rounded-full px-3 py-1 text-xs font-bold text-blue-700" style={{ backgroundColor: COLORS.blueSoft }}>
                      {group.procesVerbaux.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {group.procesVerbaux.map((procesVerbal) => {
                      const selected = selectedProcesVerbal?.id === procesVerbal.id;

                      return (
                        <button
                          key={procesVerbal.id}
                          type="button"
                          onClick={() => setSelectedId(procesVerbal.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            selected
                              ? 'border-blue-700 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-sm font-extrabold text-slate-950">
                            {procesVerbal.title}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {formatDate(procesVerbal.issueDate)} · {formatFileSize(procesVerbal.fileSize)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-blue-700" />
                <h2 className="mt-3 text-lg font-extrabold text-slate-950">
                  Aucun procès-verbal publié
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Les prochains procès-verbaux apparaîtront ici.
                </p>
              </section>
            )}
          </aside>

          <section className="min-h-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_44px_rgba(20,33,61,0.10)]">
            {selectedProcesVerbal ? (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: COLORS.green }}>
                      {selectedProcesVerbal.year}
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                      {selectedProcesVerbal.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatDate(selectedProcesVerbal.issueDate)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={selectedProcesVerbal.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </a>
                    <a
                      href={`${selectedProcesVerbal.pdfUrl}?download=1`}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition"
                      style={{ backgroundColor: COLORS.blue }}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  </div>
                </div>

                {selectedProcesVerbal.description ? (
                  <p className="border-b border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">
                    {selectedProcesVerbal.description}
                  </p>
                ) : null}

                <div className="bg-slate-100 p-3 sm:p-5">
                  <Suspense
                    fallback={
                      <div className="flex min-h-[560px] items-center justify-center rounded-[26px] border border-slate-200 bg-slate-900 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200">
                        Chargement du lecteur...
                      </div>
                    }
                  >
                    <ProcesVerbalFlipbook
                      key={selectedProcesVerbal.pdfUrl}
                      pdfUrl={selectedProcesVerbal.pdfUrl}
                      title={selectedProcesVerbal.title}
                    />
                  </Suspense>
                </div>
              </>
            ) : (
              <div className="flex min-h-[680px] items-center justify-center p-8 text-center">
                <div>
                  <FileText className="mx-auto h-10 w-10 text-blue-700" />
                  <h2 className="mt-4 text-xl font-extrabold text-slate-950">
                    Sélectionnez un procès-verbal
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Le PDF s'affichera ici dès qu'un procès-verbal est disponible.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
