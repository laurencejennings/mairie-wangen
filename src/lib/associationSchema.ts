export type EventPhoto = {
  src: string;
  alt?: string;
  caption?: string;
};

export type AssociationEvent = {
  id: string;
  slug: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  body?: string;
  banner?: EventPhoto;
  main?: EventPhoto;
  carousel?: EventPhoto[];
  gallery?: EventPhoto[];
};

export type AssociationData = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  contactEmail?: string;
  events: AssociationEvent[];
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(record: Record<string, unknown>, key: string, source: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${source}: "${key}" must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string, source: string): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${source}: "${key}" must be a string when provided.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function validateEvent(event: unknown, source: string): AssociationEvent {
  if (!isRecord(event)) {
    throw new Error(`${source}: each event must be an object.`);
  }

  const parsed: AssociationEvent = {
    id: readRequiredString(event, 'id', source),
    slug: readRequiredString(event, 'slug', source),
    title: readRequiredString(event, 'title', source),
    date: readRequiredString(event, 'date', source),
    time: readOptionalString(event, 'time', source),
    location: readRequiredString(event, 'location', source),
    description: readOptionalString(event, 'description', source),
    body: readOptionalString(event, 'body', source),
    banner: undefined,
    main: undefined,
    carousel: undefined,
    gallery: undefined,
  };

  if (!SLUG_PATTERN.test(parsed.slug)) {
    throw new Error(`${source}: event "${parsed.id}" has invalid "slug" (${parsed.slug}).`);
  }

  if (!ISO_DATE_PATTERN.test(parsed.date)) {
    throw new Error(`${source}: event "${parsed.id}" has invalid "date" (${parsed.date}). Expected YYYY-MM-DD.`);
  }

  if (parsed.time && !HH_MM_PATTERN.test(parsed.time)) {
    throw new Error(`${source}: event "${parsed.id}" has invalid "time" (${parsed.time}). Expected HH:MM (24h).`);
  }

  const parsePhoto = (photo: unknown, field: string, index?: number): EventPhoto => {
    if (!isRecord(photo)) {
      const pointer = typeof index === 'number' ? `${field}[${index}]` : field;
      throw new Error(`${source}: event "${parsed.id}" ${pointer} must be an object.`);
    }

    return {
      src: readRequiredString(photo, 'src', source),
      alt: readOptionalString(photo, 'alt', source),
      caption: readOptionalString(photo, 'caption', source),
    };
  };

  const rawBanner = event.banner;
  if (rawBanner !== undefined) {
    parsed.banner = parsePhoto(rawBanner, 'banner');
  }

  const rawMain = event.main;
  if (rawMain !== undefined) {
    parsed.main = parsePhoto(rawMain, 'main');
  }

  const rawCarousel = event.carousel;
  if (rawCarousel !== undefined) {
    if (!Array.isArray(rawCarousel)) {
      throw new Error(`${source}: event "${parsed.id}" has invalid "carousel". Expected array.`);
    }

    parsed.carousel = rawCarousel.map((photo, index) => parsePhoto(photo, 'carousel', index));
  }

  const rawGallery = event.gallery;
  if (rawGallery !== undefined) {
    if (!Array.isArray(rawGallery)) {
      throw new Error(`${source}: event "${parsed.id}" has invalid "gallery". Expected array.`);
    }

    parsed.gallery = rawGallery.map((photo, index) => parsePhoto(photo, 'gallery', index));
  }

  return parsed;
}

export function validateAssociationData(raw: unknown, source: string): AssociationData {
  if (!isRecord(raw)) {
    throw new Error(`${source}: root value must be an object.`);
  }

  const parsed: AssociationData = {
    slug: readRequiredString(raw, 'slug', source),
    name: readRequiredString(raw, 'name', source),
    subtitle: readRequiredString(raw, 'subtitle', source),
    description: readRequiredString(raw, 'description', source),
    contactEmail: readOptionalString(raw, 'contactEmail', source),
    events: [],
  };

  if (!SLUG_PATTERN.test(parsed.slug)) {
    throw new Error(`${source}: "slug" must contain only lowercase letters, numbers, and hyphens.`);
  }

  if (parsed.contactEmail && !EMAIL_PATTERN.test(parsed.contactEmail)) {
    throw new Error(`${source}: "contactEmail" must be a valid email address.`);
  }

  const rawEvents = raw.events;
  if (!Array.isArray(rawEvents)) {
    throw new Error(`${source}: "events" must be an array.`);
  }

  parsed.events = rawEvents.map((event, index) => validateEvent(event, `${source} (events[${index}])`));

  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const event of parsed.events) {
    if (ids.has(event.id)) {
      throw new Error(`${source}: duplicate event id "${event.id}".`);
    }

    ids.add(event.id);

    if (slugs.has(event.slug)) {
      throw new Error(`${source}: duplicate event slug "${event.slug}".`);
    }

    slugs.add(event.slug);
  }

  return parsed;
}
