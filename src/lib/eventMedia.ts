import manifestRaw from '../data/event-media-manifest.json';

type EventMediaEntry = {
  banner?: string;
  main?: string;
  carousel?: string[];
};

const manifest = manifestRaw as Record<string, EventMediaEntry>;

export function getAutoEventMedia(associationSlug: string, eventSlug: string): EventMediaEntry {
  const key = `${associationSlug}/${eventSlug}`;
  return manifest[key] ?? {};
}
