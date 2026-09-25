import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const associations = sqliteTable('associations', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  contactEmail: text('contact_email'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    associationSlug: text('association_slug')
      .notNull()
      .references(() => associations.slug, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    date: text('date').notNull(),
    time: text('time'),
    endTime: text('end_time'),
    timeLabel: text('time_label'),
    location: text('location').notNull(),
    description: text('description'),
    body: text('body'),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('idx_events_association_slug').on(table.associationSlug, table.slug),
    index('idx_events_association_date').on(table.associationSlug, table.date, table.time),
    index('idx_events_published_date').on(table.published, table.date, table.time),
  ],
);

export const eventMedia = sqliteTable(
  'event_media',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['banner', 'main', 'carousel', 'gallery'] }).notNull(),
    position: integer('position').notNull().default(0),
    objectKey: text('object_key').notNull(),
    alt: text('alt'),
    caption: text('caption'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_event_media_event_kind').on(table.eventId, table.kind, table.position)],
);

export const bulletins = sqliteTable(
  'bulletins',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    year: integer('year').notNull(),
    issueDate: text('issue_date').notNull(),
    description: text('description'),
    pdfObjectKey: text('pdf_object_key').notNull(),
    fileName: text('file_name'),
    fileSize: integer('file_size'),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_bulletins_published_issue_date').on(table.published, table.issueDate),
    index('idx_bulletins_year_issue_date').on(table.year, table.issueDate),
  ],
);

export const procesVerbals = sqliteTable(
  'proces_verbals',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    year: integer('year').notNull(),
    issueDate: text('issue_date').notNull(),
    description: text('description'),
    pdfObjectKey: text('pdf_object_key').notNull(),
    fileName: text('file_name'),
    fileSize: integer('file_size'),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_proces_verbals_published_issue_date').on(table.published, table.issueDate),
    index('idx_proces_verbals_year_issue_date').on(table.year, table.issueDate),
  ],
);
