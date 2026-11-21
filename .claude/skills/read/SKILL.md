---
name: read
description: Reads only the part of a file that the task needs instead of the whole file. Use before opening a long source file, a JSON or config file, or a database schema, and whenever only one symbol, field or model is required.
argument-hint: "<file path> [symbol, field or model]"
---

# Read

Every line read stays in the session's context. Locate the target first, then read only those lines.

## Usage

```
/read $ARGUMENTS
```

`$ARGUMENTS` is a file path, optionally followed by the symbol, JSON field or model to extract. Without a target, report the file's outline (step 1) and stop.

## Algorithm

1. **Measure and outline the file.**

   ```bash
   wc -l <file>
   rg -n '^(export |class |function |interface |type |const )' <file>
   ```

   A file under about 150 lines can be read whole with the Read tool. To find a file by name, use `rg --files apps/ | rg <name>`.

2. **Locate the target with `rg`, never `grep`.**

   ```bash
   rg -n '<pattern>' <file>          # line numbers only
   rg -n -C 3 '<pattern>' <file>     # with 3 lines of context
   rg -n -w '<symbol>' apps/         # whole-word match across the apps
   ```

   For a whole function, class or call expression, prefer `ast-grep`, which returns the complete syntax node however many lines it spans:

   ```bash
   ast-grep run -l ts -p 'function <name>($$$) { $$$ }' <file>
   ast-grep run -l ts -p 'class <Name> { $$$ }' <file>
   ```

3. **Read the located lines with the Read tool** (`offset` and `limit`), not `sed`, `cat` or `head`. Take the line number from step 2 and read a window around it, for example `offset: 120, limit: 40`.

4. **JSON: extract the field with `jq`.**

   ```bash
   jq '.scripts' package.json
   jq -r '.scripts | keys[]' package.json
   jq '.dependencies["drizzle-orm"]' apps/api/package.json
   jq 'paths | map(tostring) | join(".")' <file>   # list the key paths of an unknown file
   ```

5. **Database schema: extract only the required model.**

   This project uses Drizzle; the tables live in `apps/api/src/database/schema.ts`.

   ```bash
   rg -n 'pgTable\(' apps/api/src/database/schema.ts                                   # list the tables
   ast-grep run -l ts -p 'export const <table> = pgTable($$$)' apps/api/src/database/schema.ts
   ```

   For a Prisma schema, the same step is one multiline `rg`:

   ```bash
   rg -U -n 'model <Name> \{[^}]*\}' <path>/schema.prisma
   ```

## Rules

- Do not read generated or bulky files whole: `pnpm-lock.yaml`, `apps/api/drizzle/meta/*.json`, `.agents/skills/**` data. Query them with `rg` or `jq`.
- Trim long command output with `rg` or `tail` before it enters the context.
- If `rg` finds nothing, widen the pattern once (drop `-w`, add `-i`) before falling back to the outline from step 1.
