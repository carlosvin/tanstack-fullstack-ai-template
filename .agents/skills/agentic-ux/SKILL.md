---
name: agentic-ux
description: >-
  **WORKFLOW SKILL** - Fully agentic UX where a thin prompt shell renders
  tool-linked MCP UI resources.

  USE FOR: fully agentic mode, MCP UI host, dynamic tool UI, agent shell,
  sandboxed UI resource.

  DO NOT USE FOR: side panel chat (use promptable-ux), prompt-first layout
  (use promptable-ux), schema layers or server boundaries (use
  tanstack-promptable-fullstack-app-template), UI kit lookup (use
  reference-tech-stack), env parse or logging (use observability-and-env).

  INVOKES: MCP UI host shell, tool-linked UI resources, and companion skills.

  FOR SINGLE OPERATIONS: Load promptable-ux when the app has domain screens;
  this skill is the tool-only shell.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "0.1.0"
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

- **`reference-tech-stack`** (companion) — Opinionated packages for this template, including the MCP UI client and server packages when the shell lands. Install when implementing the host against demo stack defaults.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
  ```

- **`observability-and-env`** (companion) — Env parse, logger factories, and error-tracking bootstrap. Install when shell work also touches `shellSession`, logging, or `process.env`.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
  ```

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Agentic UX

**Purpose:** One UX contract for fully agentic apps. The product is a thin shell — a prompt and a response surface. The agent receives the full tool set. Views appear only as [MCP UI](https://github.com/MCP-UI-Org/mcp-ui) resources returned by those tools and rendered in a sandboxed iframe. No hand-built domain screens.

> **Parent skill:** `tanstack-promptable-fullstack-app-template` — schemas, tools, loaders, URL-as-state, `getAIAvailability()`, bounded `chat()`. Do not restate that contract here.
>
> **Other UX skill:** `promptable-ux` — side panel and prompt-first concepts for apps with domain routes. When the app has domain screens, load that skill instead of this one.

## Skill routing

| Task | Load |
|------|------|
| Fully agentic mode, MCP UI host, dynamic tool UI, agent shell, sandboxed UI resource | **This skill** |
| Side panel chat, prompt-first layout, domain screens | **`promptable-ux`** |
| Schemas, routes, AI tools, server boundaries, availability gate | **`tanstack-promptable-fullstack-app-template`** |
| Which UI library or MCP UI package this template uses | **`reference-tech-stack`** |
| Env, logging, error tracking | **`observability-and-env`** |

## How to use this skill

1. Declare the mode. One mode per deployment. This shell never mounts beside a drawer, a prompt-first bar, an overview, or drill-down routes. This template's example ships as a third Netlify site with `PROMPT_CONCEPT=agentic` (see README).
2. Reuse none of the route-based components. No `ChatDrawer`, `PromptBar`, `AppNavbar`, task pages, or navigation manifest. The shell is identity plus prompt plus thread. Everything visual beyond text comes from a tool resource.
3. Implement the **Shell**, **Tool surface**, **MCP UI rendering**, **UI actions**, and **Security** sections below.
4. Run the **UX checklist** before a shell change.
5. Keep schemas, tools, and server boundaries on the architecture skill. This skill changes composition and rendering, not the data model.

## Shell

- One root layout per deployment. Conversation state lives there so scrolling never wipes the thread. Layout: app bar with identity only, conversation stage as the main surface, bottom-pinned composer (footer) that stays reachable regardless of thread length.
- When empty, the stage renders a clean hero state with welcome text and suggested starter chips. As the conversation progresses it shows the scrollable thread. Response order within the thread: markdown text, tool status, then the tool-linked UI resource. Text-only results stay markdown with GFM tables, code, and links.
- Prompt behavior: Enter sends, Shift+Enter inserts a newline, stop while generating, clear once messages exist. Tool activity shows as short status labels. Errors show in an alert. Suggested prompts may come from the single help document (`docs/help.md`).
- This matches the prompt-first bottom-composer shape from `promptable-ux` (see `AppShell.Footer`, `ChatThread`, `ChatComposer`) but without its route surfaces: no `AppNavbar`, no drill-down routes, no stacked dashboard, no navigation manifest. The composer and thread patterns transfer; the route surfaces do not.
- Mobile first (default): usable at the narrowest width with the composer pinned and responses scrolling, then richer spacing as the viewport grows. Both color schemes work with theme tokens. Keep one icon library.
- Unconfigured AI: `getAIAvailability()` gates the prompt and there is no domain UI behind it, so render an empty configuration state explaining that AI is not configured. No disabled prompt.

## Tool surface

- Expose every repository method as a server AI tool via `createSafeServerTool`, including distinct-values tools. The agent receives that full set on every turn.
- Do not register `navigate` or `invalidateRouter`. There are no in-app routes to open or refresh. After a write, the host re-renders from the new tool result.
- `browserContext` carries timezone, locale, and current time plus a marker that this surface is the agent shell. It does not carry a current path or search. There is one route, so nothing resolves "this item" from a URL. Reuse the `captureBrowserContext()` shape and drop the location fields.
- Every `chat()` call still sets `agentLoopStrategy: maxIterations(N)` explicitly (default `N=10`).

## MCP UI rendering

- A tool that needs a view links it with `_meta.ui.resourceUri` (`ui://…`). The host reads the resource and renders it with `@mcp-ui/client` `AppRenderer`. MIME type is `text/html;profile=mcp-app`. The resource is built with `createUIResource` from the tool result.
- v1 scope is `rawHtml` (plus `externalUrl` where needed). Defer `remote-dom`, component libraries, and host adapters.
- Legacy `UIResourceRenderer` is fallback-only for tools that embed the resource directly in the result. Prefer `_meta.ui.resourceUri`.
- A capability that returns a UI resource does not also get a hand-built page. No parallel component for the same view.
- Resource states: loading placeholder while fetching, sandboxed render on success, error state with retry plus fallback to the markdown result when the resource fails.

## UI actions

The sandbox talks to the host through `onMessage` / `onUIAction`. Map actions to tools and prompts only:

- **tool** — run the same server tool with its input schema, append the result, render any new resource.
- **prompt** — send the text as the next user message.
- **notify** — status in the thread.
- **link** — open externally.
- **intent** — map to a tool call or a prompt. Never to an in-app route.

## Security

- HTML from a tool or the model renders only inside the MCP UI iframe. The host document never injects that HTML.
- Allowlist `ui://` resource URIs and validate the MIME type before rendering. Cap resource size.
- UI-action tool calls pass the same input schemas and server guards as chat tool calls. Hiding a widget is not a guard. Writes still use the auth ticket and `TraceabilityContext`.
- Log resource URI, tool latency, and render failures through the observability interface.

## UX checklist

- Mode declared. No drawer, prompt-first bar, overview, drill-down, navbar, or domain route in this deployment.
- No reused route-based components. Every view beyond text is a tool-linked MCP UI resource.
- `getAIAvailability()` gates the prompt. Unconfigured AI shows the empty configuration state.
- Chat state lives on the layout and survives scrolling. Prompt stays pinned on narrow viewports.
- Resources render sandboxed with loading, error, and markdown-fallback states.
- UI actions map to tools or prompts only. No in-app navigation.
- Narrow layout and both color schemes checked.
- Writes stay server-guarded with the auth ticket and `TraceabilityContext`.

## What stays on other skills

| Concern | Where it lives |
|---------|----------------|
| `getAIAvailability()` gate, tool coverage, agent loop | Architecture Core Contract #11–#13 |
| Schemas, server functions, trust boundaries | Architecture Core Contract #3–#6 and Schema Boundaries |
| MCP UI package versions for this repo | **`reference-tech-stack`** |
| Side panel and prompt-first concepts | **`promptable-ux`** |
| Env, logging, error tracking | **`observability-and-env`** |

## Verification

After UX-contract changes: update this `SKILL.md`, run `pnpm skills:check` and `pnpm skills:waza`, and follow AGENTS.md §15 when the reference shell changes.
