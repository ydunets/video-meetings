---
paths:
  - 'apps/api/src/**/commands/*.ts'
  - 'apps/api/src/**/queries/*.ts'
  - 'apps/api/src/**/dto/*.ts'
  - 'apps/api/src/**/*.controller.ts'
  - 'apps/api/src/**/*.module.ts'
---

# CQRS commands, queries, controllers and DTOs

The module layout and the rule that modules talk only through the buses are in
`apps/api/CLAUDE.md` ("CQRS"). This file covers how each piece is written.

## Commands and queries

- A **command** changes state (`commands/<name>.command.ts`, such as
  `create-meeting` or `register`), and a **query** only reads
  (`queries/<name>.query.ts`). Classify by
  effect, not by HTTP verb: `POST /auth/login` is a query because it writes
  nothing.
- Each command or query extends `Command<TResult>` or `Query<TResult>`, so
  `commandBus.execute()` and `queryBus.execute()` return a typed promise
  without casts. Its constructor holds `readonly` fields only.
- Commands may return a result when the HTTP response needs it (the created
  meeting, the issued token). This is a deliberate relaxation of strict CQRS.

## Handlers

- Each command or query has exactly one handler in the same folder
  (`<name>.handler.ts`, decorated with `@CommandHandler` or `@QueryHandler`),
  listed in its module's `providers`.
- A handler owns one use case end to end: it injects the Drizzle client with
  `@Inject(DATABASE)`, queries only a table its own module owns, maps rows to
  the response shape, and throws Nest HTTP exceptions (`NotFoundException`,
  `ConflictException`, `UnauthorizedException`) for expected failures.
- An owner-scoped handler resolves the resource through the module's
  ownership helper (`getOwnedMeeting`) and answers 404 for another owner's
  resource, so it reveals nothing about it.
- Logic shared by several handlers lives in a plain injectable service
  (`AuthTokenService`) or a plain function module (`users/email.ts`), not in
  another handler.

## Controllers

- Controllers stay thin: validate the body with a DTO, read the user with
  `@CurrentUser()`, build the command or query, and dispatch it. No business
  logic and no database access.
- No route takes a user id that the token already identifies.
- Path parameters that are ids go through `ParseUUIDPipe`, so a malformed id
  answers 400 before any handler runs.
- Header names, field names and limits are named constants
  (`FILE_FIELD`, `CONTENT_TYPE_HEADER`), never inline strings.

## DTOs

- A DTO is a class in `dto/` whose fields carry `class-validator` decorators;
  the global `ValidationPipe` in `AppModule` applies them, so controllers never
  validate by hand.
- A field rule used by several DTOs becomes a custom decorator in its own file
  (`@IsUserName()` in `auth/dto/user-name.ts`).
