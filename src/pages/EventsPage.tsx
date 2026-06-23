import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';

import { listAssociations } from '../data/associations';
import type {
  AssociationData,
  AssociationEvent,
} from '../lib/associationSchema';

const EVENTS_PER_PAGE = 8;

const COLORS = {
  blue: '#1457F2',
  blueSoft: '#EAF2FF',
  green: '#2FA653',
  greenSoft: '#EAF8EE',
  gold: '#F2B705',
  goldSoft: '#FFF4CF',
  orange: '#E58A00',
  orangeSoft: '#FFF2D9',
  purple: '#8B5CF6',
  purpleSoft: '#F3ECFF',
  pink: '#DB2777',
  pinkSoft: '#FFEAF4',
  ink: '#10182F',
  muted: '#64748B',
  line: '#E2E8F0',
  white: '#FFFFFF',
};

type Accent = {
  main: string;
  soft: string;
};

type AgendaEvent = {
  id: string;
  association: AssociationData;
  event: AssociationEvent;
  sortDate: Date;
};

type AgendaPage = {
  kind: 'past' | 'future';
  events: AgendaEvent[];
};

type MonthGroup = {
  key: string;
  label: string;
  events: AgendaEvent[];
};

const associationAccents: Accent[] = [
  { main: COLORS.purple, soft: COLORS.purpleSoft },
  { main: COLORS.green, soft: COLORS.greenSoft },
  { main: COLORS.orange, soft: COLORS.orangeSoft },
  { main: COLORS.blue, soft: COLORS.blueSoft },
  { main: COLORS.pink, soft: COLORS.pinkSoft },
];

const agendaDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
});

function capitalizeFirst(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEventSortDate(date: string, time?: string | null) {
  const timeMatch = time?.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);

  const timePart = timeMatch
    ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:00`
    : '23:59:00';

  return new Date(`${date}T${timePart}`);
}

function getAgendaDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return agendaDateFormatter.format(parsed);
}

function getMonthData(dateIso: string) {
  const parsed = new Date(`${dateIso}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return {
      key: dateIso,
      label: dateIso,
    };
  }

  return {
    key: `${parsed.getFullYear()}-${String(
      parsed.getMonth() + 1,
    ).padStart(2, '0')}`,
    label: capitalizeFirst(monthFormatter.format(parsed)),
  };
}

function formatFrenchTime(time: string) {
  const trimmed = time.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return trimmed;
  }

  const hour = Number(match[1]);
  const minute = match[2];

  return minute === '00' ? `${hour}h` : `${hour}h${minute}`;
}

function formatEventTime(event: AssociationEvent) {
  if (event.timeLabel) {
    return event.timeLabel;
  }

  if (event.time && event.endTime) {
    return `${formatFrenchTime(event.time)}-${formatFrenchTime(
      event.endTime,
    )}`;
  }

  if (event.time) {
    return formatFrenchTime(event.time);
  }

  return 'Horaire à venir';
}

function chunkEvents(events: AgendaEvent[], size: number) {
  const chunks: AgendaEvent[][] = [];

  for (let index = 0; index < events.length; index += size) {
    chunks.push(events.slice(index, index + size));
  }

  return chunks;
}

function buildAgendaPages(events: AgendaEvent[]) {
  const now = new Date();

  const pastEvents = events.filter(
    (item) => item.sortDate.getTime() < now.getTime(),
  );

  const futureEvents = events.filter(
    (item) => item.sortDate.getTime() >= now.getTime(),
  );

  /*
   * Past events are sorted from oldest to newest.
   * Therefore, the last past page contains the most recent archives and sits
   * immediately before the first future page.
   */
  const pastPages: AgendaPage[] = chunkEvents(
    pastEvents,
    EVENTS_PER_PAGE,
  ).map((pageEvents) => ({
    kind: 'past',
    events: pageEvents,
  }));

  const futurePages: AgendaPage[] = chunkEvents(
    futureEvents,
    EVENTS_PER_PAGE,
  ).map((pageEvents) => ({
    kind: 'future',
    events: pageEvents,
  }));

  /*
   * Keep one empty future page when no future events exist.
   * This makes the agenda open on the future section while allowing the user
   * to press "Précédent" to view archived events.
   */
  if (futurePages.length === 0) {
    futurePages.push({
      kind: 'future',
      events: [],
    });
  }

  return {
    pages: [...pastPages, ...futurePages],
    initialPage: pastPages.length + 1,
    pastCount: pastEvents.length,
    futureCount: futureEvents.length,
  };
}

function groupEventsByMonth(events: AgendaEvent[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const item of events) {
    const month = getMonthData(item.event.date);
    const previousGroup = groups[groups.length - 1];

    if (previousGroup?.key === month.key) {
      previousGroup.events.push(item);
      continue;
    }

    groups.push({
      key: month.key,
      label: month.label,
      events: [item],
    });
  }

  return groups;
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
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </main>
  );
}

function ShellCard({
  children,
  className = '',
  background = COLORS.white,
  id,
}: {
  children: ReactNode;
  className?: string;
  background?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-[28px] border shadow-[0_14px_40px_rgba(20,33,61,0.08)] ${className}`}
      style={{
        borderColor: '#E6ECF7',
        background,
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  accent = {
    main: COLORS.blue,
    soft: COLORS.blueSoft,
  },
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: Accent;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent.main }}
        />

        <span
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ color: accent.main }}
        >
          {eyebrow}
        </span>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>

      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function AssociationFilter({
  association,
  count,
  accent,
  selected,
  onSelect,
}: {
  association: AssociationData;
  count: number;
  accent: Accent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
      style={{
        borderColor: selected ? accent.main : COLORS.line,
        backgroundColor: selected ? accent.main : COLORS.white,
        color: selected ? COLORS.white : COLORS.ink,
        boxShadow: selected
          ? `0 8px 18px ${accent.main}30`
          : '0 5px 14px rgba(20,33,61,0.04)',
      }}
    >
      {association.name}

      <span
        className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs"
        style={{
          backgroundColor: selected ? '#FFFFFF30' : accent.soft,
          color: selected ? COLORS.white : accent.main,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function MonthDivider({
  label,
  isPast,
}: {
  label: string;
  isPast: boolean;
}) {
  const accent = isPast
    ? {
        main: '#64748B',
        soft: '#F1F5F9',
        line: '#CBD5E1',
      }
    : {
        main: COLORS.purple,
        soft: COLORS.purpleSoft,
        line: '#DDD0FA',
      };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: accent.soft,
          color: accent.main,
        }}
      >
        <CalendarDays className="h-4 w-4" />
      </div>

      <h3
        className="shrink-0 text-base font-extrabold tracking-tight sm:text-lg"
        style={{ color: accent.main }}
      >
        {label}
      </h3>

      <div
        className="h-px min-w-6 flex-1"
        style={{ backgroundColor: accent.line }}
      />
    </div>
  );
}

function EventCard({
  item,
  accent,
  isPast,
}: {
  item: AgendaEvent;
  accent: Accent;
  isPast: boolean;
}) {
  const { association, event } = item;

  return (
    <a
      href={`/${association.slug}/events/${event.slug}`}
      className={`block rounded-[24px] border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,33,61,0.10)] ${
        isPast ? 'opacity-80 hover:opacity-100' : ''
      }`}
      style={{ borderColor: '#E7EDF8' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:items-center">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
            style={{
              backgroundColor: isPast ? '#94A3B8' : accent.main,
            }}
          >
            <CalendarDays className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: isPast ? COLORS.muted : accent.main,
              }}
            >
              {getAgendaDateLabel(event.date)}
            </div>

            <h2 className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
              {event.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: isPast ? '#F1F5F9' : accent.soft,
                  color: isPast ? '#64748B' : accent.main,
                }}
              >
                {association.name}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0"
                  style={{
                    color: isPast ? '#64748B' : accent.main,
                  }}
                />
                {event.location}
              </span>

              {isPast ? (
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Événement passé
                </span>
              ) : null}
            </div>

            {event.description ? (
              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-600">
                {event.description}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="shrink-0 rounded-2xl px-4 py-3 text-center sm:min-w-32"
          style={{
            backgroundColor: isPast ? '#F1F5F9' : accent.soft,
            color: isPast ? '#64748B' : accent.main,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Heure
          </div>

          <div className="mt-1 whitespace-nowrap text-base font-bold">
            {formatEventTime(event)}
          </div>
        </div>
      </div>
    </a>
  );
}

function EmptyAgenda({
  hasPastEvents,
}: {
  hasPastEvents: boolean;
}) {
  return (
    <div
      className="rounded-[24px] border border-dashed p-8 text-center"
      style={{
        borderColor: '#8B5CF640',
        backgroundColor: '#FCFAFF',
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: COLORS.purpleSoft,
          color: COLORS.purple,
        }}
      >
        <CalendarDays className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-900">
        Aucun événement à venir
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {hasPastEvents
          ? 'Utilisez le bouton « Précédent » pour consulter les événements passés.'
          : 'Aucun événement ne correspond actuellement au filtre sélectionné.'}
      </p>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const visiblePages = Array.from(
    { length: pageCount },
    (_, index) => index + 1,
  ).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === pageCount ||
      Math.abs(pageNumber - page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination de l’agenda"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-white px-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        style={{ borderColor: COLORS.line }}
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </button>

      {visiblePages.map((pageNumber, index) => {
        const previousPage = visiblePages[index - 1];

        const showSeparator =
          previousPage !== undefined &&
          pageNumber - previousPage > 1;

        return (
          <span key={pageNumber} className="contents">
            {showSeparator ? (
              <span className="px-1 text-slate-400">…</span>
            ) : null}

            <button
              type="button"
              onClick={() => onChange(pageNumber)}
              aria-current={
                pageNumber === page ? 'page' : undefined
              }
              className="flex h-11 min-w-11 items-center justify-center rounded-2xl border px-3 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor:
                  pageNumber === page
                    ? COLORS.purple
                    : COLORS.line,
                backgroundColor:
                  pageNumber === page
                    ? COLORS.purple
                    : COLORS.white,
                color:
                  pageNumber === page
                    ? COLORS.white
                    : COLORS.ink,
              }}
            >
              {pageNumber}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-white px-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        style={{ borderColor: COLORS.line }}
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default function EventsPage() {
  const associations = useMemo(() => listAssociations(), []);

  const [selectedAssociation, setSelectedAssociation] =
    useState<string>('all');

  const accentByAssociation = useMemo(() => {
    return new Map(
      associations.map((association, index) => [
        association.slug,
        associationAccents[
          index % associationAccents.length
        ],
      ]),
    );
  }, [associations]);

  const allEvents = useMemo<AgendaEvent[]>(() => {
    return associations
      .flatMap((association) =>
        association.events.map((event) => ({
          id: `${association.slug}-${event.id}`,
          association,
          event,
          sortDate: getEventSortDate(
            event.date,
            event.time,
          ),
        })),
      )
      .filter(
        (item) =>
          !Number.isNaN(item.sortDate.getTime()),
      )
      .sort(
        (firstEvent, secondEvent) =>
          firstEvent.sortDate.getTime() -
          secondEvent.sortDate.getTime(),
      );
  }, [associations]);

  const filteredEvents = useMemo(() => {
    if (selectedAssociation === 'all') {
      return allEvents;
    }

    return allEvents.filter(
      (item) =>
        item.association.slug === selectedAssociation,
    );
  }, [allEvents, selectedAssociation]);

  const {
    pages,
    initialPage,
    pastCount,
    futureCount,
  } = useMemo(
    () => buildAgendaPages(filteredEvents),
    [filteredEvents],
  );

  const [page, setPage] = useState(initialPage);

  const pageCount = pages.length;

  const currentAgendaPage =
    pages[page - 1] ??
    pages[initialPage - 1] ??
    pages[0];

  const paginatedEvents =
    currentAgendaPage?.events ?? [];

  const isViewingPast =
    currentAgendaPage?.kind === 'past';

  const monthGroups = useMemo(
    () => groupEventsByMonth(paginatedEvents),
    [paginatedEvents],
  );

  const selectedAssociationName =
    selectedAssociation === 'all'
      ? null
      : associations.find(
          (association) =>
            association.slug === selectedAssociation,
        )?.name ?? null;

  useEffect(() => {
    setPage(initialPage);
  }, [selectedAssociation, initialPage]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > pageCount) {
      return;
    }

    setPage(nextPage);

    window.requestAnimationFrame(() => {
      document
        .getElementById('agenda-events')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    });
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(20,33,61,0.04)] transition hover:-translate-y-0.5"
          style={{ borderColor: COLORS.line }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </a>

        <ShellCard
          className="p-5 sm:p-7"
          background="linear-gradient(135deg, #FFFFFF 0%, #F7FBFF 48%, #F3ECFF 100%)"
        >
          <SectionTitle
            eyebrow="Vie du village"
            title="Agenda de Wangen"
            description="Retrouvez tous les événements publiés par la commune et les associations de Wangen."
            accent={{
              main: COLORS.purple,
              soft: COLORS.purpleSoft,
            }}
          />

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedAssociation('all')
              }
              aria-pressed={
                selectedAssociation === 'all'
              }
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{
                borderColor:
                  selectedAssociation === 'all'
                    ? COLORS.purple
                    : COLORS.line,
                backgroundColor:
                  selectedAssociation === 'all'
                    ? COLORS.purple
                    : COLORS.white,
                color:
                  selectedAssociation === 'all'
                    ? COLORS.white
                    : COLORS.ink,
              }}
            >
              Tous les événements

              <span
                className="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor:
                    selectedAssociation === 'all'
                      ? '#FFFFFF30'
                      : COLORS.purpleSoft,
                  color:
                    selectedAssociation === 'all'
                      ? COLORS.white
                      : COLORS.purple,
                }}
              >
                {allEvents.length}
              </span>
            </button>

            {associations.map((association) => {
              const accent =
                accentByAssociation.get(
                  association.slug,
                ) ?? associationAccents[0];

              return (
                <AssociationFilter
                  key={association.slug}
                  association={association}
                  count={association.events.length}
                  accent={accent}
                  selected={
                    selectedAssociation ===
                    association.slug
                  }
                  onSelect={() =>
                    setSelectedAssociation(
                      association.slug,
                    )
                  }
                />
              );
            })}
          </div>
        </ShellCard>

        <ShellCard
          id="agenda-events"
          className="scroll-mt-4 p-5 sm:p-6"
          background={
            isViewingPast
              ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)'
              : 'linear-gradient(180deg, #FBF7FF 0%, #FFFFFF 100%)'
          }
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{
                  color: isViewingPast
                    ? COLORS.muted
                    : COLORS.purple,
                }}
              >
                {isViewingPast ? 'Archives' : 'À venir'}
              </div>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {isViewingPast
                  ? selectedAssociationName
                    ? `Événements passés — ${selectedAssociationName}`
                    : 'Événements passés'
                  : selectedAssociationName
                    ? `Prochains événements — ${selectedAssociationName}`
                    : 'Prochains événements'}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isViewingPast
                  ? 'Vous consultez les événements archivés. Avancez dans la pagination pour revenir aux événements à venir.'
                  : 'Les prochains événements sont classés par date et regroupés par mois.'}
              </p>
            </div>

            <div
              className="inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: isViewingPast
                  ? '#F1F5F9'
                  : COLORS.purpleSoft,
                color: isViewingPast
                  ? '#64748B'
                  : COLORS.purple,
              }}
            >
              <CalendarDays className="h-4 w-4" />

              {isViewingPast
                ? pastCount
                : futureCount}{' '}
              événement
              {(isViewingPast
                ? pastCount
                : futureCount) > 1
                ? 's'
                : ''}
            </div>
          </div>

          {monthGroups.length > 0 ? (
            <div className="space-y-8">
              {monthGroups.map((group) => (
                <section key={group.key}>
                  <MonthDivider
                    label={group.label}
                    isPast={isViewingPast}
                  />

                  <div className="mt-4 space-y-3">
                    {group.events.map((item) => {
                      const accent =
                        accentByAssociation.get(
                          item.association.slug,
                        ) ?? associationAccents[0];

                      return (
                        <EventCard
                          key={item.id}
                          item={item}
                          accent={accent}
                          isPast={isViewingPast}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyAgenda
              hasPastEvents={pastCount > 0}
            />
          )}

          {pastCount > 0 && !isViewingPast ? (
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Les pages précédentes contiennent les
              événements passés.
            </p>
          ) : null}

          {isViewingPast && futureCount > 0 ? (
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Utilisez « Suivant » pour revenir aux
              événements à venir.
            </p>
          ) : null}

          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={changePage}
          />
        </ShellCard>
      </div>
    </AppShell>
  );
}