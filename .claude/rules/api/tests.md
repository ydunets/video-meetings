---
paths:
  - 'apps/api/src/**/*.spec.ts'
  - 'apps/api/test/**/*.ts'
  - 'apps/api/vitest.config*.ts'
---

# API tests (Vitest)

Both suites run on Vitest with `globals: true`, so `describe`, `it` and
`expect` are not imported.

## Unit tests

- A unit spec sits next to its source as `<file>.spec.ts` and covers a pure
  module (`password.ts`, `allowed-file-formats.ts`) without Nest or a
  database. Run it with `pnpm --filter api test`.
- Logic that needs Nest, Drizzle or HTTP is covered by the e2e suite, not by a
  unit test with mocked providers.

## End-to-end tests

- Each feature has `test/<feature>.e2e-spec.ts`. The suite boots the full
  `AppModule` with `Test.createTestingModule` in `beforeAll`, calls
  `app.close()` in `afterAll`, and sends requests with Supertest through
  `request(app.getHttpServer())`. It runs against the real, migrated Postgres;
  nothing is mocked.
- Users come from `test/test-users.ts`: `registerUserAndGetToken(app)` goes
  through the real registration endpoint, and `createUniqueEmail()` gives every
  test its own account. No test cleans the database, and no two tests share a
  user, which also keeps each account under the sign-in attempt limit.
- Request helpers are verb-named functions inside the `describe`
  (`createMeeting`, `listMeetings`) and send the token with
  `.auth(accessToken, { type: 'bearer' })`.
- Endpoints live in an `ENDPOINTS` constant with path builders
  (`getMeetingPath`), statuses use `HttpStatus`, and fixtures are named
  constants (`MALFORMED_MEETING_ID`) or builders with overrides
  (`buildMeetingInput`).
- Every protected route has authorization cases (no token, malformed token),
  usually through `it.each`, and every owner-scoped route has a case where
  another user's token receives 404.
- E2E files run in parallel. A suite that counts stored files on disk owns its
  folder inside `FILES_STORAGE_DIR` (avatars live in `avatars/` for that
  reason).
- Iterate on one file with `pnpm --filter api test:e2e <file>`.
