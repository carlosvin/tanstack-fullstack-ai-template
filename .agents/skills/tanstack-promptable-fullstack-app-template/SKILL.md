---
name: tanstack-promptable-fullstack-app-template
description: 'Use when scaffolding a new TanStack Start project, adding domain
  entities to the fullstack template, or implementing the interface-first
  repository pattern with AI-promptable tools, or nested layout routes duplicate
  beforeLoad checks or loaders that should live on a parent route, or TanStack
  Router, Start, or AI behavior must be verified against current documentation
  instead of training data. Project: TanStack AI-Promptable Full-Stack Template.
  Triggers on "fullstack template", "TanStack Start project", "repository
  pattern", "interface-first", "new app scaffold", "nested routes", "layout
  route", "beforeLoad", "tanstack cli", "tanstack intent", "package skills".'
---

> This file is generated from `skills/src/*.skill.yaml`. Do not edit manually.
# TanStack Fullstack Pattern

An interface-first fullstack architecture built on TanStack Start. The pattern defines clear interface boundaries between layers -- interfaces are rigid, implementations are swappable.

> **Companion documentation:** In repositories built from this template, [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) holds the project handbook -- file structure, chosen UI-library styling, auth snippets, Biome, testing/E2E commands, and the full validation checklist. This skill focuses on the architectural contract; refer to AGENTS.md for operational detail.

## Pattern Overview

- Zero-config development with seed implementations and swappable service layers
- AI promptability by exposing every repository method (reads and writes) as tools
- End-to-end type safety from schema-first definitions with explicit layer boundaries

## Rigid Rules (Must Follow)

1. Interface-first services: every external service (database, AI, observability) is accessed through an interface.
2. End-to-end type safety via schemas: every boundary uses a Zod/ArkType schema as the type source (`z.infer<>`). Never hand-write `type` for wire data. Service interfaces (`ReadRepository`, `AIAdapterService`, etc.) are hand-written contracts -- they define behaviour, not wire shapes. Prefer schema metadata and introspection (`.describe()`, route `validateSearch`, tool schemas, router `staticData`, JSON Schema output) over hand-maintained AI metadata.
3. Three schema layers: repository (DB-shaped), server-function / AI-tool (API-shaped, shared), router search-param (URL-shaped). Mappers translate between layers.
4. Repository contracts use repository-layer schemas only.
5. Server functions and AI tools share the same tools-layer schemas (`.inputValidator(Schema)` / `toolDefinition({ inputSchema })`). Both parse with `Schema.parse(args)`.
6. AI and UI interact only with tools-layer schemas; they must not depend directly on repository schemas.
7. Loaders-first data fetching: fetch route data in loaders through server functions.
8. URL-as-state: filters, tabs, selections live in URL search params via `validateSearch` (Zod/ArkType). Use `loaderDeps` to feed validated search into loaders.
9. Middleware chain: auth is global middleware, invalidation runs on mutation server functions.
10. Mutation pattern: POST server functions chain `.middleware([requireAuthMiddleware, invalidateMiddleware])`, return domain data or throw `HttpError`. Callers normalize errors: UI via `processResponse()`, AI tools via `safeToolHandler()` / `createSafeServerTool()`.
11. Query pattern: GET server functions throw on failure for centralized error handling. When possible, use static server functions for performance improvements.
12. Maximize AI tool coverage: expose **every** repository method (reads and writes) via `createSafeServerTool()` so failures return `{ error, code }`. If a server function exists, it gets a tool.
13. Router capabilities as AI client tools: expose `router.navigate()` and `router.invalidate()` as client tools via `toolDefinition()`.
14. AI system prompt context: `buildSystemPrompt()` injects context into every AI chat request from the single request context and the client ticket sent by the chat UI. Keep the request context flat (for example `{ ticket, client }` inside TanStack's `ctx.context`) and destructure it early in handlers; do not introduce nested custom context wrappers. Include current user, browser context, and current location. Derive route patterns and search params from live router/schema metadata where possible instead of maintaining static route tables.
15. JSDoc on exports: every exported function, interface, type, and constant gets a JSDoc comment stating *what* and *why*.
16. AI chat drawer: render the AI chat in the chosen UI library's right-side drawer/panel component mounted at the root layout level so messages persist across navigation. The template's default is a Mantine `Drawer` (`position="right"`, `size="lg"`), but generated apps may swap the component library when the user chooses a different stack.
17. AI renders rich markdown: use `react-markdown` + `remark-gfm` for assistant messages. Tables/code are styled through the chat markdown container using the chosen design system's theme tokens or CSS variables. Internal links render as TanStack Router `Link` with `preload="intent"` (client-side navigation without losing chat). External links open in a new tab. The AI uses markdown links in replies (e.g. `[Pending tasks](/tasks?status=pending)`).
18. Thin routes: route files contain only route config (`createFileRoute`, `validateSearch`, `loaderDeps`, `loader`, `component`). Page UI lives in `src/components/PageName/PageName.tsx`.
19. Promptable by default: check AI availability at the root loader level via `getAIAvailability()`. Only render the chat trigger and drawer when AI is configured — no disabled-state fallback.
20. Icon library: use `lucide-react` as the default icon library. Keep one icon library per project for visual consistency.
21. Structured logging: use `pino` for all server-side logging instead of `console.*`. Configure `@sentry/pino-transport` so error-level logs are automatically forwarded to Sentry when `VITE_SENTRY_DSN` is set. The logger singleton lives in `src/services/logger.ts`.
22. Build-time app version: extract the semver version from `package.json` at build time via Vite `define` and expose it as `__APP_VERSION__`. Inject it into Sentry (`release`), the pino logger (`version` field), and any other observability tool.
23. Dependency discipline: avoid installing unnecessary packages. Prefer existing project dependencies and platform APIs. When a package is truly required by the chosen stack, requested capability, or validation contract, use the latest stable compatible version via the package manager (`pnpm add <pkg>` with no guessed version suffix unless a known incompatibility requires a pin); run `pnpm outdated` and `pnpm update` to align the lockfile.
24. Ask for LLM provider: when scaffolding a new project or when the user's LLM preference is unclear, ask which provider they want before writing the adapter. Install only the chosen `@tanstack/ai-*` adapter package and configure matching env vars. Default is `@tanstack/ai-openai`; do not assume OpenAI without asking. See AGENTS.md section 8 for the full provider table.
25. Generate the system prompt: when scaffolding a new app, ask the user about their domain — entities, capabilities, and permissions — then generate a tailored `BASE_SYSTEM_PROMPT` in `src/routes/api/chat.ts` with six sections (Capabilities, Data Model, Links and navigation, Mutations and data refresh, Permissions and errors, Guidelines). Do not reuse the template's task-management prompt. `buildSystemPrompt()` composes this base with dynamic context (rule 14) and the navigation manifest. `chat()` from `@tanstack/ai` receives it via `systemPrompts: string[]`. See AGENTS.md section 8 "System Prompt Generation" for the full template.
26. Repository-resolved authorization: auth middleware extracts JWT claims **and** calls a repository method (e.g. `getReadRepository().getUserAccess(email)`) to enrich the request context with application-defined access data — roles, group memberships, owned scopes, superuser flags. Prefer a flat access-ticket object with identity, roles, UI-safe predicates, and throwing server guards. Downstream server functions and AI tools read this one ticket so UI and AI see the same permission signals. Authorization checks live **inside** server-function handlers (not only in UI components), so permissions are enforced regardless of caller.
27. Write attribution via traceability context: `WritableRepository` methods accept an optional `TraceabilityContext` (`createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate`) built from the authenticated identity. Mutation server-function handlers construct it from the request ticket (for example, `ticket.email`) and pass it to the repository. Seed and production implementations apply it consistently. This gives UI and AI callers the same audit trail without duplicating logic at each call site.
28. Explicit agent loop depth: configure `agentLoopStrategy: maxIterations(N)` explicitly on the `chat()` call (default N=10). This caps the number of consecutive tool-calling iterations the AI can run before returning a final answer, which bounds latency, cost, and infinite-loop risk. Tune N only after measuring; do not rely on the framework default.
29. Public runtime config bridge: expose non-secret runtime config (Sentry DSN, environment name, feature flags) via a GET server function `getPublicEnv()` and inline the result as `window.__ENV__` in the root `RootDocument` using a small `<script>` tag emitted before client JS runs. Escape `<` in the inlined JSON to avoid breaking the HTML parser. Never rely on `import.meta.env` alone for values that must differ across runtime environments built from the same bundle. See AGENTS.md section "Public Runtime Config" for the template.
30. Router UX defaults bundle: in `src/router.tsx`, configure `defaultStaleTime` (long for read-heavy dashboards, short for mutation-heavy apps), `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0` (always-fresh preloads), `scrollRestoration: true` (with a `getScrollRestorationKey` when needed), and a `notFoundComponent` on the root route. These defaults are a single coherent bundle — do not ship a router config without them.
31. Link wrapper preserves search & styling: export a project-local `Link` component (e.g. `src/components/Link/Link.tsx`) that wraps TanStack Router's `Link` with `search: true` as the default. Use this wrapper for every internal link so filters, tabs, and other URL state never silently drop on navigation. Ensure that links are still rendered using the chosen component library's corresponding element (e.g., using `createLink` or the `component` prop) so they inherit the correct styling. Reserve raw `<a>` for external URLs.
32. Parent layout routes deduplicate subtree work: when several child routes under the same URL prefix need the same redirect, synchronous guard, or expensive read, implement it **once** on the **parent** layout route. Use the parent's `beforeLoad` for navigation gates and synchronous checks; use the parent's `loader` (still via server functions) for shared data that every descendant needs. Child loaders fetch **only** data specific to that segment. Descendants read parent loader output with `getRouteApi('/parent/path').useLoaderData()` or `useLoaderData({ from: '/parent/path' })` — do not copy the parent's `beforeLoad` or re-fetch the parent's loader payload in each child. Structure files to match TanStack Router's layout conventions (e.g. `routes/foo/route.tsx` wrapping `routes/foo/*`).
33. Sentry user context + feedback: when Sentry is enabled, bind the signed-in user via `Sentry.setUser({ email, username })` from the shell component as soon as the identity loads (no extra round-trip).
34. Single markdown artifact for help + AI + suggested prompts: maintain one `docs/help.md` imported with `?raw`. Back three surfaces from it: (a) a `/help` route that renders it with `react-markdown`; (b) an AI tool that returns the content so the assistant can answer "how do I..." questions; (c) a parser that extracts `- [ ]` / `- [x]` lines as the chat's recommended-question list. Zero duplication between docs, assistant, and suggested prompts.
35. Distinct-value filter discovery: for every enum-ish field, the repository exposes a `getDistinctValues(field)` method that flows through a GET server function into a read-only AI tool (`getDistinctStatuses`, `getDistinctCategories`, …). The AI calls these to ground filter values in real data instead of guessing. The root loader can preload the same lists for UI filter bars so UI and AI share one vocabulary.
36. Reduce `"use client"` usage: TanStack Start supports full SSR and React Server Components. Rely on Server Components by default. Only use `"use client"` when state (`useState`), effects (`useEffect`), or browser APIs are strictly necessary. Keep client components small and at the leaf level.
37. Computed-field explanation fallback: for virtual fields whose semantics cannot be inferred from schema metadata (for example derived status, health, disposition, rollup, or permission fields), keep a small explanation registry next to the computation logic and expose an `explainField(fieldName)` AI tool. Do not duplicate explanations for fields already described by schemas.
38. Overlay repository pattern: when upstream systems own base data and users need local annotations, keep a read-only source collection plus a sparse overrides collection. Reads merge both through a pure `applyOverrides(source, override)` function; writes target only overrides and use explicit null/unset semantics to revert to source values.
39. URL-driven bulk edit pattern: store selected IDs and edit-category state in validated URL search params, keep dirty tracking local to the edit page, submit only changed fields, authorize per row, persist via a batched mutation, and clear stale selections when closing nested modal/detail routes.
40. Pre-auth redirect middleware: for renamed routes or legacy URL schemes, add a narrow middleware before auth that returns a relative `308 Permanent Redirect`. This prevents old links from producing misleading 401s. Keep the allowlist small and retire entries once upstream links migrate.

## Schema Boundaries

`Route search schema -> loader -> tools schema -> server fn -> mapping -> repo schema -> repo impl`

`repo output -> mapping -> tools schema -> AI or UI`

**Layer 1 — Repository schemas (DB-shaped):** internal to the repository, no `.describe()` needed. Define in `src/services/schemas/repository.ts` (target pattern -- currently all schemas live in `schemas.ts`). Infer types with `z.infer<>`.

**Layer 2 — Server-function / AI-tool schemas (API-shaped):** shared by `createServerFn` and `toolDefinition`. Add `.describe()` on every field -- descriptions flow into JSON Schema for the AI. Use these schema descriptions as the first source for field explanations, filter help, and AI tool guidance before adding any separate metadata file.

```typescript
// src/services/schemas/schemas.ts
const TaskInputSchema = z.object({
  title: z.string().min(1).describe('Short title'),
  status: TaskStatusSchema.default('pending').describe('Current status'),
  assignee: z.string().optional().describe('Assignee email'),
})
```

**Layer 3 — Router search-param schemas (URL-shaped):** defined locally in route files via `validateSearch`. Fields are always optional. Introspect these schemas, plus route `staticData`, when building AI navigation catalogs and link/filter guidance.

```typescript
// src/routes/tasks/index.tsx
const TasksSearchSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  search: z.string().optional(),
})
export const Route = createFileRoute('/tasks/')({
  validateSearch: TasksSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getTasks({ data: deps }),
})
```

**Type-safe mapping:** use `Schema.parse()` between layers so mismatches are caught at runtime (e.g. `TaskRepoInputSchema.parse(toolInput)`). Only add a computed-field explanation registry when the field is virtual and cannot be explained by schema metadata or route/tool introspection.

## Request Context

TanStack server functions expose middleware data at `ctx.context`; keep the app-owned value inside it flat. A good default is `{ ticket, client }`, where `ticket` carries identity, roles, predicates, and server-side guards, and `client` carries browser/runtime context such as timezone, locale, current path, and viewport.

```typescript
const updateTask = createServerFn({ method: 'POST' })
  .handler(async ctx => {
    const { ticket, client } = ctx.context
    ticket.requireTaskEditor(ctx.data.taskId)
    return getWritableRepository().updateTask(ctx.data, {
      actor: ticket.email,
      timezone: client.timezone,
    })
  })
```

Avoid custom shapes like `{ context: { user, client } }` inside `ctx.context`; they create redundant nested context and make examples harder to copy correctly.

## Interface Contracts

Repository interfaces use repository-layer types only (never tools-layer schemas). `AIAdapterService` and `ObservabilityService` follow the same interface-first pattern -- see their `types.ts` files.

```typescript
interface ReadRepository {
  getTasks(filter?: TaskRepoFilter): Promise<TaskRepoOutput[]>
  getTask(id: string): Promise<TaskRepoOutput | null>
  getDistinctValues(field: string): Promise<string[]>
  getUserProfile(email: string): Promise<UserProfile | null>
}
interface WritableRepository {
  createTask(input: TaskRepoInput, createdBy?: string): Promise<TaskRepoOutput>
  updateTask(id: string, input: Partial<TaskRepoInput>): Promise<TaskRepoOutput | null>
  deleteTask(id: string): Promise<boolean>
}
```

## Overlay Repositories

Use this when base records come from an upstream system (warehouse export, spreadsheet, vendor API) but the app needs local user-owned annotations.

- Keep upstream rows in a read-only source collection.
- Keep user edits in a sparse overrides collection with audit metadata.
- Reads load source rows and overrides, then merge through a pure `applyOverrides(source, override)` function.
- Writes target only the overrides collection; explicit `null`/unset values mean "revert to source".
- Unit-test the overlay function because it defines the merged view shown to the UI and AI.

## URL-Driven Bulk Editing

For multi-row edits, use a dedicated edit route such as `/tasks/edit?selected=id1&selected=id2`.

- Selection lives in validated URL search params, preferably repeated keys.
- Edit category/tab state also lives in search params.
- Dirty tracking stays local to the edit page and submits only changed cells.
- The mutation server function validates each row's permission and persists through one batched write.
- Closing nested modal/detail routes clears stale selection search params.

## Dynamic AI Metadata

Prefer live sources over static manifests:

- Route catalog: derive from `router.flatRoutes`, route `staticData`, path params, and `validateSearch` schemas.
- Field/tool metadata: derive from Zod/ArkType `.describe()` and generated JSON Schema.
- Help content: keep one markdown artifact for user help, AI help, and suggested prompts when the app needs those surfaces.
- System prompt: reserve static prompt text for behavior that cannot be discovered from tools, schemas, route metadata, or docs.

## Styling, Auth, and Observability

These topics are documented once in [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) to avoid drift:

- **UI library** -- see AGENTS.md section 3 for the selected component library's styling rules. The default template uses Mantine, but generated apps may choose another library.
- **Auth and Middleware** -- see AGENTS.md section 5 (middleware chain, `AuthContext`, guard helpers, code samples). Rigid rules 9--10 above are the normative summary.
- **Observability** -- see AGENTS.md section 9 (interface, Sentry/no-op, swap steps).

## Migration / Build Workflow

1. **Schemas**: repo-layer schemas in `repository.ts`, tools-layer in `schemas.ts` (with `.describe()`), mappers via `Schema.parse()`.
2. **Repository**: interfaces in `types.ts` (repo-layer types only), seed + production implementations.
3. **Server functions**: GET queries + POST mutations in `serverFns.ts` with `.inputValidator(ToolSchema)`.
4. **AI tools**: every server function gets a `toolDefinition` + `createSafeServerTool()`; client tools (`navigate`, `invalidateRouter`) wired in `ChatDrawer.tsx`. Reuse schema metadata for tool descriptions before adding hand-maintained explanatory text.
5. **Middleware + route catalog**: register pre-auth redirects (if needed), auth, and invalidation in `start.ts`; derive the AI route catalog from router/schema metadata instead of duplicating route tables.
6. **Routes**: `validateSearch` (Zod/ArkType), `loaderDeps`, loaders calling server functions; nest under layout parents when children share `beforeLoad` or loader data (rule 33).
7. **Chat + tests**: pass client/browser context to `/api/chat`; E2E specs in `e2e/` against seed repository. For scaffold/setup work, finish by running the app in dev mode and checking `/api/health`.

## TanStack Intent and CLI Workflow

Use `tanstack intent` and `tanstack cli` as executable guidance during development. Do not add them as project dependencies unless the generated app explicitly needs them.

### TanStack Intent (Package Skills)
Intent answers "which version-matched package skill should the agent follow?"
- Setup: Run `npx @tanstack/intent@latest install` when configuring agent instructions in a generated app.
- Discover: Before substantial TanStack work, run `npx @tanstack/intent@latest list` or use skills already listed in context.
- Load: Load a matching package skill with `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Check staleness: Use `npx @tanstack/intent@latest stale` to detect outdated source documentation references.

### TanStack CLI
CLI docs search answers "what do the current TanStack docs say about this API or pattern?"
- The CLI provides docs search, MCP support, modular integrations, Builder, and deployment/scaffold support.
- See `npx @tanstack/cli --help` for available commands.

## TanStack documentation (official CLI)

Prefer **current** TanStack guidance over training-data recall. The TanStack team ships a CLI that mirrors the docs site.

- Run `npx @tanstack/cli --help` first to see the command surface; use `npx @tanstack/cli help <command>` (e.g. `help search-docs`) for flags and arguments on the machine you are using.
- `npx @tanstack/cli libraries` — list library **IDs** and versions (use these IDs with `doc` and `search-docs --library`).
- `npx @tanstack/cli search-docs "<query>" [--library router|start|ai|query|table|...] [--framework <name>] [--limit N]` — find doc sections before changing router, Start, or AI code.
- `npx @tanstack/cli doc <library> <path> [--docs-version latest]` — fetch a full doc page (library examples: `router`, `start`, `ai`, `query`; path examples mirror the docs tree, e.g. `framework/react/guide/data-loading` — confirm the exact path via `search-docs` when unsure).

**Quick reference**

| Need | Starting point |
|------|----------------|
| Correct loader / `beforeLoad` / layout behavior | `search-docs` with `--library router` (or `start` for TanStack Start) |
| Exact chat / tool / adapter API | `search-docs` / `doc` with `--library ai` |
| Unknown CLI flag | `npx @tanstack/cli --help` and command-specific `--help` |

## AI Architecture

The AI stack uses three packages from `@tanstack/ai`:

- **Server** (`@tanstack/ai`): `chat()`, `toolDefinition()`, `convertMessagesToModelMessages()`, `toServerSentEventsResponse()`, `maxIterations()`. Adapter packages: `@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-gemini`, `@tanstack/ai-ollama`, `@tanstack/ai-openrouter`, `@tanstack/ai-groq`, `@tanstack/ai-grok`. See AGENTS.md section 8 for the provider table, env vars, and adapter factory pattern.
- **Client** (`@tanstack/ai-react` + `@tanstack/ai-client`): `useChat()`, `fetchServerSentEvents()`, `clientTools()`, `createChatClientOptions()`. Client tools execute automatically — no `onToolCall` callback. See AGENTS.md section 8 "Chat Client Setup" for the wiring example.
- **Endpoint** (`src/routes/api/chat.ts`): the wiring point connecting adapter, system prompt, tools, and auth. See below and AGENTS.md section 8 "Chat Endpoint" for the full anatomy.

### Chat Endpoint (`src/routes/api/chat.ts`)

A TanStack Start file-based route at `/api/chat` with two handlers:

- **GET** — returns `{ available: boolean }` so the root loader can decide whether to show the chat UI (rule 19).
- **POST** — check adapter → parse `{ messages, browserContext }` → read the request ticket from middleware context → validate client context schema → `buildSystemPrompt()` → assemble tools array → `chat({ adapter, messages, systemPrompts, tools, agentLoopStrategy })` → `toServerSentEventsResponse(stream)`.

`buildSystemPrompt()` composes `BASE_SYSTEM_PROMPT` (rule 25) + navigation manifest + dynamic context (rule 14). When modifying: add tools to the array, update `BASE_SYSTEM_PROMPT` when the data model changes, add pattern-matching for new dynamic route segments. See AGENTS.md section 8 "System Prompt Generation" for the six-section prompt template.

## Dynamic Route Schema Extraction for AI

To help the AI navigate accurately using client tools, dynamically extract your TanStack Router configuration from `router.flatRoutes`. Map this array to extract `fullPath`, `staticData.description` (for page context), path params (from segments starting with `$`), and search params by introspecting `validateSearch` schemas where possible. Passing this structured map in the system prompt allows the AI to discover available routes and required parameters without hallucinating URLs. Fall back to hand-maintained metadata only when the framework/schema surface cannot expose the needed description.

## Verification

Testing setup (Vitest, Playwright, auth fixtures) and the full validation checklist are in [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) sections 10 and 12. Quick smoke test: `pnpm format && pnpm lint && pnpm knip && pnpm test && pnpm build`. If the project has not wired Knip yet, add the latest stable `knip` dev dependency or explicitly document why unused-code validation is deferred. After scaffolding or setup changes, also start dev mode and ping `/api/health`; if required credentials are missing, state which prerequisite blocked the health check and what was verified instead.
