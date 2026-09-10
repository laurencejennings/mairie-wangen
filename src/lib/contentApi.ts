import { listAssociations as listStaticAssociations } from '../data/associations';
import type { AssociationData } from './associationSchema';

export type ContentState = {
  associations: AssociationData[];
  source: 'api' | 'static';
};

export async function loadContent(): Promise<ContentState> {
  try {
    const response = await fetch('/api/events', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Content API returned ${response.status}.`);
    }

    const payload = (await response.json()) as { associations?: AssociationData[] };

    if (!Array.isArray(payload.associations)) {
      throw new Error('Content API returned an invalid payload.');
    }

    return {
      associations: payload.associations,
      source: 'api',
    };
  } catch {
    return {
      associations: listStaticAssociations(),
      source: 'static',
    };
  }
}

export function getAssociationBySlug(associations: AssociationData[], slug: string) {
  return associations.find((association) => association.slug === slug) ?? null;
}

export function getAssociationEventBySlugs(
  associations: AssociationData[],
  associationSlug: string,
  eventSlug: string,
) {
  const association = getAssociationBySlug(associations, associationSlug);

  if (!association) {
    return null;
  }

  const event = association.events.find((candidate) => candidate.slug === eventSlug);

  if (!event) {
    return null;
  }

  return { association, event };
}
