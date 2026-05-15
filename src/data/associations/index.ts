import cercleRaw from './cercledhistoires.json';
import communeRaw from './commune.json';
import notreVillageRaw from './notrevillagemonvillage.json';
import type { AssociationData } from '../../lib/associationSchema';
import { validateAssociationData } from '../../lib/associationSchema';

const associations: AssociationData[] = [
  validateAssociationData(notreVillageRaw, 'src/data/associations/notrevillagemonvillage.json'),
  validateAssociationData(cercleRaw, 'src/data/associations/cercledhistoires.json'),
  validateAssociationData(communeRaw, 'src/data/associations/commune.json'),
];

const associationsBySlug = new Map(associations.map((association) => [association.slug, association]));

export function getAssociationBySlug(slug: string) {
  return associationsBySlug.get(slug) ?? null;
}

export function listAssociationPaths() {
  return associations.map((association) => `/${association.slug}`);
}

export function listAssociations() {
  return associations;
}

export function getAssociationEventBySlugs(associationSlug: string, eventSlug: string) {
  const association = getAssociationBySlug(associationSlug);
  if (!association) {
    return null;
  }

  const event = association.events.find((candidate) => candidate.slug === eventSlug);
  if (!event) {
    return null;
  }

  return { association, event };
}

export function listAssociationEventPaths() {
  return associations.flatMap((association) =>
    association.events.map((event) => `/${association.slug}/events/${event.slug}`),
  );
}
