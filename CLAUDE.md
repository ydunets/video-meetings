# video-meetings

A pnpm workspace with two applications. Each app's `CLAUDE.md` describes its
features and architecture; the root `README.md` describes the public API.

| Path       | Stack                                              | Default port |
| ---------- | -------------------------------------------------- | ------------ |
| `apps/web` | Next.js 16 (App Router), Tailwind CSS 4, HeroUI v3 | 3000         |
| `apps/api` | NestJS 12, Drizzle ORM, Vitest                     | 4000         |

## Commands

Find every command in the root `package.json` and in each app's
`package.json`, and run it from the repository root. The root `README.md`
describes the toolchain setup (mise), the Ralph Loop and the prerequisites of
each test suite.

## Conventions

- mise, not Corepack or nvm, manages Node.js 22 and pnpm 12: `mise.toml` holds
  the requests and the committed `mise.lock` the exact versions. The root
  `README.md` "Toolchain" section describes setup and upgrades.
- Shared tooling (Oxlint, Oxfmt, TypeScript) is installed only at the root. Do
  not add these packages, ESLint or Prettier to an app.
- Oxlint is configured in the root `.oxlintrc.json`; each app extends it with
  its own `.oxlintrc.json`. Oxfmt settings live in the root `.oxfmtrc.json`
  (single quotes, trailing commas, 80 columns).
- Files are formatted automatically after every edit (a `PostToolUse` hook in
  `.claude/settings.json`); do not run `pnpm format` by hand.
- File-type rules live in `.claude/rules/api/` (Drizzle schema and
  migrations, CQRS pieces, Vitest suites) and `.claude/rules/web/` (Playwright
  suite, Route Handlers and proxy, HeroUI components). Each rule's `paths`
  frontmatter loads it only when a matching file is read or edited, so a rule
  that applies to every file of an app belongs in that app's `CLAUDE.md`
  instead. Quote every pattern, because an invalid YAML block makes the rule
  load in every session.
- `permissions.allow` in `.claude/settings.json` pre-approves the edits,
  `pnpm`, `git` and `gh` commands, the Playwright MCP tools (`mcp__playwright`,
  registered at local scope, not in the repository) and the `ui-ux-pro-max`
  skill that the headless Ralph Loop sessions need for their checks and the web
  visual check, and `permissions.deny` blocks pushing, rebasing, opening and
  merging pull requests. Both lists apply to interactive sessions too.
- Add a dependency to the app that needs it with
  `pnpm --filter <web|api> add <package>`.
- Build outputs (`dist`, `.next`) and `.env*` files are ignored by git. Every
  configurable value lives in an env file, never as a default in code or
  `compose.yaml`; add each new variable to the matching `.env.example`.
- The two apps do not share code yet. Introduce a `packages/` workspace only
  when real shared code exists.

## Documentation maintenance

Documentation must be updated in the same change as the architecture it
describes. The documents are the root `README.md`, this file, and the
`CLAUDE.md` of the affected app.

Update them whenever a change:

- adds, removes or renames an app or a `packages/` workspace;
- changes a framework, a major dependency, or a shared tool (Oxlint, Oxfmt,
  TypeScript);
- alters a root or app script, a port, or an environment variable;
- introduces a new module boundary, data store, external service, or
  communication path between apps;
- modifies a convention recorded in these files.

Keep each statement accurate rather than exhaustive: correct or delete outdated
lines instead of appending notes. State in the final report which documents
were changed, or that none required a change.

## File Upload research

- [Express and multer](documents/researches/meeting-file-upload.md)
- [NestJS with Fastify](documents/researches/meeting-file-upload-fastify.md)

## Token economy

Every read and every command output stays in the session's context, so each
one should carry only what the task needs.

- Read the app's `CLAUDE.md` before searching that app's code; it names the
  module layout and the files that matter.
- Scope searches to `apps/` (for example `rg -n <pattern> apps/`), which keeps
  the bulky tracked files out of the results: `pnpm-lock.yaml` (about 220 KB),
  the skill data under `.agents/skills/` (JSON and CSV files of up to 870 KB)
  and the Drizzle snapshots in `apps/api/drizzle/meta/`. Answer a dependency
  question from the app's `package.json`.
- Read a long file in ranges: locate the symbol with `rg -n` first, then read
  the lines around it.
- Iterate on filtered tests (the root `README.md` "Tests" section lists the
  filters) and run the full suites once, for the final Verification.
- Trim long command output to its failure lines with `tail` or `rg`; the
  Playwright `list` reporter prints one line per test.
- Delegate a sweep across many files to an Explore subagent, which returns its
  conclusion rather than the file contents.

## Verification

Before reporting a change as complete, run `pnpm lint`, `pnpm typecheck` and
`pnpm test`, plus `pnpm build` when configuration or dependencies changed, and
the `test:e2e` suite of each app the change touches.

The Husky `pre-commit` hook enforces the same checks, including both e2e
suites, so a commit needs a migrated database and a running `pnpm dev`; when
Postgres is unreachable, the hook stops and asks for `pnpm db:up`. The
`pre-push` hook runs `pnpm lint`.
