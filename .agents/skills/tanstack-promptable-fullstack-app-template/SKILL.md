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

**Purpose:** Capture the **interface-first, schema-layered, AI-promptable** contract for TanStack Start apps from this template. Day-to-day conventions (UI kit, chat wiring, logging, tests) live in the repo’s **AGENTS.md** — use this skill for **architecture**, AGENTS.md for **operations**.

> **Companion handbook:** [AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md) — structure, styling, auth snippets, Biome, testing/E2E, validation checklist, AI chat setup.
>
> **Companion skill:** `observability-and-env` — use it when changing logging, Sentry, environment schemas, or runtime config plumbing. Keep this skill focused on the architecture contract rather than the observability setup recipe.

## How to use this skill

1. Read **Core Contract** first — it is the non-negotiable architecture.
2. Run the **Architecture Checklist** before every non-trivial change.
3. Jump to **Schema Boundaries**, **Request Context**, or **Special Patterns** only when that concern applies.
4. Use **[AGENTS.md](https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/AGENTS.md)** for operational how-to (UI kit, chat wiring, logging, tests, validation commands) — not for inventing alternate architecture.

## Common failure modes (avoid these)

- **Route state in React state:** filters, tabs, or selections in `useState` instead of validated URL search params + `loaderDeps`.
- **Repository schemas at the wrong edge:** importing repository-layer schemas into UI, tools, or AI tool inputs — use tools-layer schemas only.
- **Server function without a tool:** adding `createServerFn` but skipping `toolDefinition` + `createSafeServerTool` for the same capability.
- **Parse only half the boundary:** validating inbound tools input but returning raw repo rows to UI/AI without tools-layer `Schema.parse` on the way out.
- **UI-only auth:** hiding buttons in components but skipping guards in server handlers.
- **Type escape hatches:** `any`, loose `Record<string, unknown>`, or `as` after `Schema.parse` — narrow, guard, or fix types instead.
- **Duplicated parent work:** copying a parent layout’s `beforeLoad`, loader, or expensive read into each child route.

## Core Contract

1. **Interfaces:** Database, AI, observability (and other externals) sit behind interfaces; implementations are swappable.
2. **Schemas as the type source:** Wire and tool shapes use Zod/ArkType + `z.infer<>`. Hand-written interfaces define **behavior** (`ReadRepository`, `AIAdapterService`, …), not ad-hoc JSON types.
3. **Three schema layers:** **Repository** (DB-shaped), **tools / server-fn** (API-shaped, shared between `createServerFn` and `toolDefinition`), **router search** (URL-shaped). Translate with `Schema.parse()` at each boundary.
4. **TypeScript inside the typed flow:** After schema boundaries, preserve **inferred types end-to-end** — prefer `satisfies`, discriminated unions, `as const` tuples, narrow **type guards**, and **exhaustive `switch`** (e.g. `default` branch calling `assertNever`) over `any`, broad `unknown` plumbing, or `as` casts (only use `as` at documented third-party/library seams per AGENTS.md).
5. **Repository vs tools:** Repository implementations use repository-layer schemas only. **Server functions and AI tools share the same tools-layer schemas** (`.inputValidator` / `toolDefinition` inputSchema + `Schema.parse`). UI and AI consume tools-layer types only — never import repository schemas at those edges.
6. **Server functions:** GET queries throw on failure; POST mutations chain `.middleware([requireAuthMiddleware, invalidateMiddleware])`; handlers return data or throw `HttpError`; callers normalize with `processResponse` / `safeToolHandler` / `createSafeServerTool`.
7. **Routes:** Thin route files (`createFileRoute`, `validateSearch`, `loaderDeps`, `loader`, `component`); page UI in `src/components/`. **Loaders** fetch via server functions — no `useEffect` data fetching for route data.
8. **URL-as-state:** Filters, tabs, selections in validated **search** params; use `loaderDeps` so only relevant search fields key the loader cache.
9. **Router config bundle:** ship a project-local `Link` wrapper with `search: true` default (use it for every internal link) **and** these router defaults together: `defaultStaleTime`, `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`, `scrollRestoration: true`, `notFoundComponent`.
10. **Auth ticket built in middleware:** auth middleware enriches `ctx.context` with a repository-built ticket (e.g. `getReadRepository().getUserAccess(email)`) carrying identity, roles, and guards; `WritableRepository` mutations accept a `TraceabilityContext` (`createdBy`, `lastModifiedBy`, …) constructed from that ticket so writes are attributed consistently across UI and AI.
11. **AI tool coverage:** expose **every** repository method as a server AI tool via `createSafeServerTool`; add **distinct-values** tools for enum-ish filters; expose `navigate` and `invalidateRouter` as client tools.
12. **Promptable by default:** root loader checks `getAIAvailability()` and only mounts chat UI when configured (no disabled state). Chat input includes a `browserContext` (timezone, locale, path) consumed by `buildSystemPrompt` alongside the auth ticket.
13. **Bound the agent loop:** every `chat()` call sets `agentLoopStrategy: maxIterations(N)` explicitly (default `N=10`); tune after measuring — do not rely on the framework default.
14. **Metadata for AI and UI:** Use `.describe()` for all narrative explanations (JSON Schema `description`). Use `.meta({ ... })` only for **structured extras** — `unit`, `format`, optional `title`, app-specific hints — not as a substitute for `.describe()`. Prefer deriving prompts and UI copy from schemas + `z.toJSONSchema()` and router introspection over parallel hand-maintained maps.
15. **Parent layouts:** Shared `beforeLoad`, redirects, and expensive reads belong on the **parent** layout route; children read parent loader data via `getRouteApi` / `useLoaderData({ from })` — do not duplicate parent work.

## Architecture Checklist

Scan before changing code:

- **One tools-layer schema per wire shape:** `createServerFn` `.inputValidator(Schema)` and AI `toolDefinition({ inputSchema })` share the same schema — no duplicate hand-written wire types.
- **Parse both directions:** tools → repository inputs and repository rows → tools/API outputs each end in the target layer’s `Schema.parse()` (pure mapper functions are fine if the final step is always `.parse()`).
- **No type erasure:** after `Schema.parse`, carry **`z.infer`-derived types** through server functions, repos, tools, and components — do not widen back to `Record<string, unknown>` / `any`.
- **Repository interfaces = repo-layer types only:** mapping lives beside schemas / mappers — not in React components.
- **Auth ticket is repository-backed and server-enforced:** middleware builds the ticket (e.g. `getReadRepository().getUserAccess(email)`); guards run in **server handlers**, never UI-only.
- **Writes use `TraceabilityContext`:** pass audit fields from the ticket through a single context object on `WritableRepository` mutations — avoid sprinkling raw `email` arguments.
- **Navigation is one decision:** ship the **router defaults bundle** and the **project `Link` wrapper** (`search: true`) together so URL state survives navigation.
- **AI stack is complete:** every repo method → server tool + safe handler; client **`navigate`** / **`invalidateRouter`**; root **`getAIAvailability()`**; chat payload includes **`browserContext`**; **`chat({ agentLoopStrategy: maxIterations(N) })`**.
- **Routes:** **`validateSearch`** + **`loaderDeps`**; duplicate **`beforeLoad`** / shared loaders only on **parent** layouts.
- **Metadata discipline:** `.describe()` for narrative copy; `.meta()` for structured extras; closed vocabularies = `as const` tuple + `z.enum` + `z.infer<>`.

## Markdown assistant replies (UX contract)

Assistant messages in the chat UI must **render as Markdown** (including GFM): lists, **tables**, fenced and inline code blocks, and links. Internal paths like `[Tasks](/tasks)` should remain **client-navigable** where the app implements markdown links (do not flatten assistant output to plain text for display). Concrete stack (`react-markdown`, `remark-gfm`, styling, `MarkdownLink` behavior) lives in **AGENTS.md §8** — agents changing chat rendering must follow that section.

## Schema Boundaries

`Route search schema → loader → tools schema → server fn → mapping → repo schema → repo`

`repo output → mapping → tools schema → AI or UI`

**Layer 1 — Repository (DB-shaped):** define in `src/services/schemas/repository.ts` (target layout; today some apps still colocate in `schemas.ts`). No `.describe()` required here. Infer with `z.infer<>`.

**Layer 2 — Tools / server functions (API-shaped):** one schema for `.inputValidator(Schema)` and `toolDefinition({ inputSchema })`; parse args with `Schema.parse(args)`.

```typescript
// Example: tools-layer object — .describe() for text; .meta() for non-description fields
const TaskInputSchema = z.object({
  title: z.string().min(1).describe('Short title'),
  status: TaskStatusSchema.default('pending').describe('Current status'),
  estimateHours: z
    .number()
    .optional()
    .describe('Estimated effort in hours')
    .meta({ unit: 'h', format: 'decimal' }),
})
```

**Closed vocabularies (enums, tool categories, filter buckets):** `const VALUES = [...] as const`, then `z.enum(VALUES)`, put prose in `.describe()`, optional `.meta({ title: '...' })`, infer with `z.infer<>`. **Do not** treat `export const LABELS = { id: 'Display Name' } as const` as the authority for the same strings unless it is derived from or validated by that schema.

```typescript
const TOOL_CATEGORY_VALUES = ['Metadata & Navigation', 'Strategic Objectives'] as const

export const ToolCategorySchema = z
  .enum(TOOL_CATEGORY_VALUES)
  .describe(
    'Used in toolDefinition metadata.category; groups tools and documents allowed values for the LLM.',
  )
  .meta({ title: 'Tool category' })

export type ToolCategory = z.infer<typeof ToolCategorySchema>
```

**Layer 3 — Router search (URL-shaped):** local `validateSearch` schemas; fields are usually optional for partial URLs.

```typescript
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

**Boundary mapping (mandatory):** layer switches happen only in mapper functions; **inbound** tool payloads become repo inputs with `RepoLayerSchema.parse(...)`, **outbound** repo documents become tools/API shapes with `ToolsLayerSchema.parse(...)`.

```typescript
// Inbound — tools-layer → repository-layer before calling the repo
function toRepoCreateInput(tool: z.infer<typeof TaskCreateToolSchema>): TaskRepoInput {
  return TaskRepoInputSchema.parse({
    title: tool.title,
    status: tool.status,
  })
}

// Outbound — repository row → tools-layer response for server fn + AI
function toToolTask(row: TaskRepo): z.infer<typeof TaskToolSchema> {
  return TaskToolSchema.parse({
    id: row.id,
    title: row.title,
    status: row.status,
  })
}
```

**TypeScript discipline (complements Zod):** Zod validates **at boundaries**; TypeScript keeps the interior honest — narrow with guards instead of casting.

```typescript
type TaskStatus = 'pending' | 'done'

const STATUS_LABEL = {
  pending: 'Pending',
  done: 'Done',
} as const satisfies Record<TaskStatus, string>

function assertNever(x: never): never {
  throw new Error(`Unexpected ${String(x)}`)
}

function labelForStatus(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return STATUS_LABEL.pending
    case 'done':
      return STATUS_LABEL.done
    default:
      return assertNever(status)
  }
}
```

**Virtual / computed fields:** If semantics cannot live in schema metadata, keep a small registry next to the derivation and expose `explainField` — do not duplicate fields already described by schemas.

## Request Context

Keep middleware payload at `ctx.context` flat — for example `{ ticket, client }`. **`ticket`** must be **repository-enriched** in middleware (identity, roles, predicates, throwing guards), not just raw JWT claims. Enforce authorization in **server handlers** for every mutation and sensitive read — components may hide buttons, but handlers are authoritative.

```typescript
const updateTask = createServerFn({ method: 'POST' }).handler(async ctx => {
  const { ticket } = ctx.context
  ticket.requireTaskEditor(ctx.data.taskId)
  const repoPatch = TaskRepoPatchSchema.parse(mapToolUpdateToRepo(ctx.data))
  return getWritableRepository().updateTask(ctx.data.taskId, repoPatch, {
    lastModifiedBy: ticket.email,
  })
})
```

## Interface Contracts

Repository interfaces reference **repository-layer types** only. **`WritableRepository`** mutations take an optional **`TraceabilityContext`** built from the auth ticket — not ad-hoc optional email parameters at each call site.

```typescript
interface TraceabilityContext {
  createdBy?: string
  lastModifiedBy?: string
}

interface ReadRepository {
  getTasks(filter?: TaskRepoFilter): Promise<TaskRepoOutput[]>
  getTask(id: string): Promise<TaskRepoOutput | null>
  getDistinctValues(field: string): Promise<string[]>
  getUserProfile(email: string): Promise<UserProfile | null>
}
interface WritableRepository {
  createTask(input: TaskRepoInput, trace?: TraceabilityContext): Promise<TaskRepoOutput>
  updateTask(
    id: string,
    input: Partial<TaskRepoInput>,
    trace?: TraceabilityContext,
  ): Promise<TaskRepoOutput | null>
  deleteTask(id: string): Promise<boolean>
}
```

## Implementation Flow

1. **Schemas:** repo + tools layers; mappers with `Schema.parse()`.
2. **Repository:** interfaces in `types.ts`; seed + production implementations.
3. **Server functions:** `serverFns.ts` — GET queries, POST mutations with shared validators.
4. **AI tools:** each server function → `toolDefinition` + `createSafeServerTool`; wire client tools in the chat shell (see AGENTS.md §8).
5. **Middleware:** `start.ts` — auth, invalidation, optional pre-auth `308` redirects for legacy paths.
6. **Routes:** `validateSearch`, `loaderDeps`, loaders; parent layouts for shared `beforeLoad`/data.
7. **Chat:** adapter, `chat()`, `buildSystemPrompt`, tool list — details in AGENTS.md §8.

## Special Patterns (use when the feature applies)

- **Overlay repository:** read-only upstream source + sparse user overrides; pure `applyOverrides`; writes only to overrides.
- **URL bulk edit:** selection and category tabs in search params; batched mutation; per-row auth.
- **Help surface:** single `docs/help.md` can back `/help`, an AI tool, and suggested prompts (see AGENTS.md).
- **Distinct values:** `getDistinctValues` → GET server fn → read-only AI tool so filters match real data.
- **Dynamic AI navigation:** derive route/help context from `router.flatRoutes` + `validateSearch` introspection where possible.

## TanStack Intent, CLI, and AI

- **Intent:** `npx @tanstack/intent@latest list | load <pkg>#<skill> | stale` — pick version-matched package skills before deep TanStack work.
- **CLI (prefer current docs over memory):** `npx @tanstack/cli --help` → `libraries`, `search-docs "<query>" --library router|start|ai`, `doc <library> <path>`.
- **AI stack:** `@tanstack/ai`, `@tanstack/ai-react`, `/api/chat` — provider table, SSE wiring, system prompt sections, and chat endpoint anatomy are spelled out in **AGENTS.md §8**.

## Use the handbook (AGENTS.md)

| Need | Where |
|------|--------|
| UI kit (default Mantine), styling | §3 |
| Auth, middleware, guards | §5 |
| AI adapters, chat client, tools, prompts, Markdown (GFM) rendering | §8 |
| Observability (Sentry, pino, `__APP_VERSION__`) | §9 |
| Vitest, Playwright, E2E fixtures | §10 |
| Full validation checklist (format, lint, test, build) | §17 |
| Public runtime `window.__ENV__` | §13 |

## Verification

**This template repo (skill authors):** after editing YAML, run `pnpm skills:build` and `pnpm skills:check`.

**Apps built from the template:** follow **AGENTS.md** §17 — e.g. `pnpm format && pnpm lint && pnpm test && pnpm build`; smoke with dev server and `/api/health` when configuration allows.
