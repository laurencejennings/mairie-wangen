import { listAssociations as listStaticAssociations } from '../data/associations';
import { listStaticBulletins } from '../data/bulletins';
import { listStaticProcesVerbaux } from '../data/procesVerbaux';
import type { AssociationData } from './associationSchema';
import { normalizeBulletin, type BulletinCommunal } from './bulletinSchema';
import { normalizeProcesVerbal, type ProcesVerbal } from './procesVerbalSchema';

export type ContentState = {
  associations: AssociationData[];
  source: 'api' | 'static';
};

export type BulletinsState = {
  bulletins: BulletinCommunal[];
  source: 'api' | 'static';
};

export type ProcesVerbauxState = {
  procesVerbaux: ProcesVerbal[];
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

export async function loadBulletins(): Promise<BulletinsState> {
  try {
    const response = await fetch('/bulletins/data.json', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Bulletins API returned ${response.status}.`);
    }

    const payload = (await response.json()) as { bulletins?: BulletinCommunal[] };

    if (!Array.isArray(payload.bulletins)) {
      throw new Error('Bulletins API returned an invalid payload.');
    }

    return {
      bulletins: payload.bulletins.map(normalizeBulletin),
      source: 'api',
    };
  } catch {
    return {
      bulletins: listStaticBulletins(),
      source: 'static',
    };
  }
}


export async function loadProcesVerbaux(): Promise<ProcesVerbauxState> {
  try {
    const response = await fetch('/proces-verbaux/data.json', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Procès-verbaux API returned ${response.status}.`);
    }

    const payload = (await response.json()) as {
      procesVerbaux?: ProcesVerbal[];
    };

    if (!Array.isArray(payload.procesVerbaux)) {
      throw new Error('Procès-verbaux API returned an invalid payload.');
    }

    return {
      procesVerbaux: payload.procesVerbaux.map(normalizeProcesVerbal),
      source: 'api',
    };
  } catch {
    return {
      procesVerbaux: listStaticProcesVerbaux(),
      source: 'static',
    };
  }
}