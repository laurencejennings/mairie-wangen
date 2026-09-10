import fs from 'node:fs';

const associationFiles = [
  'src/data/associations/notrevillagemonvillage.json',
  'src/data/associations/cercledhistoires.json',
  'src/data/associations/commune.json',
];
const manifest = JSON.parse(fs.readFileSync('src/data/event-media-manifest.json', 'utf8'));

function sqlString(value) {
  if (value === undefined || value === null || value === '') {
    return 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlBoolean(value) {
  return value === false ? '0' : '1';
}

const associations = [];
const events = [];
const media = [];

for (const file of associationFiles) {
  const association = JSON.parse(fs.readFileSync(file, 'utf8'));
  associations.push(
    `  (${sqlString(association.slug)}, ${sqlString(association.name)}, ${sqlString(
      association.subtitle,
    )}, ${sqlString(association.description)}, ${sqlString(association.contactEmail)})`,
  );

  for (const event of association.events) {
    const body = Array.isArray(event.body) ? event.body.join('\n') : event.body;
    events.push(
      `  (${sqlString(event.id)}, ${sqlString(association.slug)}, ${sqlString(
        event.slug,
      )}, ${sqlString(event.title)}, ${sqlString(event.date)}, ${sqlString(
        event.time,
      )}, ${sqlString(event.endTime)}, ${sqlString(event.timeLabel)}, ${sqlString(
        event.location,
      )}, ${sqlString(event.description)}, ${sqlString(body)}, ${sqlBoolean(event.published)})`,
    );

    const autoMedia = manifest[`${association.slug}/${event.slug}`] ?? {};
    const addMedia = (kind, photo, position = 0) => {
      if (!photo) {
        return;
      }

      const src = typeof photo === 'string' ? photo : photo.src;
      if (!src) {
        return;
      }

      const objectKey = src.startsWith('/events/') ? src.slice(1) : src;
      media.push(
        `  (${sqlString(event.id)}, ${sqlString(kind)}, ${position}, ${sqlString(
          objectKey,
        )}, ${sqlString(typeof photo === 'object' ? photo.alt : undefined)}, ${sqlString(
          typeof photo === 'object' ? photo.caption : undefined,
        )})`,
      );
    };

    addMedia('banner', event.banner ?? autoMedia.banner);
    addMedia('main', event.main ?? autoMedia.main);

    const photos = event.carousel ?? event.gallery ?? autoMedia.carousel ?? [];
    const mediaKind = event.gallery ? 'gallery' : 'carousel';
    photos.forEach((photo, index) => addMedia(mediaKind, photo, index));
  }
}

const statements = [
  '',
  '-- Seed current JSON content into D1.',
  'INSERT INTO associations (slug, name, subtitle, description, contact_email) VALUES',
  `${associations.join(',\n')};`,
  '',
  'INSERT INTO events (id, association_slug, slug, title, date, time, end_time, time_label, location, description, body, published) VALUES',
  `${events.join(',\n')};`,
];

if (media.length > 0) {
  statements.push(
    '',
    'INSERT INTO event_media (event_id, kind, position, object_key, alt, caption) VALUES',
    `${media.join(',\n')};`,
  );
}

process.stdout.write(`${statements.join('\n')}\n`);
