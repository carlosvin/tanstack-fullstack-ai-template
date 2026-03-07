---
name: tanstack-fullstack-pattern
description: Apply the TanStack Start fullstack architectural pattern with interface-first design for database, AI, UI, and observability layers. Use when creating new fullstack apps, migrating existing projects to TanStack Start, or setting up clean service boundaries with swappable implementations. Triggers on "fullstack template", "TanStack Start project", "repository pattern", "interface-first", "new app scaffold".
---

# TanStack Fullstack Pattern

An interface-first fullstack architecture built on TanStack Start. The pattern defines **six layers** with clear boundaries — the interfaces are rigid, the implementations are your choice.

## Pattern Overview

This architecture achieves:

- **Zero-config development**: Seed implementations let you run without any external services
- **Swappable everything**: Database, AI, observability, UI library, and schema validation are all behind interfaces
- **AI-promptable by default**: Every read method is exposed as an AI tool
- **Type safety end-to-end**: Schemas are the single source of truth — types are inferred, never duplicated
- **URL-driven state**: Page state lives in search params, data comes from loaders

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. CLIENT LAYER                                                    │
│     UI Components + TanStack Router + Chat Drawer                   │
│     (swappable: Mantine, shadcn, Chakra, Ant Design, Radix)        │
├─────────────────────────────────────────────────────────────────────┤
│  2. MIDDLEWARE LAYER                                                │
│     Auth Middleware (JWT → AuthContext)                              │
│     Invalidation Middleware (POST → router.invalidate())            │
├─────────────────────────────────────────────────────────────────────┤
│  3. SERVER FUNCTION LAYER                                           │
│     Queries (GET) — called by route loaders                         │
│     Mutations (POST) — called by event handlers                     │
│     Chat API (SSE) — /api/chat endpoint                             │
├══════════════════════════ INTERFACE BOUNDARY ════════════════════════┤
│  4. INTERFACE LAYER                                                 │
│     ReadRepository / WritableRepository                             │
│     AIAdapterService                                                │
│     ObservabilityService                                            │
├─────────────────────────────────────────────────────────────────────┤
│  5. IMPLEMENTATION LAYER                                            │
│     (swappable: MongoDB/Postgres/DynamoDB, OpenAI/Anthropic/Gemini, │
│      Sentry/Datadog/OpenTelemetry/no-op)                            │
├─────────────────────────────────────────────────────────────────────┤
│  6. SCHEMA LAYER (cross-cutting)                                    │
│     Single source of truth for types + validation + AI metadata     │
│     (swappable: Zod, ArkType, Valibot, Effect Schema)              │
└─────────────────────────────────────────────────────────────────────┘
```

## Rigid Rules (Must Follow)

These are non-negotiable parts of the pattern:

1. **Interface-first services**: Every external service (database, AI, observability) is accessed through a TypeScript interface, never a concrete implementation
2. **Schema-first types**: Domain types are defined as schemas with field metadata (`.describe()` or equivalent) and TypeScript types are inferred — never define standalone interfaces for domain types
3. **Loaders-first data fetching**: Data is fetched in route `loader` functions via server functions. Never use `useEffect` + `useState` for data that a loader can provide
4. **URL-as-state**: Page state (filters, selections, tabs, modal open/close) lives in URL search params. Use `validateSearch` with schemas to define and validate them
5. **Middleware chain**: Auth runs as global request middleware. Invalidation runs as function middleware on mutations
6. **Mutation pattern**: POST server functions chain `invalidateMiddleware` → `inputValidator` → handler. They return `{ data, error }` via `processResponse()`, never throw
7. **Query pattern**: GET server functions use `inputValidator` → handler. They throw on failure for centralized error handling via router error components
8. **AI tools from repository**: All read repository methods are exposed as AI tools with `safeToolHandler()` wrapping

## Interface Contracts

### ReadRepository / WritableRepository

```typescript
interface ReadRepository {
  // All read methods — also exposed as AI tools
  getItems(filter?: ItemFilter): Promise<Item[]>
  getItem(id: string): Promise<Item | null>
  getDistinctValues(field: string): Promise<string[]>
  getUserProfile(email: string): Promise<UserProfile | null>
}

interface WritableRepository {
  createItem(input: ItemInput, createdBy?: string): Promise<Item>
  updateItem(id: string, input: Partial<ItemInput>): Promise<Item | null>
  deleteItem(id: string): Promise<boolean>
}

type Repository = ReadRepository & WritableRepository
```

**Factory**: `getReadRepository()` / `getWritableRepository()` — singleton, auto-detects implementation from `REPOSITORY_TYPE` or `MONGODB_URI` env vars.

**Swap point**: Create a new class implementing `Repository`, add it to the factory switch.

### AIAdapterService

```typescript
interface AIAdapterService {
  isConfigured(): boolean
  getMissingConfigMessage(): string | null
  getAdapter(): unknown | null  // Returns provider-specific adapter for TanStack AI chat()
}
```

**Factory**: `getAIAdapterService()` — singleton.

**Swap point**: Create a new class (e.g., `AnthropicAdapterService`), update the factory.

### ObservabilityService

```typescript
interface ObservabilityService {
  startSpan<T>(name: string, fn: () => Promise<T>): Promise<T>
  setUser(user: { email: string; name: string }): void
  captureError(error: unknown): void
}
```

**Factory**: `getObservability()` — returns Sentry impl if DSN is set, otherwise no-op.

**Swap point**: Create a new class (e.g., `DatadogObservability`), update the factory.

### AuthContext

```typescript
interface AuthContext {
  user: UserIdentity
  userProfile: UserProfile | null
}
```

Populated by `authMiddleware`, available in all server functions and route handlers via `context`.

## Implementation Choices

| Layer | Recommended | Requirement | Alternatives |
|-------|-------------|-------------|-------------|
| **Schema validation** | Zod | Define schemas with field metadata, infer TS types, produce JSON Schema. Must support Standard Schema spec for TanStack `.inputValidator()` | ArkType, Valibot, Effect Schema |
| **Database** | MongoDB | Implement `ReadRepository` / `WritableRepository` | Postgres, DynamoDB, Supabase, Drizzle, Prisma, in-memory |
| **AI provider** | OpenAI (Azure) | Implement `AIAdapterService`, return a TanStack AI-compatible adapter | Anthropic, Gemini, Ollama, Groq, any OpenAI-compatible |
| **Observability** | Sentry | Implement `ObservabilityService` | Datadog, OpenTelemetry, New Relic, no-op |
| **UI library** | Mantine | Component layer only — no interface needed | shadcn/ui, Chakra, Ant Design, Radix, Tailwind |

## New Project Workflow

1. **Clone the template**
   ```bash
   git clone https://github.com/your-org/tanstack-fullstack-template.git my-app
   cd my-app && pnpm install
   ```

2. **Verify it runs**: `pnpm dev` — should work with seed data, no config needed

3. **Define your domain schemas** in `src/services/schemas/schemas.ts`:
   - Add Zod schemas with `.describe()` on every field
   - Export inferred types via `z.infer<>`
   - Re-export from `src/types/index.ts`

4. **Define repository interface** in `src/services/repository/types.ts`:
   - Add `ReadRepository` methods for your entities
   - Add `WritableRepository` methods for mutations

5. **Implement seed repository** in `seedRepository.ts`:
   - Hardcode sample data for development
   - Implement all interface methods against in-memory arrays

6. **Add server functions** in `src/services/api/serverFns.ts`:
   - GET functions for queries (used by route loaders)
   - POST functions with `.middleware([invalidateMiddleware])` for mutations
   - Use `requireAuth()` in mutation handlers

7. **Expose AI tools** in `src/services/ai/tools.ts`:
   - One tool per read repository method, wrapped with `safeToolHandler()`
   - Update the system prompt in `src/routes/api/chat.ts`

8. **Create routes** under `src/routes/`:
   - Use `loader` for data fetching
   - Use `validateSearch` with Zod for URL search params
   - Use `useLoaderData({ from: '...' })` in child routes

9. **Implement MongoDB repository** (when ready for real data):
   - Copy `mongoRepository.ts` and adapt to your entities
   - Set `MONGODB_URI` in `.env`

10. **Configure services** (optional):
    - AI: Set `AZURE_OPENAI_*` env vars
    - Observability: Set `VITE_SENTRY_DSN`

## Existing Project Workflow

Adopt the pattern incrementally. Each step is independently valuable.

### Step 1: Schema Layer (foundation)

Move domain types to a centralized schema file using Zod (or your chosen schema library):

```
src/services/schemas/schemas.ts    # schemas + inferred types
src/types/index.ts                 # re-exports
src/constants/options.ts           # enum arrays
```

Rule: every field gets `.describe()`. Types are inferred, never hand-written.

### Step 2: Repository Interface

Extract data access behind interfaces:

```
src/services/repository/types.ts           # ReadRepository + WritableRepository
src/services/repository/mongoRepository.ts # (or your DB)
src/services/repository/seedRepository.ts  # in-memory for dev
src/services/repository/getRepository.ts   # factory (singleton)
```

Rule: application code calls `getReadRepository()` / `getWritableRepository()`, never imports a concrete class.

### Step 3: Server Functions

Wrap repository calls in TanStack Start server functions:

```
src/services/api/serverFns.ts       # GET queries + POST mutations
src/services/api/processResponse.ts # error normalization for mutations
```

Rules:
- GET functions throw on error (loaders catch them)
- POST functions chain `invalidateMiddleware` and return `{ data, error }`
- Input validation via `.inputValidator(ZodSchema)`

### Step 4: Auth Middleware

Add global auth middleware:

```
src/middleware/auth.ts        # JWT extraction → AuthContext
src/middleware/invalidate.ts  # POST → router.invalidate() on client
src/utils/auth.ts             # requireAuth(), requireGroup()
src/start.ts                  # register middleware
```

### Step 5: Observability Interface

Add observability behind an interface:

```
src/services/observability/types.ts  # ObservabilityService interface
src/services/observability/noop.ts   # no-op (always works)
src/services/observability/sentry.ts # (or your provider)
src/services/observability/index.ts  # factory
instrument.server.mjs               # server-side init
```

### Step 6: AI Tools

Expose read repository methods as AI tools:

```
src/services/ai/types.ts    # AIAdapterService interface
src/services/ai/adapter.ts  # implementation + factory
src/services/ai/tools.ts    # tool definitions with safeToolHandler()
src/routes/api/chat.ts      # SSE chat endpoint
src/components/ChatDrawer/   # UI component
```

### Step 7: Route Migration

Migrate pages to TanStack Router with loaders:
- Move data fetching from `useEffect` + `useState` into `loader` functions
- Move page state from `useState` into URL search params with `validateSearch`
- Use `useLoaderData({ from: '...' })` for parent data in child routes

## File Structure Reference

```
src/
├── start.ts                         # Global middleware registration
├── router.tsx                       # Router factory + client observability
├── middleware/
│   ├── auth.ts                      # JWT → AuthContext (interface exported)
│   └── invalidate.ts                # POST → router.invalidate()
├── routes/                          # File-based routes (pages + API)
│   ├── __root.tsx                   # Root layout + theme + loader
│   ├── api/chat.ts                  # AI chat SSE endpoint
│   └── api/health.ts                # Health check
├── components/                      # UI components (one folder each)
├── services/
│   ├── schemas/schemas.ts           # Zod schemas (source of truth)
│   ├── repository/
│   │   ├── types.ts                 # ReadRepository + WritableRepository
│   │   ├── getRepository.ts         # Factory (singleton)
│   │   ├── mongoRepository.ts       # MongoDB implementation
│   │   └── seedRepository.ts        # In-memory implementation
│   ├── api/
│   │   ├── serverFns.ts             # Server function wrappers
│   │   └── processResponse.ts       # Mutation error normalization
│   ├── ai/
│   │   ├── types.ts                 # AIAdapterService interface
│   │   ├── adapter.ts               # Implementation + factory
│   │   └── tools.ts                 # AI tool definitions
│   ├── observability/
│   │   ├── types.ts                 # ObservabilityService interface
│   │   ├── sentry.ts                # Sentry implementation
│   │   ├── noop.ts                  # No-op implementation
│   │   └── index.ts                 # Factory
│   └── db/mongoClient.ts            # Database client singleton
├── utils/
│   ├── auth.ts                      # requireAuth(), requireGroup()
│   ├── httpError.ts                 # HttpError class
│   └── jwt.ts                       # JWT decode (jose)
├── types/index.ts                   # Re-exports from schemas
├── constants/options.ts             # Enum arrays
└── test-utils/
    ├── setupTests.ts                # Vitest global setup + mocks
    └── renderWithRouter.tsx         # Component test helper
```

## Validation Checklist

After applying the pattern (new or existing project), verify:

- [ ] Every external service is accessed through an interface (repository, AI, observability)
- [ ] Domain types are defined as schemas with `.describe()` metadata and types inferred via schema library
- [ ] No `useEffect` + `useState` for data that could be in a loader
- [ ] Page state (filters, tabs, selections) is in URL search params, not component state
- [ ] POST server functions chain `invalidateMiddleware` before `inputValidator`
- [ ] Mutations return `{ data, error }` via `processResponse()`, never throw
- [ ] All read repository methods are exposed as AI tools with `safeToolHandler()`
- [ ] The system prompt in `/api/chat` reflects the current data model
- [ ] `pnpm dev` works with zero configuration (seed repository)
- [ ] `pnpm lint && pnpm test && pnpm build` pass
