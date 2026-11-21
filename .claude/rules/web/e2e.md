---
paths:
  - 'apps/web/e2e/**/*.ts'
  - 'apps/web/playwright.config.ts'
---

# Web end-to-end tests (Playwright)

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
  text for copy and messages (`getByText`). Use `locator()` only for an
  element that has no role or label, by tag and narrowed by its content
  (`time[datetime]`, or a `div` filtered with `has:`), never by CSS class, and
  do not add test ids.
- After a client navigation, Next.js keeps the previous page mounted but
  hidden, so assertions on the new page are scoped to `getByRole('main')`.
- Fixtures are named constants with a comment when their value matters: the
  11 MB recording exists to exceed the proxy's 10 MB body buffer.
- Iterate with `pnpm --filter web test:e2e -g "<title>"`.
