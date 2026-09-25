import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import AdminNav from '../components/AdminNav';
import { normalizeProcesVerbal, type ProcesVerbal } from '../lib/procesVerbalSchema';

const ProcesVerbalFlipbook = lazy(() => import('../components/BulletinFlipbook'));

type EditableProcesVerbal = ProcesVerbal & {
  pdfFile?: File | null;
};

const emptyProcesVerbal: EditableProcesVerbal = {
  id: '',
  title: '',
  year: new Date().getFullYear(),
  issueDate: '',
  description: '',
  pdfUrl: '',
  fileName: '',
  fileSize: undefined,
  published: true,
  pdfFile: null,
};

const procesVerbauxPerPage = 8;

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function createProcesVerbalId(title: string, issueDate: string) {
  return ['pv', issueDate, createSlug(title)].filter(Boolean).join('-');
}

export default function AdminProcesVerbauxPage() {
  const [procesVerbaux, setProcesVerbaux] = useState<ProcesVerbal[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<EditableProcesVerbal>(emptyProcesVerbal);
  const [status, setStatus] = useState('Chargement...');
  const [saving, setSaving] = useState(false);
  const [procesVerbalSearch, setProcesVerbalSearch] = useState('');
  const [procesVerbalPage, setProcesVerbalPage] = useState(1);

  const selectedExistingProcesVerbal = useMemo(
    () => procesVerbaux.find((procesVerbal) => procesVerbal.id === selectedId) ?? null,
    [procesVerbaux, selectedId],
  );

  const filteredProcesVerbaux = useMemo(() => {
    const search = normalizeSearchValue(procesVerbalSearch.trim());

    if (!search) {
      return procesVerbaux;
    }

    return procesVerbaux.filter((procesVerbal) =>
      normalizeSearchValue(`${procesVerbal.title} ${procesVerbal.year}`).includes(search),
    );
  }, [procesVerbalSearch, procesVerbaux]);

  const totalProcesVerbalPages = Math.max(
    Math.ceil(filteredProcesVerbaux.length / procesVerbauxPerPage),
    1,
  );
  const pagedProcesVerbaux = filteredProcesVerbaux.slice(
    (procesVerbalPage - 1) * procesVerbauxPerPage,
    procesVerbalPage * procesVerbauxPerPage,
  );

  useEffect(() => {
    void reloadProcesVerbaux();
  }, []);

  useEffect(() => {
    setProcesVerbalPage(1);
  }, [procesVerbalSearch, procesVerbaux.length]);

  useEffect(() => {
    setProcesVerbalPage((current) => Math.min(current, totalProcesVerbalPages));
  }, [totalProcesVerbalPages]);

  useEffect(() => {
    if (selectedExistingProcesVerbal) {
      setDraft({ ...selectedExistingProcesVerbal, pdfFile: null });
      return;
    }

    setDraft(emptyProcesVerbal);
  }, [selectedExistingProcesVerbal]);

  async function reloadProcesVerbaux() {
    try {
      const response = await fetch('/api/admin/proces-verbaux', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as { procesVerbaux: ProcesVerbal[] };
      const loadedProcesVerbaux = (payload.procesVerbaux ?? []).map(normalizeProcesVerbal);
      setProcesVerbaux(loadedProcesVerbaux);
      setStatus('');

      return loadedProcesVerbaux;
    } catch {
      setStatus("Impossible de charger les procès-verbaux d'administration.");
      return [];
    }
  }

  function updateDraft(key: keyof EditableProcesVerbal, value: string | number | boolean | File | null) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTitle(value: string) {
    setDraft((current) => ({
      ...current,
      title: value,
      id: selectedExistingProcesVerbal ? current.id : createProcesVerbalId(value, current.issueDate),
    }));
  }

  function updateIssueDate(value: string) {
    const year = Number(value.slice(0, 4)) || draft.year;

    setDraft((current) => ({
      ...current,
      issueDate: value,
      year,
      id: selectedExistingProcesVerbal ? current.id : createProcesVerbalId(current.title, value),
    }));
  }

  async function saveProcesVerbal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const id = draft.id || createProcesVerbalId(draft.title, draft.issueDate);
    const form = new FormData();
    form.set('id', id);
    form.set('title', draft.title);
    form.set('year', String(draft.year));
    form.set('issueDate', draft.issueDate);
    form.set('description', draft.description ?? '');
    form.set('published', draft.published ? '1' : '0');

    if (draft.pdfFile) {
      form.set('pdf', draft.pdfFile);
    }

    const endpoint = selectedExistingProcesVerbal
      ? `/api/admin/proces-verbaux/${encodeURIComponent(selectedExistingProcesVerbal.id)}`
      : '/api/admin/proces-verbaux';
    const method = selectedExistingProcesVerbal ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        body: form,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(payload?.error ?? "L'enregistrement a échoué.");
        return;
      }

      const loadedProcesVerbaux = await reloadProcesVerbaux();
      setSelectedId(id);
      setDraft({
        ...(loadedProcesVerbaux.find((procesVerbal) => procesVerbal.id === id) ?? draft),
        pdfFile: null,
      });
      setStatus('Procès-verbal enregistré.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProcesVerbal() {
    if (!selectedExistingProcesVerbal) {
      return;
    }

    const response = await fetch(
      `/api/admin/proces-verbaux/${encodeURIComponent(selectedExistingProcesVerbal.id)}`,
      { method: 'DELETE' },
    );

    if (!response.ok) {
      setStatus('La suppression a échoué.');
      return;
    }

    await reloadProcesVerbaux();
    setSelectedId('new');
    setStatus('Procès-verbal supprimé.');
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <header className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Administration
              </p>
              <h1 className="mt-1 text-2xl font-bold">Procès-verbaux</h1>
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Admin
                </p>
                <h1 className="mt-1 text-xl font-bold">Procès-verbaux</h1>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white"
                onClick={() => setSelectedId('new')}
                title="Nouveau procès-verbal"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <AdminNav active="procesverbal" />

            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">
                Rechercher par procès-verbal
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    value={procesVerbalSearch}
                    onChange={(event) => setProcesVerbalSearch(event.target.value)}
                    placeholder="Nom du procès-verbal"
                  />
                </span>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{filteredProcesVerbaux.length} procès-verbal(aux)</span>
                <span>
                  Page {procesVerbalPage} / {totalProcesVerbalPages}
                </span>
              </div>

              {pagedProcesVerbaux.map((procesVerbal) => (
                <button
                  key={procesVerbal.id}
                  type="button"
                  onClick={() => setSelectedId(procesVerbal.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                    selectedId === procesVerbal.id
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">{procesVerbal.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5" />
                    {procesVerbal.issueDate || procesVerbal.year}
                  </span>
                </button>
              ))}

              {pagedProcesVerbaux.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                  Aucun procès-verbal trouvé.
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={procesVerbalPage <= 1}
                onClick={() => setProcesVerbalPage((current) => Math.max(current - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={procesVerbalPage >= totalProcesVerbalPages}
                onClick={() =>
                  setProcesVerbalPage((current) => Math.min(current + 1, totalProcesVerbalPages))
                }
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={saveProcesVerbal}
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Contenu
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {selectedExistingProcesVerbal ? 'Modifier un procès-verbal' : 'Nouveau procès-verbal'}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedExistingProcesVerbal?.pdfUrl ? (
                  <a
                    href={`${selectedExistingProcesVerbal.pdfUrl}?download=1`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </a>
                ) : null}

                {selectedExistingProcesVerbal ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                    onClick={deleteProcesVerbal}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </button>
              </div>
            </div>

            {status ? <p className="mt-4 text-sm font-semibold text-slate-600">{status}</p> : null}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">
                Titre
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={draft.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  placeholder="Conseil municipal - 15 janvier 2026"
                  required
                />
              </label>

              <label className="text-sm font-semibold">
                Date du procès-verbal
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="date"
                  value={draft.issueDate}
                  onChange={(event) => updateIssueDate(event.target.value)}
                  required
                />
              </label>

              <label className="text-sm font-semibold">
                Année
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min="1900"
                  max="2200"
                  value={draft.year}
                  onChange={(event) => updateDraft('year', Number(event.target.value))}
                  required
                />
              </label>

              <label className="text-sm font-semibold">
                Identifiant
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={draft.id}
                  onChange={(event) => updateDraft('id', createSlug(event.target.value))}
                  required
                  readOnly={!selectedExistingProcesVerbal}
                />
              </label>

              <label className="text-sm font-semibold">
                Publié
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={draft.published ? '1' : '0'}
                  onChange={(event) => updateDraft('published', event.target.value === '1')}
                >
                  <option value="1">Oui</option>
                  <option value="0">Non</option>
                </select>
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                Description
                <textarea
                  className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={draft.description ?? ''}
                  onChange={(event) => updateDraft('description', event.target.value)}
                  placeholder="Courte présentation du procès-verbal affichée sur la page publique."
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold sm:col-span-2">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-700" />
                  <span className="min-w-0 truncate">
                    {draft.pdfFile?.name ?? draft.fileName ?? 'Envoyer le PDF du procès-verbal'}
                  </span>
                </span>
                <input
                  className="max-w-56 text-xs"
                  type="file"
                  accept="application/pdf,.pdf"
                  required={!selectedExistingProcesVerbal}
                  onChange={(event) => {
                    updateDraft('pdfFile', event.target.files?.[0] ?? null);
                  }}
                />
              </label>
            </div>

            {draft.pdfUrl ? (
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                  <FileText className="h-4 w-4 text-blue-700" />
                  Aperçu du procès-verbal publié
                </div>
                <div className="p-3">
                  <Suspense
                    fallback={
                      <div className="flex min-h-[560px] items-center justify-center rounded-[26px] border border-slate-200 bg-slate-900 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200">
                        Chargement du lecteur...
                      </div>
                    }
                  >
                    <ProcesVerbalFlipbook
                      key={draft.pdfUrl}
                      pdfUrl={draft.pdfUrl}
                      title={draft.title || 'Procès-verbal'}
                    />
                  </Suspense>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}
