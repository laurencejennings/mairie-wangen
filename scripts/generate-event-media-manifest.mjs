import fs from 'node:fs/promises';
import path from 'node:path';

const EVENTS_ROOT = path.resolve('public/events');
const MANIFEST_OUTPUT = path.resolve('src/data/event-media-manifest.json');

const EXT_PRIORITY = ['avif', 'webp', 'jpg', 'jpeg', 'png'];
const IMAGE_EXTENSIONS = new Set([...EXT_PRIORITY, 'gif', 'tif', 'tiff', 'heic', 'heif']);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function getExtension(filename) {
  const index = filename.lastIndexOf('.');
  if (index < 0) {
    return '';
  }

  return filename.slice(index + 1).toLowerCase();
}

function getBaseName(filename) {
  const index = filename.lastIndexOf('.');
  if (index < 0) {
    return filename.toLowerCase();
  }

  return filename.slice(0, index).toLowerCase();
}

function makePublicUrl(...segments) {
  return `/${toPosixPath(path.posix.join(...segments))}`;
}

function compareByPriority(a, b) {
  const extA = getExtension(a);
  const extB = getExtension(b);

  const rankA = EXT_PRIORITY.indexOf(extA);
  const rankB = EXT_PRIORITY.indexOf(extB);

  const scoreA = rankA === -1 ? Number.MAX_SAFE_INTEGER : rankA;
  const scoreB = rankB === -1 ? Number.MAX_SAFE_INTEGER : rankB;

  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }

  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

async function listDirectoryNames(directoryPath) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function listFiles(directoryPath) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function pickNamedImage(files, baseNames) {
  const normalized = files
    .filter((filename) => IMAGE_EXTENSIONS.has(getExtension(filename)))
    .sort(compareByPriority);

  for (const baseName of baseNames) {
    const found = normalized.find((filename) => getBaseName(filename) === baseName);
    if (found) {
      return found;
    }
  }

  return null;
}

async function buildManifest() {
  const manifest = {};

  const associationSlugs = await listDirectoryNames(EVENTS_ROOT);
  for (const associationSlug of associationSlugs) {
    const associationPath = path.join(EVENTS_ROOT, associationSlug);
    const eventSlugs = await listDirectoryNames(associationPath);

    for (const eventSlug of eventSlugs) {
      const eventPath = path.join(associationPath, eventSlug);
      const eventFiles = await listFiles(eventPath);

      const banner = pickNamedImage(eventFiles, ['banner', 'hero']);
      const main = pickNamedImage(eventFiles, ['main', 'principal']);

      const carouselPath = path.join(eventPath, 'carousel');
      const carouselFiles = (await listFiles(carouselPath))
        .filter((filename) => IMAGE_EXTENSIONS.has(getExtension(filename)))
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

      const entry = {};

      if (banner) {
        entry.banner = makePublicUrl('events', associationSlug, eventSlug, banner);
      }

      if (main) {
        entry.main = makePublicUrl('events', associationSlug, eventSlug, main);
      }

      if (carouselFiles.length > 0) {
        entry.carousel = carouselFiles.map((filename) =>
          makePublicUrl('events', associationSlug, eventSlug, 'carousel', filename),
        );
      }

      if (Object.keys(entry).length > 0) {
        manifest[`${associationSlug}/${eventSlug}`] = entry;
      }
    }
  }

  return manifest;
}

async function main() {
  const manifest = await buildManifest();
  await fs.mkdir(path.dirname(MANIFEST_OUTPUT), { recursive: true });
  await fs.writeFile(MANIFEST_OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Generated event media manifest with ${Object.keys(manifest).length} event(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
