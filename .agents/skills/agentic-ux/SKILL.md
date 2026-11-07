---
name: agentic-ux
description: >-
  **WORKFLOW SKILL** - Fully agentic UX. A thin prompt shell renders Mantine
  views as declarative A2UI surfaces from tool data.

  USE FOR: fully agentic mode, A2UI surface, Mantine catalog, dynamic tool UI,
  agent shell.

  DO NOT USE FOR: side panel chat (use promptable-ux), prompt-first layout
  (use promptable-ux), schema layers or server boundaries (use
  tanstack-promptable-fullstack-app-template), UI kit lookup (use
  reference-tech-stack), env parse or logging (use observability-and-env).

  INVOKES: A2UI host surface, catalog adapters, and companion skills.

  FOR SINGLE OPERATIONS: Load promptable-ux when the app has domain screens;
  this skill is the tool-only shell.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "0.5.0"
  repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
---

## Companion skills (install if missing)

This template publishes **multiple** skills. If only **this** skill is installed, add companions **before** related work:

- **`tanstack-promptable-fullstack-app-template`** (parent) — Architecture contract: schema layers, loader-first routes, AI tools, and server boundaries. Install for every TanStack app; this skill only places the prompt and renders tool UI.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
  ```

- **`promptable-ux`** (companion) — Shared UX for the route-based concepts (hidden side or bottom panel, and prompt-first). Install when the app has domain screens instead of this tool-only shell.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill promptable-ux
  ```

- **`reference-tech-stack`** (companion) — Opinionated packages for this template, including the A2UI packages and UI kit. Install when implementing the host against demo stack defaults.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
  ```

- **`observability-and-env`** (companion) — Env parse, logger factories, and error-tracking bootstrap. Install when shell work also touches `shellSession`, logging, or `process.env`.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
  ```

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Agentic UX

**Purpose:** One UX contract for fully agentic apps and the dynamic chat core shared across all three UX modes. The product is a thin shell — a prompt and a response surface. The agent receives the full tool set. Mantine task views are [A2UI](https://a2ui.org/) messages rendered by a host `Surface` and a narrowed Mantine catalog. A tool call returns data. A prompt that already names one item id opens that detail view directly. No hand-built domain screens, and no iframe guest documents.

> **Parent skill:** `tanstack-promptable-fullstack-app-template` — schemas, tools, loaders, URL-as-state, `getAIAvailability()`, bounded `chat()`. Do not restate that contract here.
>
> **Other UX skill:** `promptable-ux` — side panel and prompt-first concepts that extend this dynamic chat surface with domain routes. When the app has domain screens, load that skill alongside this one.

## Skill routing

| Task | Load |
|------|------|
| Fully agentic mode, A2UI surface, Mantine catalog, dynamic tool UI, agent shell | **This skill** |
| Side panel chat, prompt-first layout, domain screens | **`promptable-ux`** |
| Schemas, routes, AI tools, server boundaries, availability gate | **`tanstack-promptable-fullstack-app-template`** |
| Which UI library or A2UI package this template uses | **`reference-tech-stack`** |
| Env, logging, error tracking | **`observability-and-env`** |

## How to use this skill

1. Declare the mode. One mode per deployment. Use this skill when the app already sets `PROMPT_CONCEPT=agentic` or the developer chose **agentic**. When it is not clear which user experience to implement, ask which of the three (side or prompt-first in **`promptable-ux`**, or agentic here) and wait. Do not build this shell as a fallback. This shell never mounts beside a drawer, a prompt-first bar, an overview, or drill-down routes. This template's example ships as a third Netlify site with `PROMPT_CONCEPT=agentic` (see README).
2. Reuse none of the route-based components in the standalone agentic shell. No `ChatDrawer`, `PromptBar`, `AppNavbar`, task pages, or navigation manifest. The shell is identity plus prompt plus thread. Everything visual beyond text comes from a tool result rendered as a declarative A2UI surface from the declared catalog.
3. Implement the **Shell**, **Tool surface**, **View strategy**, **UI actions**, and **Security** sections below.
4. Run the **UX checklist** before a shell change.
5. Keep schemas, tools, and server boundaries on the architecture skill. This skill changes composition and rendering, not the data model.

## Shell

- One root layout per deployment. Conversation state lives there so scrolling never wipes the thread. Layout: app bar with identity only (name in the bar; version in a tooltip), a centered conversation column, and a bottom-pinned composer that stays reachable regardless of thread length. The column and the composer share one width: the space under the header, capped so a line stays readable on an ultra-wide monitor. A tool view fills that column.
- When empty, the stage is a centered hero: icon, welcome text, and starter controls that ask for inline views (`Show my tasks`, a status filter, a priority filter). Do not reuse `docs/help.md` bullets that point at dashboards or routes.
- As the conversation progresses, the stage is the scrollable thread. Order inside one reply: one short markdown sentence, a sentence-case tool status (`showing tasks`, not the raw tool name), then the A2UI surface. Text-only replies stay markdown with GFM tables, code, and links.
- Prompt behavior: Enter sends, Shift+Enter inserts a newline, stop while generating, clear once messages exist. Clearing the thread also clears a detail view opened from a card.
- Errors render in an alert with a short sentence a person can act on. Never show a provider payload, a JSON blob, or an HTTP status dump. A busy model says to wait and try again.
- This matches the prompt-first bottom-composer shape from `promptable-ux` (see `AppShell.Footer`, `ChatThread`, `ChatComposer`) but without its route surfaces: no `AppNavbar`, no drill-down routes, no stacked dashboard, no navigation manifest. The composer and thread patterns transfer; the route surfaces do not.
- Mobile first (default): usable at the narrowest width with the composer pinned and responses scrolling, then richer spacing as the viewport grows. Both color schemes work with theme tokens. Keep one icon library.
- Unconfigured AI: `getAIAvailability()` gates the prompt and there is no domain UI behind it, so render an empty configuration state explaining that AI is not configured. No disabled prompt.

## Answers

The system prompt for this shell must say these rules. The view tool enforces the assignee rule even when the model ignores the prompt.

- Greetings and "what can you do" stay text. Do not open a view for them.
- "My tasks" means every task. Set `assignee` only when the user names a person. A demo visitor email (the auto-generated test identity) is not an assignee. The list tool drops that email before it queries, so the view is not an empty list with a "you have no tasks" sentence.
- After a view tool, write one short sentence. Do not repeat titles, statuses, priorities, or emails. The inline view shows them. Trust the tool result: if it contains rows, do not say the list is empty.
- Do not write markdown links. This shell has no pages. A route link in assistant markdown becomes a follow-up prompt. If that link has no label, the prompt text is the label, so the thread never shows a bare colon.

## Tool surface

- Expose every repository method as a server AI tool via `createSafeServerTool`, including distinct-values tools and data-only view tools (`showTasksView`, `showTaskView`). The agent receives that full set on every turn.
- Do not register `navigate` or `invalidateRouter` in `agentic` mode. There are no in-app routes to open or refresh. After a write, the host re-renders from the new tool result.
- `browserContext` carries timezone, locale, and current time plus a marker that this surface is the agent shell. It does not carry a current path or search. There is one route, so nothing resolves "this item" from a URL. Reuse the `captureBrowserContext()` shape and drop the location fields.
- Every `chat()` call still sets `agentLoopStrategy: maxIterations(N)` explicitly (default `N=10`).

## View strategy

The declared UI kit chooses how a tool result becomes a declarative A2UI view. Read the kit from **`reference-tech-stack`**. Ask once when a new app has no kit, then wait. Strategy is deployment configuration. The model returns data. It does not emit markup, JSON blueprints, or renderer instructions.

| Composition | Examples | Renderer |
|-------------|---------|----------|
| Closed catalog | Mantine (this template), MUI, Ant Design, Chakra, PrimeReact | Host `Surface` from `@a2ui-bridge/react` plus that kit's allowlisted adapters |
| Persist source | "Add this component to the repo" | Outside this shell. Review the diff. Do not install files as a chat side effect |

### Mantine catalog

This template's kit is Mantine 9 and `lucide-react`. Render task views with `useA2uiProcessor` and `Surface`. `createComponentMapping` registers every A2UI component type that has a Mantine adapter: layout, typography, inputs, feedback, overlays, navigation, data display, and disclosure, plus the aliases in that map (`Column`, `Row`, `Card`, `Text`, `Title`, `Badge`, `Button`, `Timeline`, `TimelineItem`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, and the rest of the catalog). Unknown component types render nothing. Each type is one A2UI node the host maps onto one component. The model returns task data and does not pick components.

`@a2ui-bridge/react-mantine@0.1.0` peers `@mantine/core` `^8` and `@tabler/icons-react`. Do not add that package, and do not add a second icon library. Keep `@a2ui-bridge/core` and `@a2ui-bridge/react`. The host ports that catalog onto Mantine 9 and `lucide-react` so the existing `MantineProvider` supplies theme and color scheme.

`showTasksView` and `showTaskView` return task data only. `showTasksView` also returns `presentation`. `"table"` draws one row per task. `"cards"` or omitting it draws the card list. `"kanban"` draws one lane per status. `"timeline"` draws one item per due date, with tasks that have no date last. That choice is not part of the repository filter. `buildTaskViewMessages` turns the payload into A2UI messages. `acceptA2uiMessages` drops any component type outside the catalog before `processMessages`. People-facing text uses `literalString`. No raw ids. A list row is one control for the whole card, not a separate "Open" button. A table uses those table nodes. The title cell is the open button. Header cells name the columns. When more than 20 tasks match, the heading keeps the full count and a note says how many rows are shown. An empty result says no rows match and suggests dropping the filter.

`onAction` follows **UI actions**. `open-task` with one id opens that detail view without another model turn. When the thread already returned that task, the detail is that task. A missing id is loaded from the repository. The seed repository replays tasks from earlier tool results at the start of the next chat turn, because a new serverless instance does not keep the in-memory write. `back-to-list` is an ordinary prompt. Any other action name is ignored.

### How `prompt-first` and `side` extend this agentic chat core

The three UX patterns form a layered hierarchy where **fully agentic** defines the core dynamic AI chat component (`AgenticMessageItems` + `useInlineDetailViews`, rendering assistant markdown and declarative A2UI surfaces via `AgenticA2uiSurface`), and **`prompt-first`** and **`side`** extend that exact chat component with router-driven domain screens:

- **Isolated at runtime in `agentic`:** `AppLayout` returns `AgenticChatProvider` + `AgenticShell` before building route chrome, so `ChatDrawer`, `PromptBar`, `Header`, and `AppNavbar` never mount. In `src/routes/index.tsx`, `loadHomeTasks.agentic` returns `[]` without querying and `AgenticHome` returns `null`.
- **Reused across all 3 chat panels (`agentic`, `prompt-first`, and `side`):** `ChatThread` reuses `AgenticMessageItems` from `AgenticThread.tsx`; `PromptChatProvider` owns `useInlineDetailViews` so opened details survive route remounts. In `src/routes/api/chat.ts`, `dataTools` includes `showTasksViewTool` and `showTaskViewTool` for all three modes, while `side` and `prompt-first` add `navigateToolDef`, `invalidateRouterToolDef`, and route `MarkdownLink` navigation on top.
- **Repeatable 3-step recipe for adding a new domain entity's dynamic UI across all 3 chat panels:**
  1. **View tools (`src/services/ai/<entity>Views.server.ts`):** Add data-only `show<Entities>ViewTool` and `show<Entity>ViewTool` calling the shared `serverFns.ts` queries, stripping demo visitor emails on list filters, and separating `presentation` (`cards | table | kanban | timeline`) from the repository filter. Register both tools in `dataTools` in `src/routes/api/chat.ts` so every UX mode receives them.
  2. **A2UI message builder (`src/services/a2ui/<entity>ViewMessages.ts`):** Turn the tool payload into allowlisted A2UI messages validated with `acceptA2uiMessages` and sealed component ids, emitting `open-<entity>`, `back-to-list`, `toggle-select`, and `mark-selected` actions.
  3. **Shared thread surface (`src/components/AgenticShell/AgenticThread.tsx`):** Match the new view tools in `AgenticMessageItems` (which automatically powers `AgenticThread`, `PromptFirstLanding`, and `ChatDrawer`), add sentence-case status labels in `toolLabels.ts`, and resolve single-id `open-<entity>` actions from remembered thread payloads (or `get<Entity>`) without sending another model turn.

## UI actions

Catalog actions map to host state or a follow-up prompt. Never to an in-app route in `agentic` mode.

- **open-task** — When the action names one item id, open that detail view directly in the host without sending another model turn. When the thread already returned that task, render it immediately; otherwise fetch it with `getTask`. The user line shows the item title, not the id.
- **back-to-list** — Sends an ordinary follow-up prompt (`Show my tasks`).
- **toggle-select / mark-selected** — Host tracks selected ids on the card/table surface and turns `mark-selected` into a single bulk-status prompt (`Set the status of these tasks to ...`).

## Security

- The host document never injects raw HTML from a tool or the model (`dangerouslySetInnerHTML` is forbidden). Views render exclusively as allowlisted A2UI nodes through `Surface`, and unknown component types render nothing.
- Validate A2UI message payloads with a strict schema (`acceptA2uiMessages`), strip dangling child references, and seal component ids with a private-use prefix so `literalString` text can never be misinterpreted as a child component id.
- UI-action prompts and tool calls pass the same input schemas and server guards as chat tool calls. Hiding a widget is not a guard. Writes still use the auth ticket and `TraceabilityContext`.

## UX checklist

- Mode declared. No drawer, prompt-first bar, overview, drill-down, navbar, or domain route in `agentic` deployment.
- No reused route-based components in `AgenticShell`. Mantine task views are A2UI surfaces built from tool data.
- `getAIAvailability()` gates the prompt. Unconfigured AI shows the empty configuration state.
- Chat state lives on the layout and survives scrolling. Prompt stays pinned on narrow viewports.
- Surfaces render through the allowlisted Mantine catalog with error and retry states.
- Empty hero uses view starters, not route help bullets. Tool status is sentence case. Errors are short alerts, never a provider payload.
- A list answer is one sentence plus the view. A demo visitor email is not an assignee filter. A card that names one id opens that detail view without another model turn.
- UI actions map to host selection or prompts only. No in-app navigation in `agentic` mode. Route links in markdown become prompts, and an empty link label uses that prompt text.
- Narrow layout and both color schemes checked.
- Writes stay server-guarded with the auth ticket and `TraceabilityContext`.

## What stays on other skills

| Concern | Where it lives |
|---------|----------------|
| `getAIAvailability()` gate, tool coverage, agent loop | Architecture Core Contract #11–#13 |
| Schemas, server functions, trust boundaries | Architecture Core Contract #3–#6 and Schema Boundaries |
| Mantine A2UI packages | **`reference-tech-stack`** |
| Side panel and prompt-first concepts | **`promptable-ux`** |
| Env, logging, error tracking | **`observability-and-env`** |

## Verification

After UX-contract changes: update this `SKILL.md`, run `pnpm skills:check` and `pnpm skills:waza`, and follow AGENTS.md §15 when the reference shell changes.
