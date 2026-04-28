# TanStack Fullstack Pattern

- Project: `TanStack AI-Promptable Full-Stack Template`
- Project summary: A production-ready TanStack Start template designed to make internal tools AI promptable by default.
- Author: Carlos Martin-Sanchez (https://github.com/carlosvin)
- License: MIT
- Homepage: https://github.com/carlosvin/tanstack-fullstack-ai-template
- Repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
- Documentation: https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/skills/README.md
- Status: stable
- Supported tools: Windsurf [native, tested], Cursor [copy, tested], Claude Code [copy, tested]
- Capabilities: AI promptable application architecture, Promptable-by-default AI chat in a side drawer when credentials are present, Natural language querying through repository-backed AI tools, URL-aware AI prompt context using current location and route patterns, Swappable service implementations behind stable interfaces, Layer-specific schemas with explicit mapping between repository and tool contracts, Thin routes with extracted, testable page components, Structured server-side logging with pino and automatic Sentry error forwarding, Build-time semver version injected into observability tools for release tracking, Public runtime config exposed to the browser via window.__ENV__ without relying on import.meta.env, Consistent router UX defaults for preload, stale time, and scroll restoration, Distinct-value filter discovery tools that ground AI filter values in real data, Single markdown artifact backing the help page, an AI tool, and the chat's recommended-prompt list, Parent layout routes that centralize beforeLoad guards and shared loader data for nested child routes
- ID: `tanstack-fullstack-pattern`
- Version: `1.10.0`
- Tags: tanstack-start, fullstack, architecture, interface-first, repository-pattern, ai-promptable

## Summary

Use when scaffolding a new TanStack Start project, adding domain entities to the fullstack template, or implementing the interface-first repository pattern with AI-promptable tools, or nested layout routes duplicate beforeLoad checks or loaders that should live on a parent route, or TanStack Router, Start, or AI behavior must be verified against current documentation instead of training data.

## Triggers

- fullstack template
- TanStack Start project
- repository pattern
- interface-first
- new app scaffold
- nested routes
- layout route
- beforeLoad
- tanstack cli

## Canonical Content
# TanStack Fullstack Pattern

An interface-first fullstack architecture built on TanStack Start. The pattern defines clear interface boundaries between layers -- interfaces are rigid, implementations are swappable.

> **Companion documentation:** In repositories built from this template, [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) holds the project handbook -- file structure, Mantine styling, auth snippets, Biome, testing/E2E commands, and the full validation checklist. This skill focuses on the architectural contract; refer to AGENTS.md for operational detail.

## Pattern Overview

- Zero-config development with seed implementations and swappable service layers
- AI promptability by exposing every repository method (reads and writes) as tools
- End-to-end type safety from schema-first definitions with explicit layer boundaries

## Rigid Rules (Must Follow)

1. Interface-first services: every external service (database, AI, observability) is accessed through an interface.
2. End-to-end type safety via schemas: every boundary uses a Zod/ArkType schema as the type source (`z.infer<>`). Never hand-write `type` for wire data. Service interfaces (`ReadRepository`, `AIAdapterService`, etc.) are hand-written contracts -- they define behaviour, not wire shapes.
3. Three schema layers: repository (DB-shaped), server-function / AI-tool (API-shaped, shared), router search-param (URL-shaped). Mappers translate between layers.
4. Repository contracts use repository-layer schemas only.
5. Server functions and AI tools share the same tools-layer schemas (`.inputValidator(Schema)` / `toolDefinition({ inputSchema })`). Both parse with `Schema.parse(args)`.
6. AI and UI interact only with tools-layer schemas; they must not depend directly on repository schemas.
7. Loaders-first data fetching: fetch route data in loaders through server functions.
8. URL-as-state: filters, tabs, selections live in URL search params via `validateSearch` (Zod/ArkType). Use `loaderDeps` to feed validated search into loaders.
9. Middleware chain: auth is global middleware, invalidation runs on mutation server functions.
10. Mutation pattern: POST server functions chain `.middleware([requireAuthMiddleware, invalidateMiddleware])`, return domain data or throw `HttpError`. Callers normalize errors: UI via `processResponse()`, AI tools via `safeToolHandler()` / `createSafeServerTool()`.
11. Query pattern: GET server functions throw on failure for centralized error handling.
12. Maximize AI tool coverage: expose **every** repository method (reads and writes) via `createSafeServerTool()` so failures return `{ error, code }`. If a server function exists, it gets a tool.
13. Router capabilities as AI client tools: expose `router.navigate()` and `router.invalidate()` as client tools via `toolDefinition()`.
14. AI system prompt context: `buildSystemPrompt()` injects three context blocks into every AI chat request. (a) **Current User** — name, email, role from the auth middleware context (server-side; no client round-trip needed). (b) **Browser Context** — timezone, locale, and current date/time from `browserContext` sent by `ChatDrawer` (client-side). (c) **Current Location** — pathname, search params, and full URL from `browserContext`; route patterns (e.g. `/tasks/$taskId`) are matched to resolve dynamic segments. The navigation manifest mirrors `routeTree.gen.ts` and lists each route's search params. When adding routes, update `navigationManifest.ts` and add pattern-matching in `buildSystemPrompt()` for new dynamic segments.
15. JSDoc on exports: every exported function, interface, type, and constant gets a JSDoc comment stating *what* and *why*.
16. AI chat drawer: render the AI chat in a Mantine `Drawer` (`position="right"`, `size="lg"`) mounted at the root layout level so messages persist across navigation. `useDisclosure` controls open/close. See AGENTS.md section 8 for rendering details.
17. AI renders rich markdown: use `react-markdown` + `remark-gfm` for assistant messages. Tables/code styled via `.markdown` CSS Module with Mantine CSS variables. Internal links render as TanStack Router `Link` with `preload="intent"` (client-side navigation without losing chat). External links open in a new tab. The AI uses markdown links in replies (e.g. `[Pending tasks](/tasks?status=pending)`).
18. Thin routes: route files contain only route config (`createFileRoute`, `validateSearch`, `loaderDeps`, `loader`, `component`). Page UI lives in `src/components/PageName/PageName.tsx`.
19. Promptable by default: check AI availability at the root loader level via `getAIAvailability()`. Only render the chat trigger and drawer when AI is configured — no disabled-state fallback.
20. Icon library: use `lucide-react` as the default icon library. Keep one icon library per project for visual consistency.
21. Structured logging: use `pino` for all server-side logging instead of `console.*`. Configure `@sentry/pino-transport` so error-level logs are automatically forwarded to Sentry when `VITE_SENTRY_DSN` is set. The logger singleton lives in `src/services/logger.ts`.
22. Build-time app version: extract the semver version from `package.json` at build time via Vite `define` and expose it as `__APP_VERSION__`. Inject it into Sentry (`release`), the pino logger (`version` field), and any other observability tool.
23. Latest dependencies: install and keep dependencies at latest compatible versions. Never pin exact versions unless a known incompatibility exists. Use `pnpm add <pkg>` (no version suffix); run `pnpm outdated` and `pnpm update` to align the lockfile.
24. Ask for LLM provider: when scaffolding a new project or when the user's LLM preference is unclear, ask which provider they want before writing the adapter. Install only the chosen `@tanstack/ai-*` adapter package and configure matching env vars. Default is `@tanstack/ai-openai`; do not assume OpenAI without asking. See AGENTS.md section 8 for the full provider table.
25. Generate the system prompt: when scaffolding a new app, ask the user about their domain — entities, capabilities, and permissions — then generate a tailored `BASE_SYSTEM_PROMPT` in `src/routes/api/chat.ts` with six sections (Capabilities, Data Model, Links and navigation, Mutations and data refresh, Permissions and errors, Guidelines). Do not reuse the template's task-management prompt. `buildSystemPrompt()` composes this base with dynamic context (rule 14) and the navigation manifest. `chat()` from `@tanstack/ai` receives it via `systemPrompts: string[]`. See AGENTS.md section 8 "System Prompt Generation" for the full template.
26. Repository-resolved authorization: `authMiddleware` extracts JWT claims **and** calls a repository method (e.g. `getReadRepository().getUserAccess(email)`) to enrich `AuthContext` with application-defined access data — roles, group memberships, owned scopes, superuser flags. Downstream guards (`requireAuth`, `requireGroup`, any app-specific `requireOwnerOf`) and AI tools read this enriched context so UI and AI see the same permission signals. Authorization checks live **inside** server-function handlers (not only in UI components), so permissions are enforced regardless of whether the caller is the UI, the AI, or a direct HTTP client.
27. Write attribution via traceability context: `WritableRepository` methods accept an optional `TraceabilityContext` (`createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate`) built from the authenticated identity. Mutation server-function handlers construct it from `ctx.context.user.email` (available after `requireAuthMiddleware`) and pass it to the repository. Seed and production implementations apply it consistently. This gives UI and AI callers the same audit trail without duplicating logic at each call site.
29. Explicit agent loop depth: configure `agentLoopStrategy: maxIterations(N)` explicitly on the `chat()` call (default N=10). This caps the number of consecutive tool-calling iterations the AI can run before returning a final answer, which bounds latency, cost, and infinite-loop risk. Tune N only after measuring; do not rely on the framework default.
30. Public runtime config bridge: expose non-secret runtime config (Sentry DSN, environment name, feature flags) via a GET server function `getPublicEnv()` and inline the result as `window.__ENV__` in the root `RootDocument` using a small `<script>` tag emitted before client JS runs. Escape `<` in the inlined JSON to avoid breaking the HTML parser. Never rely on `import.meta.env` alone for values that must differ across runtime environments built from the same bundle. See AGENTS.md section "Public Runtime Config" for the template.
31. Router UX defaults bundle: in `src/router.tsx`, configure `defaultStaleTime` (long for read-heavy dashboards, short for mutation-heavy apps), `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0` (always-fresh preloads), `scrollRestoration: true` (with a `getScrollRestorationKey` when needed), and a `notFoundComponent` on the root route. These defaults are a single coherent bundle — do not ship a router config without them.
32. Link wrapper preserves search: export a project-local `Link` component (e.g. `src/components/Link/Link.tsx`) that wraps TanStack Router's `Link` with `search: true` as the default. Use this wrapper for every internal link so filters, tabs, and other URL state never silently drop on navigation. Reserve raw `<a>` for external URLs.
33. Parent layout routes deduplicate subtree work: when several child routes under the same URL prefix need the same redirect, synchronous guard, or expensive read, implement it **once** on the **parent** layout route. Use the parent's `beforeLoad` for navigation gates and synchronous checks; use the parent's `loader` (still via server functions) for shared data that every descendant needs. Child loaders fetch **only** data specific to that segment. Descendants read parent loader output with `getRouteApi('/parent/path').useLoaderData()` or `useLoaderData({ from: '/parent/path' })` — do not copy the parent's `beforeLoad` or re-fetch the parent's loader payload in each child. Structure files to match TanStack Router's layout conventions (e.g. `routes/foo/route.tsx` wrapping `routes/foo/*`).
34. Sentry user context + feedback: when Sentry is enabled, bind the signed-in user via `Sentry.setUser({ email, username })` from the shell component as soon as the identity loads (no extra round-trip).
35. Single markdown artifact for help + AI + suggested prompts: maintain one `docs/help.md` imported with `?raw`. Back three surfaces from it: (a) a `/help` route that renders it with `react-markdown`; (b) an AI tool that returns the content so the assistant can answer "how do I..." questions; (c) a parser that extracts `- [ ]` / `- [x]` lines as the chat's recommended-question list. Zero duplication between docs, assistant, and suggested prompts.
36. Distinct-value filter discovery: for every enum-ish field, the repository exposes a `getDistinctValues(field)` method that flows through a GET server function into a read-only AI tool (`getDistinctStatuses`, `getDistinctCategories`, …). The AI calls these to ground filter values in real data instead of guessing. The root loader can preload the same lists for UI filter bars so UI and AI share one vocabulary.

## Schema Boundaries

`Route search schema -> loader -> tools schema -> server fn -> mapping -> repo schema -> repo impl`

`repo output -> mapping -> tools schema -> AI or UI`

**Layer 1 — Repository schemas (DB-shaped):** internal to the repository, no `.describe()` needed. Define in `src/services/schemas/repository.ts` (target pattern -- currently all schemas live in `schemas.ts`). Infer types with `z.infer<>`.

**Layer 2 — Server-function / AI-tool schemas (API-shaped):** shared by `createServerFn` and `toolDefinition`. Add `.describe()` on every field -- descriptions flow into JSON Schema for the AI.

```typescript
// src/services/schemas/schemas.ts
const TaskInputSchema = z.object({
  title: z.string().min(1).describe('Short title'),
  status: TaskStatusSchema.default('pending').describe('Current status'),
  assignee: z.string().optional().describe('Assignee email'),
})
```

**Layer 3 — Router search-param schemas (URL-shaped):** defined locally in route files via `validateSearch`. Fields are always optional.

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

**Type-safe mapping:** use `Schema.parse()` between layers so mismatches are caught at runtime (e.g. `TaskRepoInputSchema.parse(toolInput)`).

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

## Styling, Auth, and Observability

These topics are documented once in [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) to avoid drift:

- **Mantine UI** -- see AGENTS.md section 3 (component-first styling, CSS Modules, dark mode).
- **Auth and Middleware** -- see AGENTS.md section 5 (middleware chain, `AuthContext`, guard helpers, code samples). Rigid rules 9--10 above are the normative summary.
- **Observability** -- see AGENTS.md section 9 (interface, Sentry/no-op, swap steps).

## Migration / Build Workflow

1. **Schemas**: repo-layer schemas in `repository.ts`, tools-layer in `schemas.ts` (with `.describe()`), mappers via `Schema.parse()`.
2. **Repository**: interfaces in `types.ts` (repo-layer types only), seed + production implementations.
3. **Server functions**: GET queries + POST mutations in `serverFns.ts` with `.inputValidator(ToolSchema)`.
4. **AI tools**: every server function gets a `toolDefinition` + `createSafeServerTool()`; client tools (`navigate`, `invalidateRouter`) wired in `ChatDrawer.tsx`.
5. **Middleware + manifest**: register auth + invalidation in `start.ts`; keep `navigationManifest.ts` aligned with routes.
6. **Routes**: `validateSearch` (Zod/ArkType), `loaderDeps`, loaders calling server functions; nest under layout parents when children share `beforeLoad` or loader data (rule 33).
7. **Chat + tests**: pass `browserContext` location to `/api/chat`; E2E specs in `e2e/` against seed repository.

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
- **POST** — check adapter → parse `{ messages, browserContext }` → extract auth from `context as AuthContext` → validate `BrowserContextSchema` → `buildSystemPrompt()` → assemble tools array → `chat({ adapter, messages, systemPrompts, tools, agentLoopStrategy })` → `toServerSentEventsResponse(stream)`.

`buildSystemPrompt()` composes `BASE_SYSTEM_PROMPT` (rule 25) + navigation manifest + dynamic context (rule 14). When modifying: add tools to the array, update `BASE_SYSTEM_PROMPT` when the data model changes, add pattern-matching for new dynamic route segments. See AGENTS.md section 8 "System Prompt Generation" for the six-section prompt template.

## Verification

Testing setup (Vitest, Playwright, auth fixtures) and the full validation checklist are in [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) sections 10 and 12. Quick smoke test: `pnpm format && pnpm lint && pnpm test && pnpm build`.
