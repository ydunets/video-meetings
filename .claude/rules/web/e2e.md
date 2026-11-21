---
paths:
  - 'apps/web/e2e/**/*.ts'
  - 'apps/web/playwright.config.ts'
---

# Web end-to-end tests (Playwright)

The suite drives the already running app (`pnpm dev`) at `E2E_BASE_URL` and
the real API at `API_URL`, both read from `apps/web/.env`; it starts no server.

- Import routes, API endpoints, statuses and limits from the app instead of
  repeating them: `ROUTES` and `getMeetingRoute` from `../src/lib/routes`,
  `HTTP_STATUS` and `API_ENDPOINTS` from `../src/lib/api`,
  `getMaxUploadSizeBytes` from `../src/lib/upload-limits`. The specs import
  them through relative paths, not the `@/` alias.
- Arrange state through the API and exercise only the behaviour under test in
  the browser: `createTestUser`, `createTestMeeting`, `uploadTestFile` and
  `logIn` in `e2e/test-users.ts`. Every test creates its own user, so no
  cleanup is needed.
- Locate elements by role or label first (`getByRole`, `getByLabel`), and by
  text for copy and messages (`getByText`). Use `locator()` only for a
  semantic element inside an already scoped region (`time[datetime]`), never
  for CSS classes, and do not add test ids.
- After a client navigation, Next.js keeps the previous page mounted but
  hidden, so assertions on the new page are scoped to `getByRole('main')`.
- `notFound()` inside a streaming Suspense boundary keeps HTTP 200, so a
  missing resource is asserted through its visible heading, not the status.
- Fixtures are named constants with a comment when their value matters: the
  11 MB recording exists to exceed the proxy's 10 MB body buffer.
- Iterate with `pnpm --filter web test:e2e -g "<title>"`.
