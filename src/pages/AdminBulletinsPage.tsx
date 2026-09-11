import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
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
import { normalizeBulletin, type BulletinCommunal } from '../lib/bulletinSchema';

const BulletinFlipbook = lazy(() => import('../components/BulletinFlipbook'));

type EditableBulletin = BulletinCommunal & {
  pdfFile?: File | null;
};

const emptyBulletin: EditableBulletin = {
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

const bulletinsPerPage = 8;

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

function createBulletinId(title: string, issueDate: string) {
  return ['bc', issueDate, createSlug(title)].filter(Boolean).join('-');
}

function AdminNav({ active }: { active: 'events' | 'bulletins' | 'metrics' }) {
  const items = [
    {
      id: 'events',
      href: '/admin/events',
      label: 'Événements',
      icon: CalendarDays,
    },
    {
      id: 'bulletins',
      href: '/admin/bulletins',
      label: 'Bulletins',
      icon: FileText,
    },
    {
      id: 'metrics',
      href: '/admin/metrics',
      label: 'Statistiques',
      icon: BarChart3,
    },
  ] as const;

  return (
    <nav className="mt-4 space-y-2 border-b border-slate-200 pb-4">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;

        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
              selected
                ? 'border-blue-700 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export default function AdminBulletinsPage() {
  const [bulletins, setBulletins] = useState<BulletinCommunal[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<EditableBulletin>(emptyBulletin);
  const [status, setStatus] = useState('Chargement...');
  const [saving, setSaving] = useState(false);
  const [bulletinSearch, setBulletinSearch] = useState('');
  const [bulletinPage, setBulletinPage] = useState(1);

  const selectedExistingBulletin = useMemo(
    () => bulletins.find((bulletin) => bulletin.id === selectedId) ?? null,
    [bulletins, selectedId],
  );

  const filteredBulletins = useMemo(() => {
    const search = normalizeSearchValue(bulletinSearch.trim());

    if (!search) {
      return bulletins;
    }

    return bulletins.filter((bulletin) =>
      normalizeSearchValue(`${bulletin.title} ${bulletin.year}`).includes(search),
    );
  }, [bulletinSearch, bulletins]);

  const totalBulletinPages = Math.max(
    Math.ceil(filteredBulletins.length / bulletinsPerPage),
    1,
  );
  const pagedBulletins = filteredBulletins.slice(
    (bulletinPage - 1) * bulletinsPerPage,
    bulletinPage * bulletinsPerPage,
  );

  useEffect(() => {
    void reloadBulletins();
  }, []);

  useEffect(() => {
    setBulletinPage(1);
  }, [bulletinSearch, bulletins.length]);

  useEffect(() => {
    setBulletinPage((current) => Math.min(current, totalBulletinPages));
  }, [totalBulletinPages]);

  useEffect(() => {
    if (selectedExistingBulletin) {
      setDraft({ ...selectedExistingBulletin, pdfFile: null });
      return;
    }

    setDraft(emptyBulletin);
  }, [selectedExistingBulletin]);

  async function reloadBulletins() {
    try {
      const response = await fetch('/api/admin/bulletins', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as { bulletins: BulletinCommunal[] };
      const loadedBulletins = (payload.bulletins ?? []).map(normalizeBulletin);
      setBulletins(loadedBulletins);
      setStatus('');

      return loadedBulletins;
    } catch {
      setStatus("Impossible de charger les bulletins d'administration.");
      return [];
    }
  }

  function updateDraft(key: keyof EditableBulletin, value: string | number | boolean | File | null) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTitle(value: string) {
    setDraft((current) => ({
      ...current,
      title: value,
      id: selectedExistingBulletin ? current.id : createBulletinId(value, current.issueDate),
    }));
  }

  function updateIssueDate(value: string) {
    const year = Number(value.slice(0, 4)) || draft.year;

    setDraft((current) => ({
      ...current,
      issueDate: value,
      year,
      id: selectedExistingBulletin ? current.id : createBulletinId(current.title, value),
    }));
  }

  async function saveBulletin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const id = draft.id || createBulletinId(draft.title, draft.issueDate);
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

    const endpoint = selectedExistingBulletin
      ? `/api/admin/bulletins/${encodeURIComponent(selectedExistingBulletin.id)}`
      : '/api/admin/bulletins';
    const method = selectedExistingBulletin ? 'PUT' : 'POST';

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

      const loadedBulletins = await reloadBulletins();
      setSelectedId(id);
      setDraft({
        ...(loadedBulletins.find((bulletin) => bulletin.id === id) ?? draft),
        pdfFile: null,
      });
      setStatus('Bulletin enregistré.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBulletin() {
    if (!selectedExistingBulletin) {
      return;
    }

    const response = await fetch(
      `/api/admin/bulletins/${encodeURIComponent(selectedExistingBulletin.id)}`,
      { method: 'DELETE' },
    );

    if (!response.ok) {
      setStatus('La suppression a échoué.');
      return;
    }

    await reloadBulletins();
    setSelectedId('new');
    setStatus('Bulletin supprimé.');
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
              <h1 className="mt-1 text-2xl font-bold">Bulletins communaux</h1>
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
                <h1 className="mt-1 text-xl font-bold">Bulletins</h1>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white"
                onClick={() => setSelectedId('new')}
                title="Nouveau bulletin"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <AdminNav active="bulletins" />

            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">
                Rechercher par nom
                <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    value={bulletinSearch}
                    onChange={(event) => setBulletinSearch(event.target.value)}
                    placeholder="Nom du bulletin"
                  />
                </span>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{filteredBulletins.length} bulletin(s)</span>
                <span>
                  Page {bulletinPage} / {totalBulletinPages}
                </span>
              </div>

              {pagedBulletins.map((bulletin) => (
                <button
                  key={bulletin.id}
                  type="button"
                  onClick={() => setSelectedId(bulletin.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                    selectedId === bulletin.id
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">{bulletin.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5" />
                    {bulletin.issueDate || bulletin.year}
                  </span>
                </button>
              ))}

              {pagedBulletins.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                  Aucun bulletin trouvé.
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={bulletinPage <= 1}
                onClick={() => setBulletinPage((current) => Math.max(current - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={bulletinPage >= totalBulletinPages}
                onClick={() =>
                  setBulletinPage((current) => Math.min(current + 1, totalBulletinPages))
                }
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={saveBulletin}
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Contenu
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {selectedExistingBulletin ? 'Modifier un bulletin' : 'Nouveau bulletin'}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedExistingBulletin?.pdfUrl ? (
                  <a
                    href={`${selectedExistingBulletin.pdfUrl}?download=1`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </a>
                ) : null}

                {selectedExistingBulletin ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                    onClick={deleteBulletin}
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
                  placeholder="Bulletin communal - Janvier 2026"
                  required
                />
              </label>

              <label className="text-sm font-semibold">
                Date de publication
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
                  readOnly={!selectedExistingBulletin}
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
                  placeholder="Courte présentation affichée sur la page publique."
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold sm:col-span-2">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-700" />
                  <span className="min-w-0 truncate">
                    {draft.pdfFile?.name ?? draft.fileName ?? 'Envoyer un PDF'}
                  </span>
                </span>
                <input
                  className="max-w-56 text-xs"
                  type="file"
                  accept="application/pdf,.pdf"
                  required={!selectedExistingBulletin}
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
                  Aperçu du PDF publié
                </div>
                <div className="p-3">
                  <Suspense
                    fallback={
                      <div className="flex min-h-[560px] items-center justify-center rounded-[26px] border border-slate-200 bg-slate-900 text-sm font-extrabold uppercase tracking-[0.22em] text-amber-200">
                        Chargement du lecteur...
                      </div>
                    }
                  >
                    <BulletinFlipbook
                      key={draft.pdfUrl}
                      pdfUrl={draft.pdfUrl}
                      title={draft.title || 'Bulletin communal'}
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
