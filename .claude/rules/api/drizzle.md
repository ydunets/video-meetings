---
paths:
  - 'apps/api/src/database/schema.ts'
  - 'apps/api/drizzle/*.sql'
  - 'apps/api/drizzle.config.ts'
---

# Drizzle schema and migrations

`apps/api/src/database/schema.ts` is the single schema source. The table
ownership per module is listed in `apps/api/CLAUDE.md` ("Modules"); only the
handlers of the owning module query a table.

## Migrations

- Change `schema.ts`, then run
  `pnpm --filter api db:generate --name <verb>_<subject>` (for example
  `add_user_avatar`). Commit the generated `drizzle/NNNN_<name>.sql` together
  with its snapshot in `drizzle/meta/`, which must never be edited by hand.
- Never edit a migration that has been applied. Hand-edit only a migration
  that has not been applied yet, and only when the generated SQL would break
  existing rows: `0003_add_user_name.sql` fills `name` from the email before it
  sets `NOT NULL`.
- For SQL that Drizzle cannot derive from the schema, create an empty
  migration with `db:generate --custom --name <name>`.
- Apply migrations with `pnpm --filter api db:migrate`; both e2e suites need
  a migrated database.

## Tables and columns

- Table names are plural snake_case (`meeting_files`). Each property is
  camelCase and passes its snake_case column name explicitly:
  `ownerId: uuid('owner_id')`.
- Every primary key is `id: uuid('id').primaryKey().defaultRandom()`. Do not
  use serial or integer identifiers.
- Timestamps are `timestamp('<event>_at', { withTimezone: true })`; a creation
  time adds `.notNull().defaultNow()`.
- A boolean column states the fact it holds with an `is_` or `has_` prefix
  (`isArchived: boolean('is_archived')`), is `.notNull()` and has an explicit
  default. No boolean column exists yet, so this rule sets the precedent.
- Columns are `.notNull()` unless absence is a real state. Columns that are
  meaningful only together are nullable together, are always written
  together, and carry a comment saying so (`avatarStorageName`,
  `avatarMimeType`).
- A default value comes from an exported named constant
  (`INITIAL_TOKEN_VERSION`), never from a literal.

## Relations and indexes

- A foreign key column is named `<entity>_id` and declares its delete
  behaviour: `.references(() => users.id, { onDelete: 'cascade' })`.
- Postgres does not index foreign keys automatically, so every foreign key
  column gets an index in the table callback:
  `index('<table>_<column>_idx').on(table.<column>)`.
- A unique constraint is a named unique index,
  `uniqueIndex('<table>_<column>_unique')`. Case-insensitive uniqueness uses an
  expression index on `lower(email)` (`users_email_lower_unique`), because the
  database must
  enforce it even for rows written outside the application.

## Types

- Export the row type directly after each table:
  `export type Meeting = typeof meetings.$inferSelect;`. Handlers map rows to a
  response shape (`toMeetingResponse`) and never return a row as it is.
