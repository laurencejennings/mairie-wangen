import fs from 'node:fs/promises';
import path from 'node:path';

const associationsDir = path.resolve('src/data/associations');

const slugPattern = /^[a-z0-9-]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const hhMmPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRequiredString(record, key, file) {
  const value = record[key];
  assert(typeof value === 'string' && value.trim().length > 0, `${file}: "${key}" must be a non-empty string.`);
  return value.trim();
}

function readOptionalString(record, key, file) {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }

  assert(typeof value === 'string', `${file}: "${key}" must be a string when provided.`);

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function validateAssociationJson(data, file) {
  assert(data && typeof data === 'object' && !Array.isArray(data), `${file}: root must be an object.`);

  const slug = readRequiredString(data, 'slug', file);
  readRequiredString(data, 'name', file);
  readRequiredString(data, 'subtitle', file);
  readRequiredString(data, 'description', file);
  const contactEmail = readOptionalString(data, 'contactEmail', file);

  assert(slugPattern.test(slug), `${file}: "slug" must match ${slugPattern}.`);
  if (contactEmail) {
    assert(emailPattern.test(contactEmail), `${file}: "contactEmail" must be a valid email address.`);
  }

  const events = data.events;
  assert(Array.isArray(events), `${file}: "events" must be an array.`);

  const ids = new Set();
  const eventSlugs = new Set();
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    assert(event && typeof event === 'object' && !Array.isArray(event), `${file}: events[${i}] must be an object.`);

    const id = readRequiredString(event, 'id', file);
    const slug = readRequiredString(event, 'slug', file);
    const date = readRequiredString(event, 'date', file);
    const time = readOptionalString(event, 'time', file);

    readRequiredString(event, 'title', file);
    readRequiredString(event, 'location', file);

    assert(slugPattern.test(slug), `${file}: events[${i}].slug must match ${slugPattern}.`);
    assert(isoDatePattern.test(date), `${file}: events[${i}].date must match YYYY-MM-DD.`);
    if (time) {
      assert(hhMmPattern.test(time), `${file}: events[${i}].time must match HH:MM (24h).`);
    }
    assert(!ids.has(id), `${file}: duplicate event id "${id}".`);
    assert(!eventSlugs.has(slug), `${file}: duplicate event slug "${slug}".`);

    ids.add(id);
    eventSlugs.add(slug);

    const validatePhoto = (photo, pointer) => {
      assert(photo && typeof photo === 'object' && !Array.isArray(photo), `${file}: ${pointer} must be an object.`);
      readRequiredString(photo, 'src', file);
      readOptionalString(photo, 'alt', file);
      readOptionalString(photo, 'caption', file);
    };

    const banner = event.banner;
    if (banner !== undefined) {
      validatePhoto(banner, `events[${i}].banner`);
    }

    const main = event.main;
    if (main !== undefined) {
      validatePhoto(main, `events[${i}].main`);
    }

    const carousel = event.carousel;
    if (carousel !== undefined) {
      assert(Array.isArray(carousel), `${file}: events[${i}].carousel must be an array.`);
      for (let j = 0; j < carousel.length; j += 1) {
        validatePhoto(carousel[j], `events[${i}].carousel[${j}]`);
      }
    }

    const gallery = event.gallery;
    if (gallery !== undefined) {
      assert(Array.isArray(gallery), `${file}: events[${i}].gallery must be an array.`);
      for (let j = 0; j < gallery.length; j += 1) {
        validatePhoto(gallery[j], `events[${i}].gallery[${j}]`);
      }
    }
  }

  return slug;
}

async function main() {
  const files = (await fs.readdir(associationsDir))
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(associationsDir, file));

  assert(files.length > 0, 'No association JSON files found in src/data/associations.');

  const slugs = new Set();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(content);
    const slug = validateAssociationJson(parsed, path.relative(process.cwd(), file));

    assert(!slugs.has(slug), `Duplicate association slug "${slug}" across files.`);
    slugs.add(slug);
  }

  console.log(`Validated ${files.length} association JSON file(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
