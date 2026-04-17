import type { AssociationEvent } from './associationSchema';

export function formatEventDate(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getEventSortDate(date: string, time?: string) {
  const timePart = time ? `${time}:00` : '23:59:00';
  return new Date(`${date}T${timePart}`);
}

export function sortEvents(events: AssociationEvent[]) {
  return [...events].sort((a, b) => {
    const aSortDate = getEventSortDate(a.date, a.time);
    const bSortDate = getEventSortDate(b.date, b.time);
    return aSortDate.getTime() - bSortDate.getTime();
  });
}
