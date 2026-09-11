import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import type { AssociationData, AssociationEvent } from '../lib/associationSchema';

type EditableEvent = AssociationEvent & {
  associationSlug: string;
  published?: boolean;
};

const emptyEvent: EditableEvent = {
  id: '',
  associationSlug: 'commune',
  slug: '',
  title: '',
  date: '',
  time: '',
  endTime: '',
  timeLabel: '',
  location: '',
  description: '',
  body: '',
  published: true,
};

const eventsPerPage = 8;

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

function createEventId(associationSlug: string, eventSlug: string, date?: string) {
  return [associationSlug, eventSlug, date].filter(Boolean).join('-');
}

function flattenEvents(associations: AssociationData[]): EditableEvent[] {
  return associations.flatMap((association) =>
    association.events.map((event) => ({
      ...event,
      associationSlug: association.slug,
      published: event.published ?? true,
    })),
  );
}

export default function AdminEventsPage() {
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [events, setEvents] = useState<EditableEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [draft, setDraft] = useState<EditableEvent>(emptyEvent);
  const [status, setStatus] = useState<string>('Chargement...');
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'banner' | 'main' | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [eventPage, setEventPage] = useState(1);

  const selectedExistingEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  const filteredEvents = useMemo(() => {
    const search = normalizeSearchValue(eventSearch.trim());

    if (!search) {
      return events;
    }

    return events.filter((event) => normalizeSearchValue(event.title).includes(search));
  }, [eventSearch, events]);

  const totalEventPages = Math.max(Math.ceil(filteredEvents.length / eventsPerPage), 1);
  const pagedEvents = filteredEvents.slice(
    (eventPage - 1) * eventsPerPage,
    eventPage * eventsPerPage,
  );

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/events', { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<{ associations: AssociationData[] }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const loadedAssociations = payload.associations ?? [];
        setAssociations(loadedAssociations);
        setEvents(flattenEvents(loadedAssociations));
        setStatus('');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Impossible de charger les événements d'administration.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setEventPage(1);
  }, [eventSearch, events.length]);

  useEffect(() => {
    setEventPage((current) => Math.min(current, totalEventPages));
  }, [totalEventPages]);

  useEffect(() => {
    if (selectedExistingEvent) {
      setDraft(selectedExistingEvent);
      setSlugEdited(true);
      return;
    }

    setDraft({
      ...emptyEvent,
      associationSlug: associations[0]?.slug ?? emptyEvent.associationSlug,
    });
    setSlugEdited(false);
  }, [associations, selectedExistingEvent]);

  function updateDraft(key: keyof EditableEvent, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTitle(value: string) {
    setDraft((current) => {
      const nextSlug =
        selectedExistingEvent || slugEdited ? current.slug : createSlug(value);
      const nextId = selectedExistingEvent
        ? current.id
        : createEventId(current.associationSlug, nextSlug, current.date);

      return {
        ...current,
        id: nextId,
        slug: nextSlug,
        title: value,
      };
    });
  }

  function updateAssociationSlug(value: string) {
    setDraft((current) => ({
      ...current,
      associationSlug: value,
      id: selectedExistingEvent
        ? current.id
        : createEventId(value, current.slug, current.date),
    }));
  }

  function updateEventSlug(value: string) {
    const nextSlug = createSlug(value);
    setSlugEdited(true);
    setDraft((current) => ({
      ...current,
      slug: nextSlug,
      id: selectedExistingEvent
        ? current.id
        : createEventId(current.associationSlug, nextSlug, current.date),
    }));
  }

  function updateEventDate(value: string) {
    setDraft((current) => ({
      ...current,
      date: value,
      id: selectedExistingEvent
        ? current.id
        : createEventId(current.associationSlug, current.slug, value),
    }));
  }

  async function reloadEvents() {
    const response = await fetch('/api/admin/events', {
      headers: { Accept: 'application/json' },
    });
    const payload = (await response.json()) as { associations: AssociationData[] };
    const loadedAssociations = payload.associations ?? [];
    const loadedEvents = flattenEvents(loadedAssociations);
    setAssociations(loadedAssociations);
    setEvents(loadedEvents);

    return loadedEvents;
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    const method = selectedExistingEvent ? 'PUT' : 'POST';
    const endpoint = selectedExistingEvent
      ? `/api/admin/events/${encodeURIComponent(selectedExistingEvent.id)}`
      : '/api/admin/events';
    const slug = draft.slug || createSlug(draft.title);
    const payload = {
      ...draft,
      slug,
      id: draft.id || createEventId(draft.associationSlug, slug, draft.date),
    };

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!response.ok) {
      setStatus("L'enregistrement a échoué.");
      return;
    }

    const loadedEvents = await reloadEvents();
    const savedEvent = loadedEvents.find((event) => event.id === payload.id);

    if (savedEvent) {
      setDraft(savedEvent);
    }

    setSelectedId(payload.id);
    setStatus('Événement enregistré.');
  }

  async function deleteEvent() {
    if (!selectedExistingEvent) {
      return;
    }

    const response = await fetch(
      `/api/admin/events/${encodeURIComponent(selectedExistingEvent.id)}`,
      { method: 'DELETE' },
    );

    if (!response.ok) {
      setStatus('La suppression a échoué.');
      return;
    }

    await reloadEvents();
    setSelectedId('new');
    setStatus('Événement supprimé.');
  }

  async function uploadImage(file: File, kind: 'banner' | 'main') {
    const slug = draft.slug || createSlug(draft.title);

    if (!draft.associationSlug || !slug) {
      setStatus("Ajoutez un titre avant d'envoyer une image.");
      return;
    }

    setUploadingImage(kind);
    setStatus('');

    const form = new FormData();
    form.set('image', file);
    form.set('kind', kind);
    form.set('associationSlug', draft.associationSlug);
    form.set('eventSlug', slug);

    const endpoint = selectedExistingEvent
      ? `/api/admin/events/${encodeURIComponent(selectedExistingEvent.id)}/images`
      : '/api/admin/event-images';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        setStatus("L'envoi de l'image a échoué.");
        return;
      }

      const payload = (await response.json()) as { src?: string };

      if (!payload.src) {
        setStatus("L'envoi de l'image a renvoyé une réponse invalide.");
        return;
      }

      setDraft((current) => ({
        ...current,
        slug,
        [kind]: {
          src: payload.src,
          alt: current.title,
        },
      }));

      if (selectedExistingEvent) {
        await reloadEvents();
      }

      setStatus('Image envoyée.');
    } finally {
      setUploadingImage(null);
    }
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
              <h1 className="mt-1 text-2xl font-bold">Événements</h1>
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
              <h1 className="mt-1 text-xl font-bold">Événements</h1>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white"
              onClick={() => setSelectedId('new')}
              title="Nouvel événement"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-4 space-y-2 border-b border-slate-200 pb-4">
            <a
              href="/admin/bulletins"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Bulletins
            </a>

            <a
              href="/admin/metrics"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4" />
              Statistiques
            </a>
          </nav>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">
              Rechercher par nom
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  value={eventSearch}
                  onChange={(event) => setEventSearch(event.target.value)}
                  placeholder="Nom de l'événement"
                />
              </span>
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{filteredEvents.length} événement(s)</span>
              <span>
                Page {eventPage} / {totalEventPages}
              </span>
            </div>

            {pagedEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedId(event.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                  selectedId === event.id
                    ? 'border-blue-700 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="block font-semibold">{event.title}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {event.date || 'Date à définir'}
                </span>
              </button>
            ))}

            {pagedEvents.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                Aucun événement trouvé.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={eventPage <= 1}
              onClick={() => setEventPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={eventPage >= totalEventPages}
              onClick={() => setEventPage((current) => Math.min(current + 1, totalEventPages))}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <form
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={saveEvent}
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Contenu
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {selectedExistingEvent ? 'Modifier un événement' : 'Nouvel événement'}
              </h2>
            </div>

            <div className="flex gap-2">
              {selectedExistingEvent ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                  onClick={deleteEvent}
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
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>

          {status ? <p className="mt-4 text-sm font-semibold text-slate-600">{status}</p> : null}

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Association
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.associationSlug}
                onChange={(event) => updateAssociationSlug(event.target.value)}
              >
                {associations.map((association) => (
                  <option key={association.slug} value={association.slug}>
                    {association.name}
                  </option>
                ))}
              </select>
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
              Titre
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.title}
                onChange={(event) => updateTitle(event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-semibold">
              Identifiant
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.id}
                onChange={(event) => updateDraft('id', event.target.value)}
                required
                readOnly={!selectedExistingEvent}
              />
            </label>

            <label className="text-sm font-semibold">
              Slug
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.slug}
                onChange={(event) => updateEventSlug(event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-semibold">
              Date
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                type="date"
                value={draft.date}
                onChange={(event) => updateEventDate(event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-semibold">
              Heure affichée
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.timeLabel ?? ''}
                onChange={(event) => updateDraft('timeLabel', event.target.value)}
                placeholder="à partir de 18h30"
              />
            </label>

            <label className="text-sm font-semibold">
              Heure début
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                type="time"
                value={draft.time ?? ''}
                onChange={(event) => updateDraft('time', event.target.value)}
              />
            </label>

            <label className="text-sm font-semibold">
              Heure fin
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                type="time"
                value={draft.endTime ?? ''}
                onChange={(event) => updateDraft('endTime', event.target.value)}
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Lieu
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.location}
                onChange={(event) => updateDraft('location', event.target.value)}
                required
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Description
              <textarea
                className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={draft.description ?? ''}
                onChange={(event) => updateDraft('description', event.target.value)}
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Corps Markdown
              <textarea
                className="mt-1 min-h-64 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                value={draft.body ?? ''}
                onChange={(event) => updateDraft('body', event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            {(['banner', 'main'] as const).map((kind) => (
              <label
                key={kind}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <span className="inline-flex items-center gap-2">
                  {uploadingImage === kind ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-blue-700" />
                  )}
                  {kind === 'banner' ? 'Bannière R2' : 'Image principale R2'}
                </span>
                <input
                  className="max-w-48 text-xs"
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadImage(file, kind);
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </form>
        </div>
      </div>
    </main>
  );
}
