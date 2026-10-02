---
name: promptable-ux
description: >-
  **WORKFLOW SKILL** - Shared promptable UX foundations plus two chat UX
  variants (side panel vs prompt-first) for TanStack Start apps.

  USE FOR: promptable UI, side panel chat, prompt-first app, chat drawer,
  prompt bar, markdown replies, app navigation UX, mobile first layout.

  DO NOT USE FOR: schema layers or server boundaries (use
  tanstack-promptable-fullstack-app-template), env parse or logger factories
  (use observability-and-env), concrete package choices (use
  reference-tech-stack).

  INVOKES: TanStack Router navigation, AI chat client, and companion skills.

  FOR SINGLE OPERATIONS: Load the parent architecture skill for routes and
  tools; this skill is UX layout and chat presentation only.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "1.0.0"
  repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
---

## Companion skills (install if missing)

This template publishes **multiple** skills. If only **this** skill is installed, add companions **before** related work:

- **`tanstack-promptable-fullstack-app-template`** (parent) — Architecture contract — schema layers, server boundaries, AI tools, and middleware-inferred request context. Vendor-agnostic; install for all TanStack work.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
  ```

- **`reference-tech-stack`** (companion) — Opinionated vendor map for this template's reference app. Install when matching the demo stack's concrete packages (UI kit, validator, DB, deploy).
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
  ```

- **`observability-and-env`** (companion) — Env parse, logger factories, and error-tracking bootstrap. Install when work touches `process.env`, `shellSession`, or logging.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
  ```

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Promptable UX

**Purpose:** Own everything around **UX** for AI-promptable apps so the
architecture skill stays vendor-agnostic and the handbook stays operational.
Most UX is **shared** between variants — only the chat **placement and entry
point** differ. Keep shared rules here once; pick **one** variant per app.

> **Parent skill:** `tanstack-promptable-fullstack-app-template` — schemas,
> routes, AI tool coverage, server boundaries. Load it for every new entity,
> route, or tool.
>
> **Handbook:** [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md)
> §3 (styling), §8 (chat wiring), §14 (special patterns) — concrete file paths
> and snippets for *this* repo.
>
> **Reference stack:** `reference-tech-stack` — which UI kit / markdown /
> icon packages this template uses. This skill names widgets generically;
> that companion names vendors.

## Skill routing

| Task | Load |
|------|------|
| Chat placement, prompt entry point, drawer vs prompt-first, markdown replies, navigation UX, mobile-first layout | **This skill** |
| Schemas, routes, `validateSearch`, server fns, AI tools, auth ticket, import protection | **`tanstack-promptable-fullstack-app-template`** |
| "Which package does this template use?" / match the demo app stack | **`reference-tech-stack`** |
| Env schemas, `shellSession`, logging/Sentry bootstrap | **`observability-and-env`** |
| Architecture + UX layout | **This skill** + **`tanstack-promptable-fullstack-app-template`** |

## How to use this skill

1. **Ask the developer which variant** before scaffolding (`side` is the
   template default; `prompt-first` is opt-in). Do not silently switch.
2. Apply **Shared foundations** regardless of variant — they are the
   non-negotiable UX contract.
3. Implement only the chosen variant section (**A** or **B**). Do not ship
   both chat shells in one app unless explicitly asked.
4. Run the **UX checklist** before every UI change.

## Choosing a variant

| Variant | Entry point | Best for | Default? |
|---------|-------------|----------|----------|
| **A — Promptable UI (side)** | Prompt hidden in a side (or bottom) panel, always accessible via a header action | Data-dense apps where browsing/filtering is primary and AI assists | **Yes — this template's reference app** |
| **B — Prompt-first UI** | Prompt always present as the app entry point; sections/views presented or generated through the prompt | Clean, simple apps used as a high-level overview with drill-down into corners | Opt-in |

**Ask before choosing.** When the preference is unclear, default to **A**
and note that **B** is available. Record the choice (e.g. in the PR
description) so reviewers know which checklist applied.

## Shared foundations (both variants)

These hold no matter which variant is picked:

1. **Mobile first (default):** progressive enhancement from the narrowest
   viewport up (`base`, then `sm` / `md` / `lg` or equivalent). This is a
   layout stance, not a widget. **Ask the developer** before choosing
   desktop-first or another pattern. Concrete breakpoint recipes live in
   AGENTS.md §3 / `reference-tech-stack`.
2. **Promptable by default, never a dead input:** the root loader checks
   `getAIAvailability()` and only mounts chat UI when configured — no
   disabled placeholder. The same SSE endpoint (`/api/chat`), system prompt
   builder (`BASE_SYSTEM_PROMPT` + navigation manifest + user + browser
   context), `browserContext` payload, `maxIterations(N)` bound, and
   `navigate` / `invalidateRouter` client tools back both variants.
3. **URL-as-state stays visible:** filters, tabs, and selections live in
   validated search params (`validateSearch` + `loaderDeps`); the prompt and
   the URL describe the same state. Discrete filters may navigate
   immediately; free-text search uses an uncontrolled input + debounced
   `navigate({ replace: true })` — never `navigate` on every keystroke (see
   parent skill **Special Patterns**).
4. **Markdown assistant replies (GFM):** lists, tables, fenced/inline code,
   and links. Internal paths (`[Tasks](/tasks)`) stay client-navigable via
   the project `Link` wrapper (`search: true`, `preload="intent"`) — never
   flatten assistant output to plain text. Renderer choice is
   project-specific (this repo: `react-markdown` + `remark-gfm` in a
   `.markdown` CSS Module using theme CSS variables; see AGENTS.md §8).
5. **Navigation manifest drives the prompt:** derive route/help context from
   router introspection (`routesById` + `validateSearch` + route
   `staticData.description`, `.describe()` on search fields) rather than
   hand-maintained maps. New user-facing routes must appear in the manifest
   and in `matchUserFacingRoute` patterns (typecheck-guarded). Dynamic
   segments need prompt pattern-matching so "this task" resolves to the
   current id (`Current Location` block in `buildSystemPrompt`).
6. **Dark mode + theming:** every surface works in light and dark schemes;
   style through theme tokens/CSS variables, not hardcoded colors or inline
   styles. Keep one icon library per project.
7. **Help surface:** a single `docs/help.md` can back the help route, an AI
   tool, and suggested prompts — one source, three consumers.
8. **Distinct-values filters:** expose `getDistinctValues` so prompt and
   filter widgets offer only values that exist in the data.
9. **Auth stays server-enforced:** hiding buttons/inputs in the UI never
   replaces guards in POST handlers. Gate chat affordances on
   `aiAvailable`; gate mutations on the auth ticket.

## Variant A — Promptable UI (side)

The existing concept: a **prompt input hidden as a side panel** (or bottom
panel on narrow viewports). Not visible by default, but **always accessible**.

### Layout contract

- Chat lives in an overlay panel (reference: Mantine `Drawer`,
  `position="right"`, `size="lg"`; full-width on narrow viewports) mounted
  at the **root layout** (`AppLayout`) so message state **persists across
  route navigation**.
- Open/close via a header action (reference: `MessageCircle` icon button,
  `aria-label="Open AI chat"`) using a disclosure hook; render the panel
  only when `aiAvailable` is true.
- Keep AI chat as a right `Drawer`, not an `AppShell.Aside`, so the main
  content grid is untouched when the panel is closed.
- Internal links inside assistant messages navigate client-side **without
  closing the panel or losing history**.
- Tool activity surfaces inline as lightweight status badges (e.g.
  "searching tasks", "creating task") plus a "Thinking…" indicator; errors
  render in an alert role; a clear-conversation affordance appears once
  messages exist. Enter submits, Shift+Enter adds a newline; a stop control
  cancels generation.

### When to use A

- The app is primarily browsed (lists, detail pages, dashboards) and the
  prompt accelerates or explains what the user already sees.
- Screen space for tables/forms matters more than prompt prominence.
- You are extending this template as-is — **A is the default**.

## Variant B — Prompt-first UI

The app is **promptable first**: the **entry point is always the prompt**.
The page is a clean, simple **top-to-bottom** flow — a high-level overview
at the top, with drill-down into the different corners of the app. Sections
and views can be **presented or generated using the prompt**.

### Layout contract

- A **persistent prompt bar** is the hero of the home route (`/`): always
  rendered (when `aiAvailable`), autofocus-friendly, above the fold — not
  hidden behind an open action. The same `useChat` + SSE connection,
  `browserContext` body, and client tools as Variant A back it; only the
  presentation moves from overlay to page.
- Below the prompt, render a **top-to-bottom overview**: high-level summary
  sections (e.g. status rollups, recent items, per-area cards) fed by the
  **same loaders/server functions** as the rest of the app — no parallel
  data plumbing. Each section links (project `Link`) or drills down to its
  full route; the assistant also links to them in markdown replies and may
  `navigate` the user there.
- **Drill-down preserves context:** child routes reuse parent loader data
  and URL search state; the prompt bar (or a compact variant of it) stays
  available on child routes so "this view" keeps resolving via `Current
  Location`. Chat message state should survive in-app navigation (lift the
  `useChat` state to the layout, as Variant A does with the drawer).
- **Generated views are still routes + tools:** when the prompt "generates"
  a view, it composes existing routes, search params, and tools — it does
  not invent screens outside the navigation manifest. New capabilities
  still ship as schema → repository → server fn → AI tool → route, per the
  parent skill **Implementation Flow**.
- When AI is **not** configured, the page degrades to the static overview
  (no disabled prompt box) — same gating rule as Variant A.

### When to use B

- The developer asks for a clean, simple, prompt-led experience where the
  prompt is the primary navigation and the page is an overview first.
- The app has distinct areas/sections that benefit from a top-to-bottom
  summary with drill-down, rather than a dense default grid.
- You are scaffolding a new surface (often `/` or a dedicated `/ask`
  route), not retrofitting every existing list/detail page at once.

### Minimal file shape (adapt to the project)

- `PromptBar` component: input + submit/stop + error + suggestion prompts
  (suggestions may come from `docs/help.md`), wired to the same
  `/api/chat` SSE endpoint and client tools as the drawer.
- `PromptFirstPage` (or home route component): `PromptBar` on top,
  overview sections below, each section backed by loader data and linking
  to its full route.
- No `Drawer` for chat in apps that commit to **B** — one chat shell per
  app. If a migration needs both temporarily, say so explicitly and remove
  the drawer before calling the migration done.

## UX checklist

- [ ] Variant chosen explicitly with the developer (**A** default, **B** opt-in).
- [ ] `getAIAvailability()` gates chat UI; no disabled prompt placeholder.
- [ ] Chat state survives route navigation (layout-level chat state).
- [ ] Assistant output renders GFM markdown; internal links use the project `Link`.
- [ ] Navigation manifest + `matchUserFacingRoute` cover every user-facing route.
- [ ] Filters/tabs in `validateSearch` + `loaderDeps`; free-text search debounced.
- [ ] Mobile-first narrow layout verified; dark mode verified.
- [ ] Mutations still guarded server-side; `invalidateRouter` after writes.

## Verification

After UX changes: `pnpm format && pnpm lint && pnpm test && pnpm build`
per AGENTS.md §15. Skill authors: `pnpm skills:check` (companions/install
commands) and `pnpm skills:waza` (Agent Skills spec; required in CI).
