---
name: promptable-ux
description: >-
  **WORKFLOW SKILL** - Shared UX for promptable apps. One contract covers both
  prompt concepts: a hidden side or bottom panel, and a prompt-first layout.

  USE FOR: promptable UI, prompt first app, chat drawer, mobile first layout,
  assistant markdown.

  DO NOT USE FOR: schema layers or server boundaries (use
  tanstack-promptable-fullstack-app-template), env parse or logging (use
  observability-and-env), which UI library (use reference-tech-stack).

  INVOKES: prompt chrome, layout concepts, and companion skills.

  FOR SINGLE OPERATIONS: Load the architecture skill for routes and tools;
  this skill is the UX contract only.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "1.0.0"
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

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Promptable UX

**Purpose:** One UX contract for promptable apps. Shared rules (mobile first, markdown replies, one prompt, real routes) apply to every app. **Two concepts** differ only in where the prompt sits and what the user sees first.

> **Parent skill:** `tanstack-promptable-fullstack-app-template` — tools, loaders, URL-as-state, `getAIAvailability()`, bounded `chat()`. Do not restate that contract here.
>
> **Kit recipes for this template:** [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) §3 and §8, and companion **`reference-tech-stack`**.

## Skill routing

| Task | Load |
|------|------|
| Which prompt concept, chat chrome, mobile first, assistant markdown | **This skill** |
| Schemas, routes, AI tools, server boundaries, availability gate | **`tanstack-promptable-fullstack-app-template`** |
| Which UI library or markdown package this template uses | **`reference-tech-stack`** |
| Widget snippets and file paths in this repo | **AGENTS.md** §3 and §8 |
| Env, logging, error tracking | **`observability-and-env`** (do not load this skill for that) |

## How to use this skill

1. Read **Shared UX** — it applies to both concepts.
2. Read **Choose a concept**. This template's reference app already declares **Promptable UI (side)**. Ask the developer before using the other concept or changing that declaration.
3. Implement only the chosen concept. Do not ship both prompt surfaces.
4. Keep routes, tools, and loaders on the architecture skill. This skill changes composition, not the data model.

## Choose a concept

| | Promptable UI (side) | Prompt-first |
|--|----------------------|--------------|
| What the user sees first | The domain screen (dashboard, list, detail) | The prompt |
| Prompt visibility | Hidden until the user opens it | Always on screen |
| Panel | Side drawer or bottom panel; may cover a narrow viewport | Not a panel. It is the top of the page |
| How areas are reached | App navigation, plus the prompt once opened | Prompt, and a top-to-bottom overview the user drills into |

**One concept per app.** A hidden drawer plus a second always-visible prompt is a mixed concept — do not build it.

**Ask the developer** which concept to use when the app has not declared one. Do not silently switch an app that already declares a concept. This repository declares **Promptable UI (side)**.

## Shared UX

These rules apply to both concepts.

1. **Promptable when configured.** Mount the prompt only when `getAIAvailability()` is true (architecture Core Contract #12). No disabled placeholder.
2. **One prompt surface.** Conversation state mounts at the root layout so it survives route changes. Closing a panel or scrolling the page must not wipe the thread.
3. **Real routes.** Sections and views are router routes with loaders and URL search state. The prompt presents or switches them with the `navigate` client tool and markdown links. It does not invent a second app inside the transcript.
4. **Direct access too.** Every area the prompt can open also has a visible control, so the app works before the model replies.
5. **Mobile first (default).** [Progressive enhancement from small viewports up](https://developer.mozilla.org/en-US/docs/Glossary/Mobile_First): a usable layout at the narrowest width, then richer layout as the viewport grows. This is the layout stance, not a widget. **Ask the developer** before leaving mobile first (desktop-first, a specialized layout). Do not silently switch. Both concepts stay mobile first. Kit tokens for *this* template live in AGENTS.md §3 and **`reference-tech-stack`**.
6. **Assistant markdown.** Render assistant messages as Markdown, including GFM: lists, tables, fenced and inline code, and links. Internal paths such as `[Tasks](/tasks)` stay client-navigable. Do not flatten assistant output to plain text. The renderer package is project-specific (this repo: AGENTS.md §8).
7. **Both color schemes.** Every prompt surface and domain view works in light and dark.
8. **Clean chrome.** No second chat, no duplicate navigation that exists only inside the model reply, no dense tables on an overview that exists to be scanned.
9. **Filters stay URL state.** Free-text search follows the architecture debounced-search pattern. Do not bind each keystroke to `navigate`.

### Common failure modes

- **Desktop-first without asking.** Designing a wide layout and only later squeezing it onto a small screen.
- **Mixed concepts.** An always-visible prompt and a hidden drawer in the same shell.
- **Chat-only views.** A section that exists only as markdown in the thread, with no route.
- **Plain-text replies.** Stripping tables, code, and internal links from assistant messages.
- **Disabled prompt.** Rendering a greyed-out chat when AI is not configured. Omit the prompt instead.

## Promptable UI (side)

The domain UI is the product. The prompt is always reachable and hidden until the user asks for it.

- The primary surface is the current route: overview, list, or detail.
- The prompt starts closed. A persistent control on every screen opens it (in this template, a header action).
- Use a **side panel** on wider viewports or a **bottom panel**. On the narrowest viewport the panel may cover the screen. Closing it returns to the same route and keeps the thread.
- Do not dock the prompt as a permanent column beside the page. A column that is always there is the prompt-first concept.
- Navigation that does not fit a narrow header collapses (this template: burger + nav). The prompt control stays available in that collapsed header.
- Opening the prompt must not navigate away or drop URL search state.

**Reference app (this template):** `AppLayout` mounts `ChatDrawer` closed. The panel is a right-side drawer and becomes full viewport below the `sm` breakpoint. Recipe: AGENTS.md §3 and §8. Match that recipe when extending this repo. A different UI kit keeps the concept and swaps the widget.

## Prompt-first

The prompt is the entry point. The rest of the app is a high-level overview the user drills into, from top to bottom.

Reading order on every screen:

1. **App bar** — identity, and a way back to the overview. Keep it short.
2. **Prompt** — always visible. The thread scrolls; the input stays reachable without opening a panel.
3. **Overview** — application areas as a short summary. Each area is one scannable entry (name, one-line status, link), not a full data table.
4. **Drill-down** — the active area once the user enters it: filters, lists, detail, forms. This is a real route rendered below the overview, or the route the prompt navigated to, with the prompt still mounted above it.

Rules that differ from the side concept:

- The prompt is present on first paint. Do not hide it behind a drawer, a bottom sheet, or a disclosure.
- The user can ask the prompt to open or present a section, and can also tap the overview. Both land on the same route.
- Drill-down adds depth down the page (or onto that area's route). Do not replace the prompt with the detail view.
- On a narrow viewport, keep the same top-to-bottom order. Pin the prompt input; let the thread and the page scroll.
- Do not add a side drawer "as well." One concept only.

This template does not ship a prompt-first shell. Use this section when the developer chooses prompt-first for a new app or explicitly asks to switch. Reuse the same chat endpoint, tools, markdown rendering, and availability gate as the side concept.

## What stays the same

| Concern | Where it lives |
|---------|----------------|
| `getAIAvailability()` gate | Architecture Core Contract #12 |
| Server tools, `navigate`, `invalidateRouter`, `browserContext` | Architecture Core Contract #11–#13; AGENTS.md §8 |
| Routes, loaders, URL search | Architecture Core Contract #7–#8 |
| Markdown package and CSS for this repo | AGENTS.md §8; **`reference-tech-stack`** |
| Breakpoint props for this repo | AGENTS.md §3; **`reference-tech-stack`** |

## Verification

After UX-contract changes: update this `SKILL.md`, run `pnpm skills:check` and `pnpm skills:waza`, and follow AGENTS.md §15 when the reference shell changes.
