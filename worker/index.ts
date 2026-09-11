import { listAssociations as listStaticAssociations } from '../src/data/associations';
import type { AssociationData, AssociationEvent, EventPhoto } from '../src/lib/associationSchema';
import type { BulletinCommunal } from '../src/lib/bulletinSchema';

type WangenEnv = Env & {
  CONTENT_DB?: D1Database;
  CONTENT_CACHE?: KVNamespace;
  EVENT_IMAGES?: R2Bucket;
  PAGE_ANALYTICS?: AnalyticsEngineDataset;
  PAGE_ANALYTICS_DATASET?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  ANALYTICS_READ_TOKEN?: string;
};

type EventRow = {
  id: string;
  association_slug: string;
  slug: string;
  title: string;
  date: string;
  time: string | null;
  end_time: string | null;
  time_label: string | null;
  location: string;
  description: string | null;
  body: string | null;
  published: number;
};

type AssociationRow = {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  contact_email: string | null;
};

type MediaRow = {
  event_id: string;
  kind: 'banner' | 'main' | 'carousel' | 'gallery';
  position: number;
  object_key: string;
  alt: string | null;
  caption: string | null;
};

type BulletinRow = {
  id: string;
  title: string;
  year: number;
  issue_date: string;
  description: string | null;
  pdf_object_key: string;
  file_name: string | null;
  file_size: number | null;
  published: number;
  created_at: string;
  updated_at: string;
};

type MetricsRange = '7d' | '30d' | '90d';

type AnalyticsSqlResponse = {
  data?: unknown[];
  errors?: { message?: string }[];
};

const CONTENT_CACHE_KEY = 'content:events:v1';
const BULLETINS_CACHE_KEY = 'content:bulletins:v2';
const BULLETIN_DATA_PATH = '/bulletins/data.json';
const BULLETIN_FILE_PREFIX = '/bulletins/files/';
const PAGE_ANALYTICS_DATASET = 'wangen_page_visits';
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=86400',
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init.headers,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, required = false) {
  const value = record[key];

  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${key} is required.`);
    }

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string.`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new Error(`${key} is required.`);
  }

  return trimmed.length > 0 ? trimmed : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string, fallback: boolean) {
  const value = record[key];

  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be a boolean.`);
  }

  return value;
}

function publicMediaUrl(objectKey: string) {
  return `/api/events/media/${objectKey}`;
}

function publicBulletinUrl(objectKey: string) {
  return `${BULLETIN_FILE_PREFIX}${objectKey}`;
}

function normalizeTrackedPath(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('/api/') || trimmed.startsWith('/admin')) {
    return null;
  }

  return trimmed.length > 1 && trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function readOptionalString(value: unknown, fallback = 'direct') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 120) : fallback;
}

function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|bingpreview/i.test(
    userAgent,
  );
}

async function trackPageView(request: Request, env: WangenEnv) {
  const userAgent = request.headers.get('User-Agent') ?? '';

  if (!env.PAGE_ANALYTICS || isLikelyBot(userAgent)) {
    return json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const payload = await request.json().catch(() => null);

  if (!isRecord(payload)) {
    return json({ error: 'Expected a JSON object.' }, { status: 400 });
  }

  const path = normalizeTrackedPath(payload.path);

  if (!path) {
    return json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  env.PAGE_ANALYTICS.writeDataPoint({
    indexes: [new URL(request.url).hostname],
    blobs: [
      path,
      readOptionalString(payload.referrerHost),
      readOptionalString(payload.viewport, 'unknown'),
      readOptionalString(payload.language, 'unknown'),
      request.headers.get('CF-IPCountry') ?? 'unknown',
    ],
    doubles: [1],
  });

  return json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}

function metricsRange(value: string | null): MetricsRange {
  if (value === '30d' || value === '90d') {
    return value;
  }

  return '7d';
}

function rangeDays(range: MetricsRange) {
  return Number.parseInt(range, 10);
}

function analyticsDatasetName(env: WangenEnv) {
  const dataset = env.PAGE_ANALYTICS_DATASET ?? PAGE_ANALYTICS_DATASET;

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(dataset)) {
    throw new Error('PAGE_ANALYTICS_DATASET must be a valid Analytics Engine table name.');
  }

  return dataset;
}

async function queryAnalytics<T extends Record<string, unknown>>(
  env: WangenEnv,
  sql: string,
): Promise<T[]> {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.ANALYTICS_READ_TOKEN) {
    throw new Error(
      'Analytics read credentials are not configured. Set CLOUDFLARE_ACCOUNT_ID and ANALYTICS_READ_TOKEN.',
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.ANALYTICS_READ_TOKEN}`,
      },
      body: `${sql}\nFORMAT JSON`,
    },
  );

  const text = await response.text();
  const payload = JSON.parse(text) as AnalyticsSqlResponse | unknown[];

  if (!response.ok) {
    throw new Error(text || `Analytics SQL returned ${response.status}.`);
  }

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as T[];
  }

  throw new Error('Analytics SQL returned an invalid response.');
}

function toMetricNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? Math.round(numberValue) : 0;
}

async function adminMetrics(request: Request, env: WangenEnv) {
  const url = new URL(request.url);
  const range = metricsRange(url.searchParams.get('range'));
  const days = rangeDays(range);
  const dataset = analyticsDatasetName(env);

  try {
    const [summaryRows, dailyRows, topPageRows, referrerRows] = await Promise.all([
      queryAnalytics<{ views: unknown; paths: unknown }>(
        env,
        `SELECT
          SUM(_sample_interval) AS views,
          COUNT(DISTINCT blob1) AS paths
        FROM ${dataset}
        WHERE timestamp >= NOW() - INTERVAL '${days}' DAY`,
      ),
      queryAnalytics<{ day: string; views: unknown }>(
        env,
        `SELECT
          formatDateTime(toStartOfInterval(timestamp, INTERVAL '1' DAY), '%Y-%m-%d') AS day,
          SUM(_sample_interval) AS views
        FROM ${dataset}
        WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
        GROUP BY day
        ORDER BY day`,
      ),
      queryAnalytics<{ path: string; views: unknown }>(
        env,
        `SELECT
          blob1 AS path,
          SUM(_sample_interval) AS views
        FROM ${dataset}
        WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
        GROUP BY path
        ORDER BY views DESC
        LIMIT 10`,
      ),
      queryAnalytics<{ referrer: string; views: unknown }>(
        env,
        `SELECT
          blob2 AS referrer,
          SUM(_sample_interval) AS views
        FROM ${dataset}
        WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
        GROUP BY referrer
        ORDER BY views DESC
        LIMIT 8`,
      ),
    ]);

    const summary = summaryRows[0] ?? { views: 0, paths: 0 };

    return json(
      {
        configured: true,
        range,
        summary: {
          views: toMetricNumber(summary.views),
          paths: toMetricNumber(summary.paths),
        },
        daily: dailyRows.map((row) => ({
          day: row.day,
          views: toMetricNumber(row.views),
        })),
        topPages: topPageRows.map((row) => ({
          path: row.path,
          views: toMetricNumber(row.views),
        })),
        referrers: referrerRows.map((row) => ({
          referrer: row.referrer,
          views: toMetricNumber(row.views),
        })),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    return json(
      {
        configured: false,
        range,
        error: error instanceof Error ? error.message : 'Analytics unavailable.',
        summary: {
          views: 0,
          paths: 0,
        },
        daily: [],
        topPages: [],
        referrers: [],
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  }
}

function mediaPhoto(row: MediaRow): EventPhoto {
  return {
    src: publicMediaUrl(row.object_key),
    alt: row.alt ?? undefined,
    caption: row.caption ?? undefined,
  };
}

function buildAssociations(
  associationRows: AssociationRow[],
  eventRows: EventRow[],
  mediaRows: MediaRow[],
  includeDrafts: boolean,
): AssociationData[] {
  const mediaByEventId = new Map<string, MediaRow[]>();

  for (const row of mediaRows) {
    const rows = mediaByEventId.get(row.event_id) ?? [];
    rows.push(row);
    mediaByEventId.set(row.event_id, rows);
  }

  return associationRows.map((associationRow) => {
    const events = eventRows
      .filter(
        (row) =>
          row.association_slug === associationRow.slug &&
          (includeDrafts || row.published === 1),
      )
      .map<AssociationEvent>((row) => {
        const eventMedia = (mediaByEventId.get(row.id) ?? []).sort(
          (a, b) => a.position - b.position,
        );
        const banner = eventMedia.find((media) => media.kind === 'banner');
        const main = eventMedia.find((media) => media.kind === 'main');
        const carousel = eventMedia.filter((media) => media.kind === 'carousel');
        const gallery = eventMedia.filter((media) => media.kind === 'gallery');

        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          date: row.date,
          time: row.time ?? undefined,
          endTime: row.end_time ?? undefined,
          timeLabel: row.time_label ?? undefined,
          location: row.location,
          description: row.description ?? undefined,
          body: row.body ?? undefined,
          banner: banner ? mediaPhoto(banner) : undefined,
          main: main ? mediaPhoto(main) : undefined,
          carousel: carousel.length > 0 ? carousel.map(mediaPhoto) : undefined,
          gallery: gallery.length > 0 ? gallery.map(mediaPhoto) : undefined,
          published: row.published === 1,
        };
      });

    return {
      slug: associationRow.slug,
      name: associationRow.name,
      subtitle: associationRow.subtitle,
      description: associationRow.description,
      contactEmail: associationRow.contact_email ?? undefined,
      events,
    };
  });
}

async function loadEventsFromD1(env: WangenEnv, includeDrafts = false) {
  if (!env.CONTENT_DB) {
    return {
      associations: listStaticAssociations(),
      source: 'static',
    };
  }

  const [associationResult, eventResult, mediaResult] = await Promise.all([
    env.CONTENT_DB.prepare(
      'SELECT slug, name, subtitle, description, contact_email FROM associations ORDER BY name',
    ).all<AssociationRow>(),
    env.CONTENT_DB.prepare(
      "SELECT id, association_slug, slug, title, date, time, end_time, time_label, location, description, body, published FROM events ORDER BY date, COALESCE(time, '23:59'), title",
    ).all<EventRow>(),
    env.CONTENT_DB.prepare(
      'SELECT event_id, kind, position, object_key, alt, caption FROM event_media ORDER BY event_id, kind, position',
    ).all<MediaRow>(),
  ]);

  return {
    associations: buildAssociations(
      associationResult.results,
      eventResult.results,
      mediaResult.results,
      includeDrafts,
    ),
    source: 'd1',
  };
}

async function publicEvents(env: WangenEnv) {
  if (env.CONTENT_CACHE) {
    const cached = await env.CONTENT_CACHE.get(CONTENT_CACHE_KEY);

    if (cached) {
      return new Response(cached, { headers: JSON_HEADERS });
    }
  }

  const payload = await loadEventsFromD1(env, false);
  const body = JSON.stringify(payload);

  await env.CONTENT_CACHE?.put(CONTENT_CACHE_KEY, body, {
    expirationTtl: 300,
  });

  return new Response(body, { headers: JSON_HEADERS });
}

async function adminEvents(env: WangenEnv) {
  const payload = await loadEventsFromD1(env, true);
  return json(payload, {
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}

function requireDb(env: WangenEnv) {
  if (!env.CONTENT_DB) {
    throw new Error('CONTENT_DB binding is not configured.');
  }

  return env.CONTENT_DB;
}

function parseEventPayload(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error('Expected a JSON object.');
  }

  const readPhoto = (key: 'banner' | 'main') => {
    const value = payload[key];

    if (value === undefined || value === null) {
      return undefined;
    }

    if (!isRecord(value)) {
      throw new Error(`${key} must be an object.`);
    }

    return {
      src: readString(value, 'src', true)!,
      alt: readString(value, 'alt'),
      caption: readString(value, 'caption'),
    };
  };

  return {
    id: readString(payload, 'id', true)!,
    associationSlug: readString(payload, 'associationSlug', true)!,
    slug: readString(payload, 'slug', true)!,
    title: readString(payload, 'title', true)!,
    date: readString(payload, 'date', true)!,
    time: readString(payload, 'time'),
    endTime: readString(payload, 'endTime'),
    timeLabel: readString(payload, 'timeLabel'),
    location: readString(payload, 'location', true)!,
    description: readString(payload, 'description'),
    body: readString(payload, 'body'),
    published: readBoolean(payload, 'published', true),
    banner: readPhoto('banner'),
    main: readPhoto('main'),
  };
}

function objectKeyFromMediaSrc(src: string) {
  if (src.startsWith('/api/events/media/')) {
    return decodeURIComponent(src.slice('/api/events/media/'.length));
  }

  if (src.startsWith('/events/')) {
    return src.slice(1);
  }

  return null;
}

async function syncSingleEventMedia(
  db: D1Database,
  eventId: string,
  kind: 'banner' | 'main',
  photo?: EventPhoto,
) {
  if (!photo) {
    return;
  }

  const objectKey = objectKeyFromMediaSrc(photo.src);

  if (!objectKey) {
    return;
  }

  await db
    .prepare('DELETE FROM event_media WHERE event_id = ? AND kind = ?')
    .bind(eventId, kind)
    .run();

  await db
    .prepare(
      'INSERT INTO event_media (event_id, kind, position, object_key, alt, caption) VALUES (?, ?, 0, ?, ?, ?)',
    )
    .bind(eventId, kind, objectKey, photo.alt ?? null, photo.caption ?? null)
    .run();
}

async function upsertEvent(request: Request, env: WangenEnv, existingId?: string) {
  const db = requireDb(env);
  const event = parseEventPayload(await request.json());
  const id = existingId ?? event.id;

  await db
    .prepare(
      `INSERT INTO events (
        id, association_slug, slug, title, date, time, end_time, time_label,
        location, description, body, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        association_slug = excluded.association_slug,
        slug = excluded.slug,
        title = excluded.title,
        date = excluded.date,
        time = excluded.time,
        end_time = excluded.end_time,
        time_label = excluded.time_label,
        location = excluded.location,
        description = excluded.description,
        body = excluded.body,
        published = excluded.published,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      id,
      event.associationSlug,
      event.slug,
      event.title,
      event.date,
      event.time ?? null,
      event.endTime ?? null,
      event.timeLabel ?? null,
      event.location,
      event.description ?? null,
      event.body ?? null,
      event.published ? 1 : 0,
    )
    .run();

  await syncSingleEventMedia(db, id, 'banner', event.banner);
  await syncSingleEventMedia(db, id, 'main', event.main);
  await invalidatePublicEventsCache(env);

  return json({ ok: true, id });
}

async function invalidatePublicEventsCache(env: WangenEnv) {
  await env.CONTENT_CACHE?.delete(CONTENT_CACHE_KEY);
}

async function invalidatePublicBulletinsCache(env: WangenEnv) {
  await env.CONTENT_CACHE?.delete(BULLETINS_CACHE_KEY);
}

async function deleteEvent(eventId: string, env: WangenEnv) {
  const db = requireDb(env);

  await db.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
  await invalidatePublicEventsCache(env);

  return json({ ok: true });
}

async function uploadEventImage(request: Request, eventId: string, env: WangenEnv) {
  const db = requireDb(env);

  if (!env.EVENT_IMAGES) {
    throw new Error('EVENT_IMAGES binding is not configured.');
  }

  const form = await request.formData();
  const file = form.get('image');
  const kind = form.get('kind');
  const associationSlug = form.get('associationSlug');
  const eventSlug = form.get('eventSlug');

  if (!(file instanceof File)) {
    throw new Error('image file is required.');
  }

  if (kind !== 'banner' && kind !== 'main') {
    throw new Error('kind must be banner or main.');
  }

  if (typeof associationSlug !== 'string' || typeof eventSlug !== 'string') {
    throw new Error('associationSlug and eventSlug are required.');
  }

  const event = await db
    .prepare('SELECT id FROM events WHERE id = ?')
    .bind(eventId)
    .first<{ id: string }>();

  if (!event) {
    return json(
      { error: "Save the event before uploading an image." },
      {
        status: 404,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const objectKey = `events/${associationSlug}/${eventSlug}/${kind}-${Date.now()}.${extension}`;

  await env.EVENT_IMAGES.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });

  await db
    .prepare('DELETE FROM event_media WHERE event_id = ? AND kind = ?')
    .bind(eventId, kind)
    .run();

  await db
    .prepare(
      'INSERT INTO event_media (event_id, kind, position, object_key, alt, caption) VALUES (?, ?, 0, ?, NULL, NULL)',
    )
    .bind(eventId, kind, objectKey)
    .run();

  await invalidatePublicEventsCache(env);

  return json({
    ok: true,
    objectKey,
    src: publicMediaUrl(objectKey),
  });
}

async function uploadDraftEventImage(request: Request, env: WangenEnv) {
  if (!env.EVENT_IMAGES) {
    throw new Error('EVENT_IMAGES binding is not configured.');
  }

  const form = await request.formData();
  const file = form.get('image');
  const kind = form.get('kind');
  const associationSlug = form.get('associationSlug');
  const eventSlug = form.get('eventSlug');

  if (!(file instanceof File)) {
    throw new Error('image file is required.');
  }

  if (kind !== 'banner' && kind !== 'main') {
    throw new Error('kind must be banner or main.');
  }

  if (typeof associationSlug !== 'string' || typeof eventSlug !== 'string') {
    throw new Error('associationSlug and eventSlug are required.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const objectKey = `events/${associationSlug}/${eventSlug}/${kind}-${Date.now()}.${extension}`;

  await env.EVENT_IMAGES.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });

  return json({
    ok: true,
    objectKey,
    src: publicMediaUrl(objectKey),
  });
}

async function eventImage(request: Request, env: WangenEnv, objectKey: string) {
  if (!env.EVENT_IMAGES) {
    return new Response('EVENT_IMAGES binding is not configured.', { status: 503 });
  }

  const cache = caches.default;
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const object = await env.EVENT_IMAGES.get(objectKey);

  if (!object) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  const response = new Response(object.body, { headers });
  await cache.put(request, response.clone());

  return response;
}

function bulletinFromRow(row: BulletinRow): BulletinCommunal {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    issueDate: row.issue_date,
    description: row.description ?? undefined,
    pdfUrl: publicBulletinUrl(row.pdf_object_key),
    fileName: row.file_name ?? undefined,
    fileSize: row.file_size ?? undefined,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadBulletinsFromD1(env: WangenEnv, includeDrafts = false) {
  if (!env.CONTENT_DB) {
    return {
      bulletins: [],
      source: 'static',
    };
  }

  const result = await env.CONTENT_DB.prepare(
    `SELECT id, title, year, issue_date, description, pdf_object_key, file_name, file_size,
      published, created_at, updated_at
    FROM bulletins
    WHERE ? = 1 OR published = 1
    ORDER BY year DESC, issue_date DESC, title`,
  )
    .bind(includeDrafts ? 1 : 0)
    .all<BulletinRow>();

  return {
    bulletins: result.results.map(bulletinFromRow),
    source: 'd1',
  };
}

async function publicBulletins(env: WangenEnv) {
  if (env.CONTENT_CACHE) {
    const cached = await env.CONTENT_CACHE.get(BULLETINS_CACHE_KEY);

    if (cached) {
      return new Response(cached, { headers: JSON_HEADERS });
    }
  }

  const payload = await loadBulletinsFromD1(env, false);
  const body = JSON.stringify(payload);

  await env.CONTENT_CACHE?.put(BULLETINS_CACHE_KEY, body, {
    expirationTtl: 300,
  });

  return new Response(body, { headers: JSON_HEADERS });
}

async function adminBulletins(env: WangenEnv) {
  const payload = await loadBulletinsFromD1(env, true);
  return json(payload, {
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}

function readFormString(form: FormData, key: string, required = false) {
  const value = form.get(key);

  if (value === null) {
    if (required) {
      throw new Error(`${key} is required.`);
    }

    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string.`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new Error(`${key} is required.`);
  }

  return trimmed.length > 0 ? trimmed : undefined;
}

function readFormBoolean(form: FormData, key: string, fallback: boolean) {
  const value = form.get(key);

  if (value === null) {
    return fallback;
  }

  return value === '1' || value === 'true';
}

function safeObjectSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function saveBulletinPdf(file: File, bulletinId: string, env: WangenEnv) {
  if (!env.EVENT_IMAGES) {
    throw new Error('EVENT_IMAGES binding is not configured.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    throw new Error('Only PDF files are accepted.');
  }

  const originalName = safeObjectSegment(file.name || 'bulletin.pdf') || 'bulletin.pdf';
  const objectKey = `bulletins/${safeObjectSegment(bulletinId)}-${Date.now()}-${originalName}`;

  await env.EVENT_IMAGES.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: 'application/pdf',
      contentDisposition: `inline; filename="${originalName}"`,
    },
  });

  return {
    objectKey,
    fileName: file.name || originalName,
    fileSize: file.size,
  };
}

async function upsertBulletin(request: Request, env: WangenEnv, existingId?: string) {
  const db = requireDb(env);
  const form = await request.formData();
  const id = existingId ?? readFormString(form, 'id', true)!;
  const title = readFormString(form, 'title', true)!;
  const issueDate = readFormString(form, 'issueDate', true)!;
  const yearValue = Number(readFormString(form, 'year', true));
  const description = readFormString(form, 'description');
  const published = readFormBoolean(form, 'published', true);
  const file = form.get('pdf');

  if (!Number.isInteger(yearValue) || yearValue < 1900 || yearValue > 2200) {
    throw new Error('year must be a valid year.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    throw new Error('issueDate must be YYYY-MM-DD.');
  }

  const existing = existingId
    ? await db
        .prepare('SELECT pdf_object_key, file_name, file_size FROM bulletins WHERE id = ?')
        .bind(existingId)
        .first<{
          pdf_object_key: string;
          file_name: string | null;
          file_size: number | null;
        }>()
    : null;

  let pdf = existing
    ? {
        objectKey: existing.pdf_object_key,
        fileName: existing.file_name ?? undefined,
        fileSize: existing.file_size ?? undefined,
      }
    : null;

  if (file instanceof File && file.size > 0) {
    pdf = await saveBulletinPdf(file, id, env);
  }

  if (!pdf) {
    throw new Error('pdf file is required.');
  }

  await db
    .prepare(
      `INSERT INTO bulletins (
        id, title, year, issue_date, description, pdf_object_key, file_name, file_size,
        published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        year = excluded.year,
        issue_date = excluded.issue_date,
        description = excluded.description,
        pdf_object_key = excluded.pdf_object_key,
        file_name = excluded.file_name,
        file_size = excluded.file_size,
        published = excluded.published,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      id,
      title,
      yearValue,
      issueDate,
      description ?? null,
      pdf.objectKey,
      pdf.fileName ?? null,
      pdf.fileSize ?? null,
      published ? 1 : 0,
    )
    .run();

  await invalidatePublicBulletinsCache(env);

  return json({ ok: true, id, pdfUrl: publicBulletinUrl(pdf.objectKey) });
}

async function deleteBulletin(bulletinId: string, env: WangenEnv) {
  const db = requireDb(env);

  await db.prepare('DELETE FROM bulletins WHERE id = ?').bind(bulletinId).run();
  await invalidatePublicBulletinsCache(env);

  return json({ ok: true });
}

async function bulletinFile(request: Request, env: WangenEnv, objectKey: string) {
  if (!env.EVENT_IMAGES) {
    return new Response('EVENT_IMAGES binding is not configured.', { status: 503 });
  }

  const object = await env.EVENT_IMAGES.get(objectKey);

  if (!object) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/pdf');
  headers.set('Cache-Control', 'public, max-age=3600');

  if (url.searchParams.get('download') === '1') {
    const fallbackName = objectKey.split('/').pop() ?? 'bulletin.pdf';
    headers.set('Content-Disposition', `attachment; filename="${fallbackName}"`);
  }

  return new Response(object.body, { headers });
}

async function handleApi(request: Request, env: WangenEnv) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (request.method === 'GET' && path === '/api/events') {
      return publicEvents(env);
    }

    if (request.method === 'GET' && path === '/api/bulletins') {
      return publicBulletins(env);
    }

    if (request.method === 'GET' && path.startsWith('/api/bulletins/files/')) {
      const publicPath = `${BULLETIN_FILE_PREFIX}${path.replace('/api/bulletins/files/', '')}`;
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = publicPath;
      return Response.redirect(redirectUrl.toString(), 308);
    }

    if (request.method === 'GET' && path.startsWith('/api/events/media/')) {
      return eventImage(
        request,
        env,
        decodeURIComponent(path.replace('/api/events/media/', '')),
      );
    }

    if (path === '/api/analytics/page-view' && request.method === 'POST') {
      return trackPageView(request, env);
    }

    if (path === '/api/admin/metrics' && request.method === 'GET') {
      return adminMetrics(request, env);
    }

    if (path === '/api/admin/events' && request.method === 'GET') {
      return adminEvents(env);
    }

    if (path === '/api/admin/bulletins' && request.method === 'GET') {
      return adminBulletins(env);
    }

    if (path === '/api/admin/events' && request.method === 'POST') {
      return upsertEvent(request, env);
    }

    if (path === '/api/admin/bulletins' && request.method === 'POST') {
      return upsertBulletin(request, env);
    }

    if (path === '/api/admin/event-images' && request.method === 'POST') {
      return uploadDraftEventImage(request, env);
    }

    const eventMatch = path.match(/^\/api\/admin\/events\/([^/]+)(?:\/images)?$/);

    if (eventMatch?.[1]) {
      const eventId = decodeURIComponent(eventMatch[1]);

      if (path.endsWith('/images') && request.method === 'POST') {
        return uploadEventImage(request, eventId, env);
      }

      if (request.method === 'PUT') {
        return upsertEvent(request, env, eventId);
      }

      if (request.method === 'DELETE') {
        return deleteEvent(eventId, env);
      }
    }

    const bulletinMatch = path.match(/^\/api\/admin\/bulletins\/([^/]+)$/);

    if (bulletinMatch?.[1]) {
      const bulletinId = decodeURIComponent(bulletinMatch[1]);

      if (request.method === 'PUT') {
        return upsertBulletin(request, env, bulletinId);
      }

      if (request.method === 'DELETE') {
        return deleteBulletin(bulletinId, env);
      }
    }

    return json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error.',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  }
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === BULLETIN_DATA_PATH) {
      return publicBulletins(env);
    }

    if (request.method === 'GET' && url.pathname.startsWith(BULLETIN_FILE_PREFIX)) {
      return bulletinFile(
        request,
        env,
        decodeURIComponent(url.pathname.replace(BULLETIN_FILE_PREFIX, '')),
      );
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<WangenEnv>;
