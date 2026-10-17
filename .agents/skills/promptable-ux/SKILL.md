---
name: promptable-ux
description: >-
  **WORKFLOW SKILL** - Shared promptable UX plus two concepts: a hidden side
  or bottom panel, and a prompt-first layout.

  USE FOR: promptable UI, side panel chat, prompt first app, chat drawer,
  prompt bar, mobile first layout, assistant markdown, app navigation UX.

  DO NOT USE FOR: schema layers or server boundaries (use
  tanstack-promptable-fullstack-app-template), env parse or logging (use
  observability-and-env), which UI library (use reference-tech-stack).

  INVOKES: prompt chrome, chat presentation, and companion skills.

  FOR SINGLE OPERATIONS: Load the architecture skill for routes and tools;
  this skill is UX layout and chat presentation only.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "1.3.1"
  repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
---

## Companion skills (install if missing)

This template publishes **multiple** skills. If only **this** skill is installed, add companions **before** related work:

- **`tanstack-promptable-fullstack-app-template`** (parent) — Architecture contract: schema layers, loader-first routes, AI tools, and server boundaries. Install for every TanStack app; this skill only places the prompt.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
  ```

- **`reference-tech-stack`** (companion) — Opinionated packages for this template, including the UI kit. Install when matching the demo app's widgets.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
  ```

- **`observability-and-env`** (companion) — Env parse, logger factories, and error-tracking bootstrap. Install when prompt work also touches `shellSession`, logging, or `process.env`.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
  ```

- **`agentic-ux`** (companion) — Fully agentic tool-only shell. Mantine views are A2UI surfaces. Raw documents stay MCP UI resources. Install when the deployment has no domain screens.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill agentic-ux
  ```

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Promptable UX

**Purpose:** One UX contract for promptable apps. Shared rules apply to every app. **Two concepts** differ only in where the prompt sits and what the user sees first.

> **Parent skill:** `tanstack-promptable-fullstack-app-template` — tools, loaders, URL-as-state, `getAIAvailability()`, bounded `chat()`. Do not restate that contract here.
>
> **Kit recipes for this template:** [AGENTS.md](https://raw.githubusercontent.com/carlosvin/tanstack-fullstack-ai-template/main/AGENTS.md) §3 and §8, and companion **`reference-tech-stack`**. Widget names below are the reference app. Another kit keeps the concept and swaps the widget.

## Skill routing

| Task | Load |
|------|------|
| Which prompt concept, side panel chat, prompt bar, mobile first, assistant markdown, app navigation UX | **This skill** |
| Fully agentic shell, no domain screens | **`agentic-ux`** |
| Schemas, routes, AI tools, server boundaries, availability gate | **`tanstack-promptable-fullstack-app-template`** |
| Which UI library or markdown package this template uses | **`reference-tech-stack`** |
| Widget snippets and file paths in this repo | **AGENTS.md** §3 and §8 |
| Env, logging, error tracking | **`observability-and-env`** (do not load this skill for that) |

## How to use this skill

1. Read **Shared UX**. It applies to both concepts.
2. Read **Choose a concept**. This template's reference app already declares **Promptable UI (side)**. When it is not clear which user experience to implement, ask which of the three (side, prompt-first, or agentic) and wait. Record the choice so reviewers know which checklist applied.
3. Implement only the chosen concept. Do not ship both prompt surfaces.
4. Run the **UX checklist** before a UI change.
5. Keep routes, tools, and loaders on the architecture skill. This skill changes composition, not the data model.

## Choose a concept

| | Promptable UI (side) | Prompt-first |
|--|----------------------|--------------|
| What the user sees first | The domain screen (dashboard, list, detail) | The prompt |
| Prompt visibility | Hidden until the user opens it | Always on screen. It is the entry point |
| Panel | Side drawer, or a bottom panel. May cover a narrow viewport | Not a panel. It is the top of the page |
| How areas are reached | App navigation, plus the prompt once opened | The prompt, and a top-to-bottom overview the user drills into |
| Best for | Data-dense apps where browsing is primary and the prompt assists | A clean overview the user drills into, with the prompt leading |
| This template | **Default** (`PROMPT_CONCEPT=side` or unset) | Second Netlify site with `PROMPT_CONCEPT=prompt-first` |

**One concept per app.** A hidden drawer plus a second always-visible prompt is a mixed concept. Do not build it.

**Ask the developer** which user experience to implement when it is not clear. The three experiences are **Promptable UI (side)** and **Prompt-first** in this skill, and the fully agentic shell in companion **`agentic-ux`**. Ask which of the three and wait. Do not pick one. Do not silently switch an app that already declares a concept. This template's default site stays **Promptable UI (side)** (`PROMPT_CONCEPT=side` or unset). A second site uses `PROMPT_CONCEPT=prompt-first`. A third site uses `PROMPT_CONCEPT=agentic`. Do not change those env values from this question.

## Shared UX

These rules apply to both concepts. The prompt stack does not change between them.

1. **Promptable when configured.** Mount the prompt only when `getAIAvailability()` is true (architecture Core Contract #12). No disabled placeholder. When AI is off, the rest of the page stays; the prompt is absent.
2. **One prompt stack.** Both concepts use the same `/api/chat` stream, `buildSystemPrompt` (base prompt, navigation manifest, current user, browser context), `browserContext`, `navigate` and `invalidateRouter`, and `maxIterations(N)`. Only the chrome moves.
3. **One prompt surface, state at the root.** Conversation state mounts on the root layout so it survives route changes. Closing a panel or scrolling must not wipe the thread.
4. **Real routes, same loaders.** Sections and views are router routes. Overview cards and drill-down pages call the same server functions as the rest of the app. No parallel data path for the prompt. The prompt presents or switches views with `navigate` and markdown links. It does not invent a screen that is missing from the navigation manifest. New capabilities still follow the architecture implementation flow: schema, repository, server function, tool, route.
5. **Direct access too.** Every area the prompt can open also has a visible control, so the app works before the model replies.
6. **URL and prompt describe the same view.** Filters, tabs, and selections stay in validated search params. Discrete filters may navigate immediately. Free-text search follows the architecture debounced-search pattern. Do not call `navigate` on every keystroke.
7. **App navigation UX.** Route and help context in the prompt comes from router introspection (`routesById`, route descriptions, `.describe()` on search fields), not a hand-maintained map. A new user-facing route is missing until it is in that manifest. Dynamic segments need a current-location rule so "this task" resolves to the id on screen.
8. **Mobile first (default).** [Progressive enhancement from small viewports up](https://developer.mozilla.org/en-US/docs/Glossary/Mobile_First): a usable layout at the narrowest width, then richer layout as the viewport grows. This is the layout stance, not a widget. **Ask the developer** before leaving mobile first (desktop-first, a specialized layout). Do not silently switch. Both concepts stay mobile first. Kit tokens for *this* template live in AGENTS.md §3 and **`reference-tech-stack`**.
9. **Assistant markdown.** Render assistant messages as Markdown, including GFM: lists, tables, fenced and inline code, and links. Internal paths such as `[Tasks](/tasks)` stay client-navigable through the project `Link` (`search: true`, `preload="intent"`). Do not flatten assistant output to plain text. The renderer package is project-specific (this repo: AGENTS.md §8).
10. **Prompt behavior.** Show tool activity as short status labels, a thinking state while the model runs, and errors in an alert. Enter sends; Shift+Enter inserts a newline. Offer stop while generating, and clear once messages exist. Suggested prompts may come from the single help document (`docs/help.md`), which can also back the help route and a help tool. Filter choices and the prompt offer distinct values from the data, not a hardcoded list.
11. **Both color schemes.** Every prompt surface and domain view works in light and dark, using theme tokens. Keep one icon library.
12. **Auth stays on the server.** Hiding a button is not a guard. Mutations stay behind the auth ticket. Chat affordances follow `aiAvailable`.

### Common failure modes

- **Desktop-first without asking.** Designing a wide layout and only later squeezing it onto a small screen.
- **Mixed concepts.** An always-visible prompt and a hidden drawer in the same shell.
- **Chat-only views.** A section that exists only as markdown in the thread, with no route.
- **A second data path.** Overview widgets that fetch beside the route loaders.
- **Dashboard stacked under prompt.** Dumping the entire traditional dashboard/table directly below a mid-page prompt input instead of giving the agentic conversation the main surface with bottom-pinned composer.
- **Plain-text replies.** Stripping tables, code, and internal links from assistant messages.
- **Disabled prompt.** Rendering a greyed-out chat when AI is not configured. Omit the prompt instead.

## Promptable UI (side)

The domain UI is the product. The prompt is always reachable and hidden until the user asks for it. Use this when browsing, filtering, and detail pages are primary and the prompt assists what is already on screen. Extending this template as-is uses this concept.

- The primary surface is the current route: overview, list, or detail.
- The prompt starts closed. A persistent control on every screen opens it, including when navigation collapses on a narrow header.
- Use a **side panel** on wider viewports or a **bottom panel**. On the narrowest viewport the panel may cover the screen. Closing it returns to the same route and keeps the thread.
- Do not dock the prompt as a permanent column. A column that is always there is the prompt-first concept.
- Opening the prompt must not navigate away or drop URL search state.
- An internal link in an assistant message navigates without closing the panel or clearing the thread.

**Reference app (this template):** `AppLayout` mounts `ChatDrawer` closed. `Header` opens it (`aria-label="Open AI chat"`). The panel is a right-side drawer and becomes full viewport below the `sm` breakpoint. It is not an `AppShell.Aside`. Match that recipe when extending this repo. File paths and markdown CSS: AGENTS.md §3 and §8.

## Prompt-first

The prompt is the primary agentic entry point. In modern agentic UX, the conversation is front and center with the composer pinned at the bottom, not stacked above a traditional cluttered dashboard. Application areas and drill-down views are accessed seamlessly through the conversation (assistant links, navigate client tools) or dedicated route navigation.

Layout and hierarchy:

1. **App bar** — identity, current location, and navigation. Keep it clean and minimal.
2. **Conversation stage (main)** — the agentic interaction surface. When empty, renders a clean hero state with welcome text and suggested starter prompt chips. As conversation progresses, it displays a scrollable message thread with rich Markdown, tables, and internal route links.
3. **Bottom-pinned composer (footer)** — the prompt input is pinned at the bottom of the viewport (e.g. `AppShell.Footer`), always accessible regardless of scroll position or thread length. Includes autosizing text input, send/stop button, and quick-action chips.
4. **Dedicated drill-down surfaces** — task lists, detail views, and forms live on their dedicated routes (`/tasks`, `/tasks/$taskId`). When navigated, the user inspects or manipulates focused domain data with the prompt composer remaining pinned at the bottom (or accessible) for context-aware commands.
5. **No stacked dashboard below prompt** — do NOT render the entire app/dashboard directly below the prompt bar on the home surface. That creates visual confusion and undermines the agentic experience. When AI is not configured, fallback gracefully to the standard overview dashboard.

Rules that differ from the side concept:

- The prompt is present on first paint. Do not hide it behind a drawer or modal button.
- The prompt input is pinned to the bottom of the viewport, matching standard agentic UX patterns (ChatGPT, Claude, Cursor).
- The thread scrolls freely in the main viewport area; the composer stays docked at the bottom.
- Do not stack the rest of the application dashboard beneath the prompt input on the landing surface.
- Drill-down routes (`/tasks`, etc.) remain full-fledged routes with shared loaders and navigation.
- Do not add a side drawer when in prompt-first mode. One chat shell.
- When AI is not configured, render the standard overview page gracefully.

This template implements prompt-first when `PROMPT_CONCEPT=prompt-first` (see `shellSession.promptConcept`, `PromptBar`, shared `PromptChatProvider`). Wire the prompt composer and thread to the same `/api/chat` endpoint and client tools as the side drawer.

### Minimal file shape (adapt to the project)

- `PromptChatProvider` / shared hook: manages chat thread state across route changes.
- `PromptBar` / `ChatComposer`: bottom-pinned input bar (typically in `AppShell.Footer`) with autosizing input, submit/stop, and suggestion chips.
- `ChatThread` / `PromptThread`: full-height scrollable message thread with empty-state hero and suggestion chips.
- One chat shell per app: no `Drawer` for chat in apps that commit to prompt-first. If a migration needs both temporarily, say so explicitly and remove the drawer before calling the migration done.

## UX checklist

- Concept chosen with the developer. When it is not clear which user experience to implement, ask which of the three (side, prompt-first, or agentic) and wait. This repo's sites keep their declared `PROMPT_CONCEPT`.
- `getAIAvailability()` gates the prompt. No disabled placeholder.
- Chat state lives on the layout and survives navigation.
- Assistant output is GFM markdown. Internal links use the project `Link`.
- Navigation manifest covers every user-facing route, including "this item" on dynamic routes.
- Filters and tabs use `validateSearch` and `loaderDeps`. Free-text search is debounced.
- Overview and drill-down read the same loaders. No second fetch path.
- Narrow layout and both color schemes checked.
- Mutations stay server-guarded. `invalidateRouter` runs after writes.

## What stays on other skills

| Concern | Where it lives |
|---------|----------------|
| `getAIAvailability()` gate, tool coverage, agent loop | Architecture Core Contract #11–#13 |
| Routes, loaders, URL search, debounced search | Architecture Core Contract #7–#8 and Special Patterns |
| Markdown package and CSS for this repo | AGENTS.md §8; **`reference-tech-stack`** |
| Breakpoint props for this repo | AGENTS.md §3; **`reference-tech-stack`** |

## Verification

After UX-contract changes: update this `SKILL.md`, run `pnpm skills:check` and `pnpm skills:waza`, and follow AGENTS.md §15 when the reference shell changes.
