import { ArrowLeft, CalendarDays, Clock3, Mail, MapPin } from 'lucide-react';
import type { AssociationData } from '../lib/associationSchema';
import { formatEventDate, sortEvents } from '../lib/eventUtils';

type AssociationPageProps = {
  association: AssociationData;
};

export default function AssociationPage({ association }: AssociationPageProps) {
  const events = sortEvents(association.events);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <a
          href="/"
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour accueil
        </a>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Association</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {association.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-blue-700">{association.subtitle}</p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{association.description}</p>
          {association.contactEmail ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <Mail className="h-4 w-4 text-blue-700" />
              <a href={`mailto:${association.contactEmail}`} className="font-medium hover:underline">
                {association.contactEmail}
              </a>
            </div>
          ) : null}
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="h-4 w-4 text-blue-700" />
            Événements à venir
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Aucun événement publié.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <a
                  key={event.id}
                  href={`/${association.slug}/events/${event.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">{event.title}</h2>
                      {event.description ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p>
                      ) : null}
                    </div>
                    {event.time ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                        <Clock3 className="h-4 w-4 text-blue-700" />
                        {event.time}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                        <Clock3 className="h-4 w-4 text-blue-700" />
                        Horaire à venir
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
                    <div className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-blue-700" />
                      {formatEventDate(event.date)}
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-700" />
                      {event.location}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
