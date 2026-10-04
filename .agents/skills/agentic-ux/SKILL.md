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
  version: "0.2.3"
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

### Docs alignment

Follow [TanStack AI MCP Apps](https://tanstack.com/ai/latest/docs/mcp/apps) and the [MCP UI client walkthrough](https://mcpui.dev/guide/client/walkthrough):

- Follow the [MCP Apps pattern](https://github.com/MCP-UI-Org/mcp-ui#mcp-apps-pattern-recommended): register the view with `createUIResource`, link the tool with `metadata._meta.ui.resourceUri`, and return only tool data from `execute`. The HTML does not go in the model-facing tool result.
- Bind `metadata.mcp.readResource` to that registered document so `chat()` performs `resources/read` and emits a `UIResourcePart`. In-process tools use the same read as an MCP server resource handler.
- Render each `ui-resource` part with `AppRenderer` from `@mcp-ui/client`. Pass the HTML from the read, plus `toolInput` and `toolResult`, so the guest receives `ui/notifications/tool-result`. Pass `useMcpAppBridge` handlers for prompts and links. `sandbox.url` is required: it is the hosted proxy `public/sandbox_proxy.html`, not the widget. The proxy keeps the guest HTML in an inner iframe with no `allow-same-origin`.
- The guest uses `@modelcontextprotocol/ext-apps` `App` from `public/mcp-app.js`. Set `ontoolresult` before `connect()`, and use `sendMessage` and `openLink`. Do not post `{ type: 'prompt' | 'link' | 'notify' | 'tool' | 'intent' }`. `UIResourceRenderer` is out of scope.
- A separate MCP server plus `createMcpAppCallHandler` is the path when a widget calls tools itself. This shell's views send a follow-up prompt, and `POST /api/mcp-apps/call` refuses direct widget tool calls, so writes stay on the chat tools and the auth ticket.

### Recipe

Generate views with this recipe. The reference example (`showTasksView`, `showTaskView`, `AgenticMcpRenderer`) is that recipe:

- `toolDefinition` sets `metadata._meta.ui.resourceUri` to an allowlisted `ui://` URI and `metadata.mcp.readResource` so the host reads that URI.
- Load the view document from a file (`task-view.html`) and the guest script (`public/mcp-task-view.js`). `createUIResource` wraps that static document once. Do not embed repository rows in the HTML. The guest writes tool-result text with `textContent`. Bound field length, and refuse a document over the size cap.
- The host renders that HTML only through `AppRenderer` and `sandbox_proxy.html`. The proxy does not replace its own document with the guest HTML. Show an error state whose retry re-requests the same view, and keep the markdown answer when the resource fails.
- A capability that returns a UI resource does not also get a hand-built page.

## UI actions

The guest `App` talks to the bridge. Map actions to a prompt. Never to an in-app route.

- **prompt** — `app.sendMessage` becomes the next user message through `useMcpAppBridge`.
- **link** — `app.openLink`. The bridge allows only `http:`, `https:`, and `mailto:`.
- **tool** — these views do not call tools from the iframe. The call endpoint refuses a direct widget tool call.

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
