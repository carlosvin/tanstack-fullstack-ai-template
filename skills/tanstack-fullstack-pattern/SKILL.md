---
name: tanstack-fullstack-pattern
description: 'Use when scaffolding a new TanStack Start project, adding domain
  entities to the fullstack template, or implementing the interface-first
  repository pattern with AI-promptable tools. Project: TanStack AI-Promptable
  Full-Stack Template. Triggers on "fullstack template", "TanStack Start
  project", "repository pattern", "interface-first", "new app scaffold".'
---

> This file is generated from `skills/src/*.skill.yaml`. Do not edit manually.
# TanStack Fullstack Pattern

An interface-first fullstack architecture built on TanStack Start. The pattern defines clear interface boundaries between layers -- interfaces are rigid, implementations are swappable.

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
10. Mutation pattern: POST server functions chain `.middleware([requireAuthMiddleware, invalidateMiddleware])` and return normalized `{ data, error }`.
11. Query pattern: GET server functions throw on failure for centralized error handling.
12. Maximize AI tool coverage: expose **every** repository method (reads and writes) via `createSafeServerTool()` so failures return `{ error, code }`. If a server function exists, it gets a tool.
13. Router capabilities as AI client tools: expose `router.navigate()` and `router.invalidate()` as client tools via `toolDefinition()`.
14. AI chat context is URL-aware: pass current location to `/api/chat`; keep the navigation manifest aligned with routes.
15. JSDoc on exports: every exported function, interface, type, and constant gets a JSDoc comment stating *what* and *why*.
16. Chat persists across navigation: render `ChatDrawer` at the root layout level so messages survive route changes.
17. AI renders rich markdown: use `react-markdown` + `remark-gfm` for tables, code blocks, links. Internal paths render as Router `Link` components; the AI uses markdown links (e.g. `[Pending tasks](/tasks?status=pending)`) for in-app navigation.

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

## Styling and UI (Mantine)

- Use Mantine components and styling props (`c`, `fw`, `size`, `variant`, responsive object syntax) before custom CSS.
- Design tokens (colors, fonts, spacing, radius) go in `createTheme()` at `__root.tsx`.
- CSS Modules only when Mantine props cannot express the style; use `--mantine-color-*` variables. All components must support light and dark schemes.

## Auth and Middleware

- `authMiddleware` (global) extracts JWT from configurable header (`AUTH_HEADER_NAME`) and provides typed `context.user` / `context.userProfile`.
- `requireAuthMiddleware` chains auth; POST mutations require it, GET queries stay unauthenticated. Guards: `requireAuth(context)` throws 401, `requireGroup(context, group)` throws 403.
- Custom authorization: composable middleware chaining `authMiddleware` + `invalidateMiddleware` on POST server functions.

## Migration / Build Workflow

1. **Schemas**: repo-layer schemas in `repository.ts`, tools-layer in `schemas.ts` (with `.describe()`), mappers via `Schema.parse()`.
2. **Repository**: interfaces in `types.ts` (repo-layer types only), seed + production implementations.
3. **Server functions**: GET queries + POST mutations in `serverFns.ts` with `.inputValidator(ToolSchema)`.
4. **AI tools**: every server function gets a `toolDefinition` + `createSafeServerTool()`; client tools (`navigate`, `invalidateRouter`) wired in `ChatDrawer.tsx`.
5. **Middleware + manifest**: register auth + invalidation in `start.ts`; keep `navigationManifest.ts` aligned with routes.
6. **Routes**: `validateSearch` (Zod/ArkType), `loaderDeps`, loaders calling server functions.
7. **Chat + tests**: pass `browserContext` location to `/api/chat`; E2E specs in `e2e/` against seed repository.

## Looking Up TanStack Documentation

Use `npx @tanstack/cli` to fetch up-to-date docs instead of relying on training data. Run `--help` for all commands.

## AI Chat Pipeline

- Server tools use `toolDefinition` from `@tanstack/ai` and call the same exported server functions as route loaders. Args typed via `Schema.parse(args)` since `.server()` types args as `unknown`.
- `POST /api/chat` (`src/routes/api/chat.ts`) uses SSE streaming and the auth middleware context.
- Keep the system prompt updated when the data model or routes change.

### Client Tools (Router Capabilities for AI)

Client tools are definition-only in `tools.ts` (no `.server()`) and wired in the browser via `.client()` and `clientTools()` from `@tanstack/ai-client`:

```typescript
// tools.ts — definition only
export const navigateToolDef = toolDefinition({
  name: 'navigate',
  inputSchema: NavigateInputSchema, // mirrors route search schemas
  outputSchema: z.object({ success: z.boolean() }),
})
// ChatDrawer.tsx — browser wiring
const navigateClient = navigateToolDef.client((args) => {
  const input = NavigateInputSchema.parse(args)
  router.navigate({ to: input.to, search: input.search ?? undefined })
  return { success: true }
})
const tools = clientTools(navigateClient, invalidateClient)
```

## Observability

- `ObservabilityService` interface in `src/services/observability/types.ts`; Sentry and no-op implementations with factory.
- Server init: `instrument.server.mjs`; client init: `src/router.tsx`. Usage: `getObservability().startSpan('name', fn)`.
- To swap providers: implement `ObservabilityService`, update factory, replace `instrument.server.mjs`.

## Post-Setup Verification

Run in order: `pnpm install && pnpm update` (latest compatible versions), `pnpm format && pnpm lint` (Biome, zero errors), `pnpm test` (at least one passing), `pnpm build` (production build succeeds).

## Testing

- **Unit**: Vitest + jsdom + Testing Library; `renderWithProviders()` wraps MantineProvider. Co-located as `*.test.ts(x)`.
- **E2E**: Playwright (Chromium), `REPOSITORY_TYPE=seed`, specs in `e2e/*.spec.ts`. Auth fixture provides `authedPage` / `authedContext` via unsigned JWTs.
