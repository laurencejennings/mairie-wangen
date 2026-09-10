# Wangen Site (Vite + React + TypeScript)

Municipal website with:
- home page (`/`)
- association pages (`/:associationSlug`)
- event pages (`/:associationSlug/events/:eventSlug`)
- event admin (`/admin/events`)

Events are served from D1 through `/api/events`, cached in KV, and can reference optimized images stored in R2. The JSON files under `src/data/associations` remain as a local/build fallback and seed source.

## Development

```bash
npm install
npm run dev
```

`npm run dev` uses `wrangler.dev.jsonc` through `CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH`, so local development is wired to the dev D1 database name `mairie-db`.

Useful checks:

```bash
npm run validate:associations
npm run build
```

## Routes

- `/` : home page with "Agenda a venir" (next 5 upcoming events across all associations)
- `/:associationSlug` : association page
- `/:associationSlug/events/:eventSlug` : event detail page (template)
- `/admin/events` : protected event editor
- `/admin/metrics` : protected page visit dashboard

Admin API routes live under `/api/admin/...`. Keep Cloudflare Zero Trust policies covering `/admin*` and `/api/admin*`.

## Cloudflare Storage

Required bindings:

- D1 database binding: `CONTENT_DB`
- KV namespace binding: `CONTENT_CACHE`
- R2 bucket binding: `EVENT_IMAGES`
- Workers Analytics Engine binding: `PAGE_ANALYTICS`

`wrangler.jsonc` is configured for production:

```jsonc
"d1_databases": [
  {
    "binding": "CONTENT_DB",
    "database_name": "mairie-db-prod",
    "migrations_dir": "migrations"
  }
],
"kv_namespaces": [
  {
    "binding": "CONTENT_CACHE",
    "id": "93a138938f6c41c9845a036096dce85e"
  }
],
"r2_buckets": [
  {
    "binding": "EVENT_IMAGES",
    "bucket_name": "mairie-event-images"
  }
],
"analytics_engine_datasets": [
  {
    "binding": "PAGE_ANALYTICS",
    "dataset": "wangen_page_visits"
  }
]
```

`wrangler.dev.jsonc` is configured for local/dev work with D1 database `mairie-db`, KV binding `CONTENT_CACHE` using namespace `472888b5667a43f3997990788113dc5c`, R2 bucket `mairie-event-images-dev`, and Analytics Engine dataset `wangen_page_visits_dev`.

The D1 schema is defined in `src/db/schema.ts`. Generate schema migrations with Drizzle:

```bash
npm run db:generate
```

The initial migration also includes seed SQL generated from the current JSON files and event media manifest:

```bash
npm run db:seed:events
```

Apply the event migration:

```bash
npx wrangler d1 migrations apply mairie-db --local --config wrangler.dev.jsonc
npx wrangler d1 migrations apply mairie-db-prod --remote
```

Upload existing optimized event images to R2 using the same keys stored in `event_media`, for example:

```bash
npx wrangler r2 object put mairie-event-images/events/commune/corridas-de-wangen-2026-06-06/main.jpg --file public/events/commune/corridas-de-wangen-2026-06-06/main.jpg
```

Or upload all existing event images:

```bash
npm run upload:event-images -- --dry-run
npm run upload:event-images

npm run upload:event-images:dev -- --dry-run
npm run upload:event-images:dev
```

The script scans `public/events` and uploads each image with the same R2 object key, for example `public/events/commune/example/main.jpg` becomes `events/commune/example/main.jpg`.

Public event JSON is cached in KV. Admin writes and image uploads invalidate the `content:events:v1` KV entry; the next public request rebuilds it from D1.

## Page Visit Metrics

Public page views are sent from the browser to `/api/analytics/page-view`. Admin pages and API paths are excluded. The Worker writes privacy-preserving aggregate events to Workers Analytics Engine without cookies or visitor identifiers.

The admin dashboard at `/admin/metrics` reads aggregated metrics from Cloudflare's Analytics Engine SQL API. Configure the Cloudflare account ID as an environment variable and store the read token as a secret:

```bash
npx wrangler secret put ANALYTICS_READ_TOKEN
```

The token needs Cloudflare Account Analytics Read permission.

## Content Source

In production, use `/admin/events` to create and edit events. The editor writes to D1 and can upload already-optimized banner/main images to R2.

### JSON Fallback

Association files:
- `src/data/associations/notrevillagemonvillage.json`
- `src/data/associations/cercledhistoires.json`

### Event JSON shape

Each event supports shared fields so all event pages use the same template.

```json
{
  "id": "nvmv-rendezvous-aux-jardins-2026-06-07",
  "slug": "rendezvous-aux-jardins-2026",
  "title": "Rendez vous aux jardins",
  "date": "2026-06-07",
  "time": "10:30",
  "location": "Wangen",
  "description": "Short summary shown in cards.",
  "body": "Long text shown on the event detail page.",
  "banner": {
    "src": "/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/banner.webp",
    "alt": "Rendez vous aux jardins banner",
    "caption": "Optional banner caption"
  },
  "main": {
    "src": "/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/main.webp",
    "alt": "Rendez vous aux jardins main image"
  },
  "carousel": [
    {
      "src": "/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/carousel/01.webp",
      "alt": "Garden path",
      "caption": "Optional caption"
    }
  ]
}
```

Notes:
- `id`, `slug`, `title`, `date`, `location` are required.
- `time` is optional.
- `banner` is optional.
- `main` is optional.
- `carousel` is optional.
- `gallery` is still accepted for backward compatibility.
- For most cases, you can omit these and rely on automatic folder lookup.

## Add Photos Per Event

Recommended folder layout in `public/`:

```text
public/
  events/
    <association-slug>/
      <event-slug>/
        banner.webp
        carousel/
          01.webp
          02.webp
          03.webp
```

Example:

```text
public/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/banner.webp
public/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/carousel/01.webp
```

### Automatic lookup convention (no manual photo JSON required)

Event pages now auto-discover media files using this convention:

- Hero banner: `banner.<ext>` (or `hero.<ext>`)
- Main image: `main.<ext>` (or `principal.<ext>`)
- Carousel: all images under `carousel/` (sorted by filename)

Example:

```text
public/events/notrevillagemonvillage/rendezvous-aux-jardins-2026/
  banner.webp
  main.webp
  carousel/
    01.webp
    02.webp
```

Supported extensions for auto-discovery:
- `.avif .webp .jpg .jpeg .png .gif .tif .tiff .heic .heif`

Build/dev automatically regenerate the media manifest via:

```bash
npm run generate:event-media
```

You can still override auto-discovery in JSON with explicit `banner`, `main`, `carousel` fields.

## Keep Images Lean (Repo + Builds)

### Practical rules

- Prefer `webp` for photos.
- Keep one optimized banner and a small optimized carousel set.
- Do not commit original camera files (`.heic`, `.raw`, huge `.jpg`) to the repo.
- Keep originals outside the repo (or in cloud storage), commit only web-ready files.

### Size targets (good defaults)

- Banner: max width `1920px`, target file size `200-450 KB`
- Carousel images: max width `1400px`, target file size `120-300 KB`

### macOS quick commands (`sips` + optional `cwebp`)

Resize banner:

```bash
sips -Z 1920 input-banner.jpg --out banner.jpg
```

Resize carousel images:

```bash
mkdir -p carousel-optimized
for f in carousel-original/*.{jpg,jpeg,png}; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  sips -Z 1400 "$f" --out "carousel-optimized/${base%.*}.jpg"
done
```

Convert to WebP (if `cwebp` is installed):

```bash
cwebp -q 80 banner.jpg -o banner.webp
for f in carousel-optimized/*.jpg; do
  [ -e "$f" ] || continue
  cwebp -q 78 "$f" -o "${f%.jpg}.webp"
done
```

### Automated macOS script (recommended)

Use the built-in script to optimize all images in a folder recursively:

```bash
npm run optimize:images -- public/events-src public/events
```

Common options:

```bash
npm run optimize:images -- --to-webp --max-width 1600 --max-kb 350 public/events-src public/events
npm run optimize:images -- --in-place --max-width 1400 public/events/notrevillagemonvillage
```

What it does:
- scans `.jpg/.jpeg/.png/.tif/.tiff/.heic/.heif`
- resizes with `sips` (max dimension)
- optionally converts to `.webp` (`--to-webp`, requires `cwebp`)
- fails with exit code `2` if optimized files are still larger than `--max-kb`

Script location:
- `scripts/optimize-images-macos.sh`

Help:

```bash
bash scripts/optimize-images-macos.sh --help
```

### ImageMagick alternative

```bash
magick input-banner.jpg -resize 1920x -strip -quality 80 banner.webp
magick mogrify -path carousel-optimized -resize 1400x -strip -quality 78 -format webp carousel-original/*
```

### Cloudflare cost-friendly approach

Start simple with static files in `public/events/...`.
If galleries become large later, move originals to R2 and keep serving optimized derivatives.

## Editorial Workflow (Recommended)

1. Create/update event JSON entry in the association file.
2. Add optimized `banner.webp`, optional `main.webp`, and optional `carousel/*.webp` in `public/events/...`.
3. Run image optimization script before committing large image batches.
4. Run:

```bash
npm run generate:event-media
npm run validate:associations
npm run build
```

5. Deploy.
