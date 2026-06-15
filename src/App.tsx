import type { ReactNode } from 'react';
import {
  CalendarCheck,
  CalendarDays,
  DoorOpen,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  type LucideIcon,
} from 'lucide-react';
import { listAssociations } from './data/associations';

const COLORS = {
  blue: '#1457F2',
  blueDark: '#0D3DA8',
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

type OpeningHour = {
  id: string;
  label: string;
  days: string;
  hours: string;
  icon: LucideIcon;
  accent: Accent;
};

type UpcomingEvent = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  associationName: string;
  eventPath: string;
};

const mairie = {
  name: 'Mairie de Wangen',
  subtitle: 'Wangen, premier village fortifié sur la Route des Vins d’Alsace.',
  scope: 'Retrouvez les informations, événements et contacts utiles de la commune.',
  addressLines: ['44 Rue des Vignerons', '67520 Wangen'],
  phone: '+33 3 88 87 50 02',
  email: 'contact@mairie-wangen.fr',
};

const openingHours: OpeningHour[] = [
  {
    id: 'phone',
    label: 'Permanence téléphonique',
    days: 'Du lundi au vendredi, sauf le mercredi',
    hours: '09:30 – 11:30',
    icon: PhoneCall,
    accent: { main: COLORS.blue, soft: COLORS.blueSoft },
  },
  {
    id: 'public',
    label: 'Ouverture au public',
    days: 'Lundi, jeudi, vendredi',
    hours: '15:00 – 17:00',
    icon: DoorOpen,
    accent: { main: COLORS.green, soft: COLORS.greenSoft },
  },
];

const eventAccents: Accent[] = [
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
});

function getEventSortDate(date: string, time?: string) {
  const timePart = time ? `${time}:00` : '23:59:00';
  return new Date(`${date}T${timePart}`);
}

function getAgendaDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return agendaDateFormatter.format(parsed);
}

function getUpcomingAssociationEvents(limit: number): UpcomingEvent[] {
  const now = new Date();

  return listAssociations()
    .flatMap((association) =>
      association.events.map((event) => {
        const sortDate = getEventSortDate(event.date, event.time);

        return {
          id: `${association.slug}-${event.id}`,
          title: event.title,
          dateLabel: getAgendaDateLabel(event.date),
          timeLabel: event.time ?? 'Horaire à venir',
          location: event.location,
          associationName: association.name,
          eventPath: `/${association.slug}/events/${event.slug}`,
          sortDate,
        };
      }),
    )
    .filter((event) => !Number.isNaN(event.sortDate.getTime()) && event.sortDate >= now)
    .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      title: event.title,
      dateLabel: event.dateLabel,
      timeLabel: event.timeLabel,
      location: event.location,
      associationName: event.associationName,
      eventPath: event.eventPath,
    }));
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
}: {
  children: ReactNode;
  className?: string;
  background?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border shadow-[0_14px_40px_rgba(20,33,61,0.08)] ${className}`}
      style={{ borderColor: '#E6ECF7', background }}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  accent = { main: COLORS.blue, soft: COLORS.blueSoft },
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: Accent;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent.main }} />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ color: accent.main }}
        >
          {eyebrow}
        </span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function TopAction({
  href,
  children,
  accent,
}: {
  href: string;
  children: ReactNode;
  accent: Accent;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(20,33,61,0.14)] transition hover:-translate-y-0.5"
      style={{ backgroundColor: accent.main }}
    >
      {children}
    </a>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  accent,
  noWrapDesktop = false,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  accent: Accent;
  noWrapDesktop?: boolean;
  className?: string;
}) {
  const content = href ? (
    <a
      href={href}
      className={`${noWrapDesktop ? 'break-words sm:whitespace-nowrap' : 'break-words'} hover:underline`}
    >
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border bg-white p-4 ${className}`}
      style={{ borderColor: '#E7EDF8' }}
    >
      <div className="rounded-2xl p-3" style={{ backgroundColor: accent.soft, color: accent.main }}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: accent.main }}>
          {label}
        </div>
        <div className="mt-1 text-[15px] leading-6 text-slate-800">{content}</div>
      </div>
    </div>
  );
}

function HoursCard() {
  return (
    <ShellCard className="h-full p-5 sm:p-6" background="linear-gradient(180deg, #FFF8E1 0%, #FFFDF5 100%)">
      <SectionTitle
        eyebrow="Horaires"
        title="Permanences et accueil"
        description="Les créneaux principaux de contact avec la mairie."
        accent={{ main: COLORS.orange, soft: COLORS.orangeSoft }}
      />

      <div className="space-y-4">
        {openingHours.map((item) => (
          <div
            key={item.id}
            className="rounded-[24px] border bg-white p-4 shadow-[0_8px_20px_rgba(20,33,61,0.04)]"
            style={{ borderColor: '#F6E9B8' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="rounded-2xl p-3" style={{ backgroundColor: item.accent.soft, color: item.accent.main }}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold leading-tight text-slate-950">{item.label}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{item.days}</div>
                </div>
              </div>
              <div className="shrink-0 whitespace-nowrap text-base font-bold" style={{ color: item.accent.main }}>
                {item.hours}
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-[24px] border bg-white p-4" style={{ borderColor: '#F6E9B8' }}>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3" style={{ backgroundColor: COLORS.pinkSoft, color: COLORS.pink }}>
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="font-bold text-slate-950">Et sur rendez-vous</div>
          </div>
        </div>
      </div>
    </ShellCard>
  );
}

function EventCard({ event, accent }: { event: UpcomingEvent; accent: Accent }) {
  return (
    <a
      href={event.eventPath}
      className="block rounded-[24px] border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,33,61,0.10)]"
      style={{ borderColor: '#E7EDF8' }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accent.main }}
          >
            <CalendarDays className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: accent.main }}>
              {event.dateLabel}
            </div>
            <h3 className="mt-1 truncate text-base font-bold text-slate-950">{event.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span>{event.associationName}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" style={{ color: accent.main }} />
                {event.location}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: accent.soft, color: accent.main }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Heure</div>
          <div className="mt-1 whitespace-nowrap text-lg font-bold">{event.timeLabel}</div>
        </div>
      </div>
    </a>
  );
}

function EmptyAgenda() {
  return (
    <div
      className="rounded-[24px] border border-dashed p-8 text-center"
      style={{ borderColor: '#1457F240', backgroundColor: '#FAFCFF' }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: COLORS.blueSoft, color: COLORS.blue }}
      >
        <CalendarDays className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Aucun événement publié</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Les prochains événements apparaîtront ici dès qu’ils seront publiés depuis le back-office.
      </p>
    </div>
  );
}


const logoSrc = '/images/blason.webp';
const heroImageSrc = '/images/homeimage.png';

function HeroArtwork() {
  return (
    <div className="flex w-full shrink-0 items-center justify-center lg:w-[42%]">
      <div className="w-full max-w-[520px] rounded-[34px] bg-gradient-to-br from-white/80 via-[#EAF2FF]/75 to-[#FFF4CF]/80 p-3 shadow-[0_18px_44px_rgba(20,33,61,0.10)]">
        <div
          className="rounded-[28px] bg-[#F7FBFF] p-2"
          style={{
            WebkitMaskImage:
              'radial-gradient(ellipse 96% 88% at 56% 46%, #000 0%, #000 56%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.24) 90%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 96% 88% at 56% 46%, #000 0%, #000 56%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.24) 90%, transparent 100%)',
          }}
        >
          <img
            src={heroImageSrc}
            alt="Illustration de la porte fortifiée de Wangen"
            className="rounded-[17px] block h-auto w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function MairieWangenHome() {
  const upcomingEvents = getUpcomingAssociationEvents(5);
  const hasEvents = upcomingEvents.length > 0;

  return (
    <AppShell>
      <div className="space-y-5">
        <ShellCard
          className="overflow-hidden p-5 sm:p-7"
          background="linear-gradient(135deg, #FFFFFF 0%, #F7FBFF 48%, #EAF2FF 100%)"
        >
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-5">
                <img
                  src={logoSrc}
                  alt="Blason de Wangen"
                  className="h-20 w-20 rounded-[24px] shadow-[0_10px_24px_rgba(20,33,61,0.12)] sm:h-24 sm:w-24"
                />

                <div className="min-w-0">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                    {mairie.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-bold uppercase leading-7 tracking-[0.28em]" style={{ color: COLORS.blue }}>
                    {mairie.subtitle}
                  </p>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                    {mairie.scope}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                <TopAction href={`tel:${mairie.phone}`} accent={{ main: COLORS.blue, soft: COLORS.blueSoft }}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Appeler
                </TopAction>
                <TopAction href={`mailto:${mairie.email}`} accent={{ main: COLORS.green, soft: COLORS.greenSoft }}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Envoyer un mail
                </TopAction>
              </div>
            </div>

            <HeroArtwork />
          </div>
        </ShellCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ShellCard className="h-full p-5 sm:p-6">
            <SectionTitle
              eyebrow="Infos pratiques"
              title="Coordonnées et accès"
              description="Trouvez rapidement les informations essentielles de la mairie."
              accent={{ main: COLORS.green, soft: COLORS.greenSoft }}
            />

            <div className="grid grid-cols-1 gap-4">
              <ContactRow
                icon={MapPin}
                label="Adresse"
                value={[...mairie.addressLines].join(', ')}
                accent={{ main: COLORS.blue, soft: COLORS.blueSoft }}
              />
              <ContactRow
                icon={Phone}
                label="Téléphone"
                value={mairie.phone}
                href={`tel:${mairie.phone}`}
                accent={{ main: COLORS.green, soft: COLORS.greenSoft }}
              />
              <ContactRow
                icon={Mail}
                label="Email principal"
                value={mairie.email}
                href={`mailto:${mairie.email}`}
                accent={{ main: COLORS.purple, soft: COLORS.purpleSoft }}
                noWrapDesktop
              />
            </div>
          </ShellCard>

          <HoursCard />
        </div>

        <ShellCard className="p-5 sm:p-6" background="linear-gradient(180deg, #FBF7FF 0%, #FFFFFF 100%)">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle
              eyebrow="Vie du village"
              title="Agenda à venir"
              description="Affichage en liste : un événement par ligne pour une lecture rapide."
              accent={{ main: COLORS.purple, soft: COLORS.purpleSoft }}
            />

            <a
              href="/events"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(139,92,246,0.22)]"
              style={{ backgroundColor: COLORS.purple }}
            >
              Voir tout l’agenda
            </a>
          </div>

          {hasEvents ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  accent={eventAccents[index % eventAccents.length]}
                />
              ))}
            </div>
          ) : (
            <EmptyAgenda />
          )}
        </ShellCard>

        {/* <ShellCard
          className="overflow-hidden p-0"
          background="linear-gradient(90deg, #DFF0FF 0%, #EFF7FF 58%, #FFFFFF 100%)"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="text-lg font-extrabold text-slate-950">Vivre à Wangen</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Découvrir notre village, son histoire, ses associations et ses services.
              </p>
            </div>
            <a
              href="/village"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: COLORS.blue }}
            >
              En savoir plus
            </a>
          </div>
        </ShellCard> */}
      </div>
    </AppShell>
  );
}
