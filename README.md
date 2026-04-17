# Wangen Site (Vite + React + TypeScript)

Static-first municipal website with:
- home page (`/`)
- association pages (`/:associationSlug`)
- event pages (`/:associationSlug/events/:eventSlug`)

All association and event content is managed in JSON files under `src/data/associations`.

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run validate:associations
npm run build
```

## Routes

- `/` : home page with "Agenda a venir" (next 5 upcoming events across all associations)
- `/:associationSlug` : association page
- `/:associationSlug/events/:eventSlug` : event detail page (template)

## Content Source (JSON)

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
