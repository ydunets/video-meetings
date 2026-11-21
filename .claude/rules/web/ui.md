---
paths:
  - 'apps/web/src/**/*.tsx'
  - 'apps/web/src/app/globals.css'
---

# Web UI (HeroUI v3, Tailwind CSS 4)

## Components

- Build UI from HeroUI v3 components. v3 needs no provider and uses compound
  components (`<Card><Card.Header>`), semantic variants (`primary`,
  `secondary`, `danger`) and `onPress` instead of `onClick`. Do not apply
  HeroUI v2 patterns (`HeroUIProvider`, `framer-motion`, `@heroui/theme`).
- Fetch the component docs with the `heroui-react` skill before using a
  component.
- `src/app/globals.css` must import `tailwindcss` before `@heroui/styles`.
  Tailwind runs through the `@tailwindcss/turbopack` loader configured in
  `next.config.ts`.

## Verification of every UI change

Do not report a UI change as complete until all three steps pass.

1. Run `pnpm --filter web test:e2e` (filter with `-g` while iterating).
2. Visual check through the Playwright MCP: run the dev server, open each
   affected page with `browser_navigate`, capture it with
   `browser_take_screenshot` at mobile, tablet and desktop widths
   (`browser_resize`), exercise its interaction states (validation errors,
   loading, focus), and confirm `browser_console_messages` shows no errors.
3. Design review: review the screenshots with the `ui-ux-pro-max` skill
   (layout, responsiveness, accessibility, interaction states) and resolve
   every issue it finds.
