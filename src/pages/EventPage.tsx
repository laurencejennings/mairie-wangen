import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Image as ImageIcon,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { AssociationData, AssociationEvent } from '../lib/associationSchema';
import { getAutoEventMedia } from '../lib/eventMedia';

type EventPageProps = {
  association: AssociationData;
  event: AssociationEvent;
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
  muted: '#475569',
  line: '#DDE7F6',
  white: '#FFFFFF',
};

function formatEventDate(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
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

function Eyebrow({ color = COLORS.blue, children }: { color?: string; children: ReactNode }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-[0.24em]"
      style={{ color }}
    >
      {children}
    </p>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  color,
  softColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  softColor: string;
}) {
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
        <div
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {label}
        </div>
        <div className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {value}
        </div>
      </div>
    </div>
  );
}

function MediaFrame({
  src,
  alt,
  caption,
  eager = false,
  compact = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  eager?: boolean;
  compact?: boolean;
}) {
  return (
    <figure
      className="overflow-hidden rounded-[28px] border bg-white p-2 shadow-[0_16px_36px_rgba(20,33,61,0.08)]"
      style={{ borderColor: COLORS.line }}
    >
      <div
        className="overflow-hidden rounded-[22px]"
        style={{
          background:
            'linear-gradient(135deg, #F7FBFF 0%, #EEF4FF 50%, #FFF7DC 100%)',
        }}
      >
        <img
          src={src}
          alt={alt}
          className={`mx-auto w-full object-contain ${compact ? 'h-56' : 'max-h-[70vh]'}`}
          loading={eager ? 'eager' : 'lazy'}
        />
      </div>

      {caption ? (
        <figcaption className="px-3 py-2 text-xs leading-5 text-slate-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function EventPage({ association, event }: EventPageProps) {
  const autoMedia = getAutoEventMedia(association.slug, event.slug);
  const banner = event.banner?.src ?? autoMedia.banner;
  const main = event.main?.src ?? autoMedia.main;

  const carouselPhotos: Array<{ src: string; alt?: string; caption?: string }> =
    event.carousel?.map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      caption: photo.caption,
    })) ??
    event.gallery?.map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      caption: photo.caption,
    })) ??
    autoMedia.carousel?.map((src) => ({ src })) ??
    [];

  const bodyMarkdown = event.body;

  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        background:
          'linear-gradient(180deg, #F7FBFF 0%, #FFFFFF 38%, #FFFDF6 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap gap-3">
          <NavButton href={`/${association.slug}`}>
            <ArrowLeft className="h-4 w-4" />
            Retour {association.name}
          </NavButton>

          <NavButton href="/">Accueil</NavButton>
        </div>

        <ShellCard tinted className="overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <Eyebrow>Événement</Eyebrow>

              <h1
                className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl"
                style={{ color: COLORS.ink }}
              >
                {event.title}
              </h1>

              <p
                className="mt-3 text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: COLORS.blue }}
              >
                {association.name}
              </p>

              {event.description ? (
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                  {event.description}
                </p>
              ) : null}
            </div>

            {banner ? (
              <div className="w-full shrink-0 lg:w-[42%]">
                <MediaFrame
                  src={banner}
                  alt={event.banner?.alt ?? event.title}
                  caption={event.banner?.caption}
                  eager
                  compact
                />
              </div>
            ) : null}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoPill
              icon={CalendarDays}
              label="Date"
              value={formatEventDate(event.date)}
              color={COLORS.blue}
              softColor={COLORS.blueSoft}
            />

            <InfoPill
              icon={Clock3}
              label="Heure"
              value={formatEventTime(event)}
              color={COLORS.green}
              softColor={COLORS.greenSoft}
            />

            <InfoPill
              icon={MapPin}
              label="Lieu"
              value={event.location}
              color={COLORS.orange}
              softColor={COLORS.orangeSoft}
            />
          </div>
        </ShellCard>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <ShellCard className="p-5 sm:p-7 lg:col-span-7">
            <Eyebrow color={COLORS.green}>Informations</Eyebrow>

            <h2
              className="mt-2 text-2xl font-bold tracking-tight"
              style={{ color: COLORS.ink }}
            >
              À propos de l’événement
            </h2>

            {bodyMarkdown ? (
              <div className="mt-5 max-w-none text-sm leading-7 text-slate-600">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-950">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p className="mt-4">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="mt-4 list-disc space-y-2 pl-5">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mt-4 list-decimal space-y-2 pl-5">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">
                        {children}
                      </strong>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="font-semibold underline underline-offset-2"
                        style={{ color: COLORS.blue }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {bodyMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Les informations détaillées seront publiées prochainement.
              </p>
            )}
          </ShellCard>

          <ShellCard className="p-5 sm:p-7 lg:col-span-5">
            <Eyebrow color={COLORS.purple}>Repères</Eyebrow>

            <h2
              className="mt-2 text-2xl font-bold tracking-tight"
              style={{ color: COLORS.ink }}
            >
              Infos pratiques
            </h2>

            <div className="mt-5 space-y-3">
              <InfoPill
                icon={CalendarDays}
                label="Date"
                value={formatEventDate(event.date)}
                color={COLORS.blue}
                softColor={COLORS.blueSoft}
              />

              <InfoPill
                icon={Clock3}
                label="Heure"
                value={formatEventTime(event)}
                color={COLORS.green}
                softColor={COLORS.greenSoft}
              />

              <InfoPill
                icon={MapPin}
                label="Lieu"
                value={event.location}
                color={COLORS.orange}
                softColor={COLORS.orangeSoft}
              />
            </div>
          </ShellCard>
        </div>

        {main ? (
          <ShellCard className="mt-5 p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: COLORS.purpleSoft, color: COLORS.purple }}
              >
                <ImageIcon className="h-5 w-5" />
              </div>

              <div>
                <Eyebrow color={COLORS.purple}>Image</Eyebrow>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {event.title ?? 'Affiche ou visuel principal'}
                </h2>
              </div>
            </div>

            <MediaFrame
              src={main}
              alt={event.main?.alt ?? event.title}
              caption={event.main?.caption}
            />
          </ShellCard>
        ) : null}

        {carouselPhotos.length > 0 ? (
          <ShellCard className="mt-5 p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: COLORS.pinkSoft, color: COLORS.pink }}
              >
                <ImageIcon className="h-5 w-5" />
              </div>

              <div>
                <Eyebrow color={COLORS.pink}>Galerie</Eyebrow>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  Galerie photo
                </h2>
              </div>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {carouselPhotos.map((photo) => (
                <figure
                  key={photo.src}
                  className="min-w-[260px] snap-start overflow-hidden rounded-[24px] border bg-white p-2 shadow-[0_10px_24px_rgba(20,33,61,0.06)] sm:min-w-[340px]"
                  style={{ borderColor: COLORS.line }}
                >
                  <div
                    className="overflow-hidden rounded-[18px]"
                    style={{
                      background:
                        'linear-gradient(135deg, #F7FBFF 0%, #EEF4FF 50%, #FFF7DC 100%)',
                    }}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt ?? event.title}
                      className="h-56 w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {photo.caption ? (
                    <figcaption className="px-3 py-2 text-xs leading-5 text-slate-500">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </ShellCard>
        ) : null}
      </div>
    </main>
  );
}