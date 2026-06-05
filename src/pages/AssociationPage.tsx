import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import type { AssociationData, AssociationEvent } from '../lib/associationSchema';
import { formatEventDate, sortEvents } from '../lib/eventUtils';

type AssociationPageProps = {
  association: AssociationData;
};

const COLORS = {
  blue: '#1457F2',
  blueSoft: '#EEF4FF',
  green: '#2FA956',
  greenSoft: '#EAF8EF',
  orange: '#E58B00',
  orangeSoft: '#FFF5D8',
  purple: '#8B5CF6',
  purpleSoft: '#F3ECFF',
  pink: '#E83E8C',
  pinkSoft: '#FFEAF4',
  ink: '#071026',
  line: '#DDE7F6',
  white: '#FFFFFF',
};

const EVENT_ACCENTS = [
  { color: COLORS.purple, soft: COLORS.purpleSoft },
  { color: COLORS.green, soft: COLORS.greenSoft },
  { color: COLORS.orange, soft: COLORS.orangeSoft },
  { color: COLORS.pink, soft: COLORS.pinkSoft },
  { color: COLORS.blue, soft: COLORS.blueSoft },
];

function getEventDay(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function splitEventsByDate(events: AssociationEvent[]) {
  const today = getTodayStart();

  const upcoming = events.filter((event) => {
    const eventDay = getEventDay(event.date);
    return eventDay !== null && eventDay >= today;
  });

  const past = events.filter((event) => {
    const eventDay = getEventDay(event.date);
    return eventDay !== null && eventDay < today;
  });

  return {
    upcomingEvents: sortEvents(upcoming),
    pastEvents: sortEvents(past).reverse(),
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

function formatAssociationEventTime(event: AssociationEvent) {
  if (event.timeLabel) {
    return event.timeLabel;
  }

  if (event.time && event.endTime) {
    return `${formatFrenchTime(event.time)}-${formatFrenchTime(event.endTime)}`;
  }

  if (event.time) {
    return formatFrenchTime(event.time);
  }

  return 'Horaire à venir';
}

function ShellCard({
  children,
  className = '',
  tinted = false,
}: {
  children: ReactNode;
  className?: string;
  tinted?: boolean;
}) {
  return (
    <section
      className={`rounded-[30px] border shadow-[0_18px_50px_rgba(20,33,61,0.07)] ${className}`}
      style={{
        borderColor: COLORS.line,
        background: tinted
          ? 'linear-gradient(135deg, #FFFFFF 0%, #F7FBFF 48%, #FFF8DE 100%)'
          : COLORS.white,
      }}
    >
      {children}
    </section>
  );
}

function NavButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(20,33,61,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,33,61,0.08)]"
      style={{ borderColor: COLORS.line }}
    >
      {children}
    </a>
  );
}

function Eyebrow({
  color = COLORS.blue,
  children,
}: {
  color?: string;
  children: ReactNode;
}) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color }}>
      {children}
    </p>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  href,
  color,
  softColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  color: string;
  softColor: string;
}) {
  const content = href ? (
    <a href={href} className="break-words font-semibold hover:underline">
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-[22px] border bg-white px-4 py-4"
      style={{ borderColor: COLORS.line }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: softColor, color }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color }}>
          {label}
        </div>
        <div className="mt-1 break-words text-sm leading-6 text-slate-800">{content}</div>
      </div>
    </div>
  );
}

function EventCard({
  association,
  event,
  index,
  isPast = false,
}: {
  association: AssociationData;
  event: AssociationEvent;
  index: number;
  isPast?: boolean;
}) {
  const accent = EVENT_ACCENTS[index % EVENT_ACCENTS.length];
  const eventTime = formatAssociationEventTime(event);

  return (
    <a
      href={`/${association.slug}/events/${event.slug}`}
      className={`block rounded-[26px] border bg-white p-4 shadow-[0_10px_28px_rgba(20,33,61,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,33,61,0.08)] ${
        isPast ? 'opacity-75 hover:opacity-100' : ''
      }`}
      style={{ borderColor: COLORS.line }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accent.soft, color: accent.color }}
          >
            <CalendarDays className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: accent.color }}
            >
              {formatEventDate(event.date)}
            </div>

            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              {event.title}
            </h3>

            {event.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {event.description}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold"
          style={{
            backgroundColor: isPast ? '#F1F5F9' : COLORS.orangeSoft,
            color: isPast ? '#64748B' : COLORS.orange,
          }}
        >
          <Clock3 className="h-4 w-4" />
          {eventTime}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
        <div className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color: COLORS.blue }} />
          <span>{event.location}</span>
        </div>

        {isPast ? (
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Événement passé
          </span>
        ) : null}
      </div>
    </a>
  );
}

function EmptyEvents({
  label,
  color,
  softColor,
}: {
  label: string;
  color: string;
  softColor: string;
}) {
  return (
    <div
      className="rounded-[26px] border border-dashed p-8 text-center"
      style={{ borderColor: '#1457F240', backgroundColor: '#FAFCFF' }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: softColor, color }}
      >
        <CalendarDays className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-950">{label}</h3>
    </div>
  );
}

function EventsSection({
  title,
  eyebrow,
  description,
  events,
  association,
  emptyLabel,
  accentColor,
  accentSoft,
  isPast = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  events: AssociationEvent[];
  association: AssociationData;
  emptyLabel: string;
  accentColor: string;
  accentSoft: string;
  isPast?: boolean;
}) {
  return (
    <ShellCard className="mt-5 p-5 sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow color={accentColor}>{eyebrow}</Eyebrow>

          <h2
            className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: COLORS.ink }}
          >
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div
          className="inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold"
          style={{ backgroundColor: accentSoft, color: accentColor }}
        >
          <CalendarDays className="h-4 w-4" />
          {events.length} événement{events.length > 1 ? 's' : ''}
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyEvents label={emptyLabel} color={accentColor} softColor={accentSoft} />
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              association={association}
              event={event}
              index={index}
              isPast={isPast}
            />
          ))}
        </div>
      )}
    </ShellCard>
  );
}

export default function AssociationPage({ association }: AssociationPageProps) {
  const { upcomingEvents, pastEvents } = splitEventsByDate(association.events);

  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        background:
          'linear-gradient(180deg, #F7FBFF 0%, #FFFFFF 38%, #FFFDF6 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5">
          <NavButton href="/">
            <ArrowLeft className="h-4 w-4" />
            Retour accueil
          </NavButton>
        </div>

        <ShellCard tinted className="overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <Eyebrow>Association</Eyebrow>

              <h1
                className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl"
                style={{ color: COLORS.ink }}
              >
                {association.name}
              </h1>

              {association.subtitle ? (
                <p
                  className="mt-3 text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: COLORS.blue }}
                >
                  {association.subtitle}
                </p>
              ) : null}

              {association.description ? (
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
                  {association.description}
                </p>
              ) : null}
            </div>

            <div className="w-full shrink-0 lg:w-[34%]">
              <div
                className="rounded-[28px] border bg-white/85 p-4 shadow-[0_16px_40px_rgba(20,33,61,0.06)]"
                style={{ borderColor: COLORS.line }}
              >
                <Eyebrow color={COLORS.green}>Contact</Eyebrow>

                {association.contactEmail ? (
                  <div className="mt-4">
                    <InfoPill
                      icon={Mail}
                      label="Email"
                      value={association.contactEmail}
                      href={`mailto:${association.contactEmail}`}
                      color={COLORS.green}
                      softColor={COLORS.greenSoft}
                    />
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    Aucun contact publié pour le moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ShellCard>

        <EventsSection
          title="Événements à venir"
          eyebrow="Vie associative"
          description="Retrouvez les prochaines dates publiées par l’association."
          events={upcomingEvents}
          association={association}
          emptyLabel="Aucun événement à venir publié."
          accentColor={COLORS.purple}
          accentSoft={COLORS.purpleSoft}
        />

        <EventsSection
          title="Événements passés"
          eyebrow="Archives"
          description="Consultez les événements déjà organisés par l’association."
          events={pastEvents}
          association={association}
          emptyLabel="Aucun événement passé publié."
          accentColor={COLORS.green}
          accentSoft={COLORS.greenSoft}
          isPast
        />
      </div>
    </main>
  );
}