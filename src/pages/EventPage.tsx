import { ArrowLeft, CalendarDays, Clock3, Image as ImageIcon, MapPin } from 'lucide-react';
import type { AssociationData, AssociationEvent } from '../lib/associationSchema';
import { getAutoEventMedia } from '../lib/eventMedia';

type EventPageProps = {
  association: AssociationData;
  event: AssociationEvent;
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

export default function EventPage({ association, event }: EventPageProps) {
  const autoMedia = getAutoEventMedia(association.slug, event.slug);
  const banner = event.banner?.src ?? autoMedia.banner;
  const main = event.main?.src ?? autoMedia.main;
  const carouselPhotos: Array<{ src: string; alt?: string; caption?: string }> =
    event.carousel?.map((photo) => ({ src: photo.src, alt: photo.alt, caption: photo.caption })) ??
    event.gallery?.map((photo) => ({ src: photo.src, alt: photo.alt, caption: photo.caption })) ??
    autoMedia.carousel?.map((src) => ({ src })) ??
    [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap gap-2">
          <a
            href={`/${association.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour {association.name}
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Accueil
          </a>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Événement</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-sm font-medium text-blue-700">{association.name}</p>

          {banner ? (
            <figure className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={banner}
                alt={event.banner?.alt ?? event.title}
                className="h-56 w-full object-contain sm:h-72"
                loading="eager"
              />
              {event.banner?.caption ? (
                <figcaption className="px-3 py-2 text-xs text-slate-600">{event.banner.caption}</figcaption>
              ) : null}
            </figure>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-blue-700" />
              {formatEventDate(event.date)}
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Clock3 className="h-4 w-4 text-blue-700" />
              {event.time ?? 'Horaire à venir'}
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <MapPin className="h-4 w-4 text-blue-700" />
              {event.location}
            </div>
          </div>

          {event.description ? (
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{event.description}</p>
          ) : null}

          {event.body ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{event.body}</p>
          ) : null}

          {main ? (
            <figure className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={main}
                alt={event.main?.alt ?? event.title}
                className="mx-auto max-h-[70vh] w-full object-contain"
                loading="lazy"
              />
              {event.main?.caption ? (
                <figcaption className="px-3 py-2 text-xs text-slate-600">{event.main.caption}</figcaption>
              ) : null}
            </figure>
          ) : null}
        </section>

        {carouselPhotos.length > 0 ? (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ImageIcon className="h-4 w-4 text-blue-700" />
              Galerie photo
            </div>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {carouselPhotos.map((photo) => (
                <figure
                  key={photo.src}
                  className="min-w-[260px] snap-start overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:min-w-[320px]"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt ?? event.title}
                    className="h-56 w-full object-contain"
                    loading="lazy"
                  />
                  {photo.caption ? (
                    <figcaption className="px-3 py-2 text-xs text-slate-600">{photo.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
