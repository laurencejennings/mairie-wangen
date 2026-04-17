import type { ReactNode } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  DoorOpen,
  FileText,
  Hammer,
  House,
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
  blueSoft: '#EEF4FF',
  gold: '#F2C318',
  goldSoft: '#FFF8D9',
  ink: '#14213D',
  line: '#D9E3F7',
  white: '#FFFFFF',
};

type OpeningHour = {
  id: string;
  label: string;
  days: string;
  hours: string;
  icon: LucideIcon;
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

type CitizenAction = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tag: string;
};

const mairie = {
  name: 'Mairie de Wangen',
  subtitle: 'Wangen, premier village fortifié sur la Route des Vins d’Alsace.',
  scope: 'Retrouvez les informations, démarches et contacts utiles de la commune.',
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
  },
  {
    id: 'public',
    label: 'Ouverture au public',
    days: 'Lundi, jeudi, vendredi',
    hours: '15:00 – 17:00',
    icon: DoorOpen,
  },
];

const citizenActions: CitizenAction[] = [
  {
    title: 'Aides à la rénovation',
    description:
      'Subventions, accompagnement et informations utiles pour rénover une façade, une toiture ou améliorer un logement.',
    icon: House,
    href: '#',
    tag: 'Habitat',
  },
  {
    title: 'Urbanisme et travaux',
    description:
      'Déclaration préalable, permis, pièces à fournir et contacts avant de commencer des travaux.',
    icon: Hammer,
    href: '#',
    tag: 'Démarches',
  },
  {
    title: 'Formulaires et documents',
    description:
      'Téléchargements, formulaires communaux et documents pratiques à retrouver au même endroit.',
    icon: FileText,
    href: '#',
    tag: 'Documents',
  },
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
          'linear-gradient(180deg, #f8fbff 0%, #ffffff 34%, #fffdf6 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </main>
  );
}

function ShellCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border bg-white shadow-[0_10px_30px_rgba(20,33,61,0.06)] ${className}`}
      style={{ borderColor: COLORS.line }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-5">
      <div
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: COLORS.blue }}
      >
        {eyebrow}
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function SmallTag({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        borderColor: gold ? '#F2C31855' : '#1457F225',
        backgroundColor: gold ? COLORS.goldSoft : COLORS.blueSoft,
        color: gold ? COLORS.ink : COLORS.blue,
      }}
    >
      {children}
    </span>
  );
}

function TopAction({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
      style={{
        borderColor: primary ? COLORS.blue : COLORS.line,
        backgroundColor: primary ? COLORS.blue : COLORS.white,
        color: primary ? COLORS.white : COLORS.ink,
      }}
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
  noWrapDesktop = false,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
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
      className={`flex items-start gap-3 rounded-2xl border p-3 ${className}`}
      style={{ borderColor: COLORS.line, backgroundColor: '#FBFDFF' }}
    >
      <div className="rounded-xl p-2" style={{ backgroundColor: COLORS.blueSoft, color: COLORS.blue }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COLORS.blue }}>
          {label}
        </div>
        <div className="mt-1 text-sm leading-6 text-slate-800">{content}</div>
      </div>
    </div>
  );
}

function HoursBlock() {
  return (
    <div className="rounded-[24px] border p-4" style={{ borderColor: COLORS.line, backgroundColor: COLORS.goldSoft }}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Clock3 className="h-4 w-4" style={{ color: COLORS.blue }} />
        Horaires
      </div>
      <div className="space-y-2">
        {openingHours.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-white px-3 py-2.5 text-sm"
            style={{ borderColor: '#F2C31833' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="rounded-lg p-1.5" style={{ backgroundColor: COLORS.blueSoft, color: COLORS.blue }}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="truncate font-semibold text-slate-800">{item.label}</span>
              </div>
              <span className="shrink-0 whitespace-nowrap font-semibold text-slate-700">{item.hours}</span>
            </div>
            <div className="mt-1.5 pl-9 text-xs text-slate-500">{item.days}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: UpcomingEvent }) {
  return (
    <a
      href={event.eventPath}
      className="block rounded-[24px] border bg-white p-4 hover:shadow-[0_10px_24px_rgba(20,33,61,0.08)]"
      style={{ borderColor: COLORS.line }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: COLORS.blue }}>
            {event.dateLabel}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            <span className="font-medium">{event.associationName}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{event.title}</h3>
        </div>
        <div className="rounded-2xl px-3 py-2 text-center" style={{ backgroundColor: COLORS.goldSoft, color: COLORS.ink }}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em]">Heure</div>
          <div className="mt-1 text-sm font-semibold whitespace-nowrap">{event.timeLabel}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4" style={{ color: COLORS.blue }} />
        <span>{event.location}</span>
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
      <h3 className="mt-4 text-lg font-semibold text-slate-900">Aucun événement publié</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Les prochains événements apparaîtront ici dès qu’ils seront publiés depuis le back-office.
      </p>
    </div>
  );
}

function CitizenActionCard({ item }: { item: CitizenAction }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="block rounded-[24px] border p-4 transition hover:shadow-[0_10px_24px_rgba(20,33,61,0.08)]"
      style={{ borderColor: COLORS.line, backgroundColor: '#FFFFFF' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-2xl p-3" style={{ backgroundColor: COLORS.blueSoft, color: COLORS.blue }}>
          <Icon className="h-5 w-5" />
        </div>
        <SmallTag gold>{item.tag}</SmallTag>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.blue }}>
        Ouvrir
        <ChevronRight className="h-4 w-4" />
      </div>
    </a>
  );
}

const logoSrc = '/images/blason.webp';

export default function MairieWangenHome() {
  const upcomingEvents = getUpcomingAssociationEvents(5);
  const hasEvents = upcomingEvents.length > 0;

  return (
    <AppShell>
      <div className="space-y-4 lg:space-y-5">
        <ShellCard className="overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* <WangenBadge /> */}
              <img src={logoSrc} alt="Blason de Wangen" className="h-14 w-14 rounded-2xl" />

              <div className="min-w-0">
                {/* <div className="flex flex-wrap items-center gap-2">
                  <SmallTag>Accueil mairie</SmallTag>
                  <SmallTag>Version sobre</SmallTag>
                  <SmallTag gold>Bleu & or</SmallTag>
                </div> */}

                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {mairie.name}
                </h1>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: COLORS.blue }}>
                  {mairie.subtitle}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {mairie.scope}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
              <TopAction href={`tel:${mairie.phone}`}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Appeler
              </TopAction>
              <TopAction href={`mailto:${mairie.email}`}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Envoyer un mail
              </TopAction>
            </div>
          </div>
        </ShellCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-5">
            <ShellCard className="h-full p-4 sm:p-5">
              <SectionTitle
                eyebrow="Infos pratiques"
                title="Horaires, coordonnées et accès"
                description="Trouvez rapidement les informations essentielles de la mairie."
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContactRow
                  icon={MapPin}
                  label="Adresse"
                  value={[...mairie.addressLines].join(', ')}
                />
                <ContactRow
                  icon={Phone}
                  label="Téléphone"
                  value={mairie.phone}
                  href={`tel:${mairie.phone}`}
                />
                <ContactRow
                  icon={Mail}
                  label="Email principal"
                  value={mairie.email}
                  href={`mailto:${mairie.email}`}
                  noWrapDesktop
                  className="sm:col-span-2"
                />
              </div>

              <div className="mt-4">
                <HoursBlock />
              </div>
            </ShellCard>
          </div>

          <div className="lg:col-span-7">
            <ShellCard className="h-full p-4 sm:p-5">
              <SectionTitle
                eyebrow="Vie du village"
                title="Agenda à venir"
                description="Affichage en liste: un événement par ligne pour une lecture rapide."
              />

              {hasEvents ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyAgenda />
              )}
            </ShellCard>
          </div>

          {/* <div className="lg:col-span-12">
            <ShellCard className="p-4 sm:p-5">
              <SectionTitle
                eyebrow="Services aux habitants"
                title="Démarches, aides, rénovation"
                description="Bloc orienté usage réel pour les demandes fréquentes de la commune."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {citizenActions.map((item) => (
                  <CitizenActionCard key={item.title} item={item} />
                ))}
              </div>

              <div
                className="mt-4 flex flex-col gap-3 rounded-[24px] border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: '#F2C31855', backgroundColor: COLORS.goldSoft }}
              >
                <div>
                  <div className="font-semibold text-slate-900">Prévu pour Cloudflare Workers</div>
                  <div className="mt-1 leading-6 text-slate-600">
                    Les horaires, événements et contenus pourront être branchés ensuite sur le back-end sans changer la structure de la page.
                  </div>
                </div>
                <a href="#" className="inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.blue }}>
                  Voir l’intégration
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </ShellCard>
          </div> */}
        </div>

        {/* <ShellCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-950">Footer mairie</div>
              <div className="mt-1 text-sm text-slate-600">
                {mairie.addressLines.join(', ')} · {mairie.phone} · {mairie.email}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SmallTag>Mentions légales</SmallTag>
              <SmallTag>Accessibilité</SmallTag>
              <SmallTag>Contact</SmallTag>
            </div>
          </div>
        </ShellCard> */}
      </div>
    </AppShell>
  );
}
