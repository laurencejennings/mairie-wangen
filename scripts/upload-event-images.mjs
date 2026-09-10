import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const imageExtensions = new Set([
  '.avif',
  '.gif',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);

function stripJsonComments(input) {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function readArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: 'wrangler.jsonc',
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--dev') {
      options.config = 'wrangler.dev.jsonc';
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--config') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--config requires a file path.');
      }
      options.config = value;
      index += 1;
      continue;
    }

    if (arg === '--bucket') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--bucket requires a bucket name.');
      }
      options.bucket = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function readBucketName(configPath, bucketOverride) {
  if (bucketOverride) {
    return bucketOverride;
  }

  const raw = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(stripJsonComments(raw));
  const bucket = config.r2_buckets?.find(
    (candidate) => candidate.binding === 'EVENT_IMAGES',
  );

  if (!bucket?.bucket_name) {
    throw new Error(`No EVENT_IMAGES R2 bucket found in ${configPath}.`);
  }

  return bucket.bucket_name;
}

async function listImages(rootDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(filePath);
        continue;
      }

      if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(filePath);
      }
    }
  }

  await walk(rootDir);
  return files.sort();
}

function objectKeyForFile(filePath) {
  return path.relative('public', filePath).split(path.sep).join('/');
}

function uploadImage({ bucketName, configPath, filePath, dryRun }) {
  const objectKey = objectKeyForFile(filePath);
  const target = `${bucketName}/${objectKey}`;

  if (dryRun) {
    console.log(`[dry-run] ${filePath} -> ${target}`);
    return;
  }

  console.log(`Uploading ${filePath} -> ${target}`);

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['wrangler', '--config', configPath, 'r2', 'object', 'put', target, '--file', filePath],
    {
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${filePath}.`);
  }
}

async function main() {
  const options = readArgs();
  const rootDir = path.join('public', 'events');
  const bucketName = await readBucketName(options.config, options.bucket);
  const images = await listImages(rootDir);

  if (images.length === 0) {
    console.log(`No event images found under ${rootDir}.`);
    return;
  }

  for (const filePath of images) {
    uploadImage({
      bucketName,
      configPath: options.config,
      filePath,
      dryRun: options.dryRun,
    });
  }

  console.log(`${options.dryRun ? 'Checked' : 'Uploaded'} ${images.length} image(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
