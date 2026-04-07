---
name: tanstack-fullstack-pattern
description: 'Apply the TanStack Start fullstack architectural pattern with
  interface-first boundaries for repository, AI, and observability services.
  Project: TanStack AI-Promptable Full-Stack Template. Triggers on "fullstack
  template", "TanStack Start project", "repository pattern", "interface-first",
  "new app scaffold".'
---

> This file is generated from `skills/src/*.skill.yaml`. Do not edit manually.
# TanStack Fullstack Pattern

An interface-first fullstack architecture built on TanStack Start. The pattern defines six layers with clear boundaries - the interfaces are rigid, and implementations are swappable.

## Pattern Overview

This architecture achieves:

- Zero-config development with seed implementations
- Swappable database, AI provider, observability, and UI layer
- AI promptability by exposing read repository methods as tools
- End-to-end type safety from schema-first definitions
- Explicit schema boundaries between repository and tools layers
- URL-driven page state and loader-driven data fetching

## Rigid Rules (Must Follow)

1. Interface-first services: every external service (database, AI, observability) is accessed through an interface.
2. Schema-first types: domain types are schema-derived and inferred, never duplicated manually.
3. Separation of concerns for schemas: keep repository-layer schemas separate from tools-layer schemas.
4. Repository contracts use repository input/output schemas only.
5. Tools define their own schemas and map to and from repository schemas explicitly.
6. AI and UI interact only with tools-layer schemas; they must not depend directly on repository schemas.
7. Loaders-first data fetching: fetch route data in loaders through server functions.
8. URL-as-state: filters, tabs, selections, and modal state live in URL search params.
9. Middleware chain: auth is global middleware, invalidation runs on mutation server functions.
10. Mutation pattern: POST server functions use `invalidateMiddleware -> inputValidator -> handler` and return normalized `{ data, error }`.
11. Query pattern: GET server functions validate input and throw on failure for centralized route error handling.
12. AI tools from repository: expose read repository methods as tools wrapped with `safeToolHandler()`.
13. Keep AI chat context URL-aware: pass current location to `/api/chat` and keep route pattern metadata (for example `/tasks/$taskId`) aligned in the navigation manifest.

## Schema Boundaries

Separate schemas by layer so contracts stay stable and each layer can evolve independently.

- Repository layer: define repository input schemas for persistence operations and repository output schemas for persisted records and query results.
- Tools layer: define tool input/output schemas that represent the contract exposed to AI and UI.
- Mapping layer: translate repository schemas to tool schemas, and tool schemas back to repository schemas when needed.
- Dependency rule: repository implementations do not know about tool schemas, and AI/UI do not know about repository schemas.

Example flow:

`AI or UI -> tools schema -> mapping -> repository schema -> repository implementation`

`repository output schema -> mapping -> tools schema -> AI or UI`

## Interface Contracts

### Repository

```typescript
interface ReadRepository {
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
```

### AI Adapter

```typescript
interface AIAdapterService {
  isConfigured(): boolean
  getMissingConfigMessage(): string | null
  getAdapter(): unknown | null
}
```

### Observability

```typescript
interface ObservabilityService {
  startSpan<T>(name: string, fn: () => Promise<T>): Promise<T>
  setUser(user: { email: string; name: string }): void
  captureError(error: unknown): void
}
```

## Migration / Build Workflow

1. Define repository input/output schemas in `src/services/schemas/schemas.ts` and export inferred types from `src/types`.
2. Define tool-layer input/output schemas separately from repository schemas.
3. Add explicit mappers between tool schemas and repository schemas.
4. Define repository interfaces in `src/services/repository/types.ts` using repository-layer contracts.
5. Implement seed repository first, then production repository.
6. Add query/mutation server functions in `src/services/api/serverFns.ts`.
7. Add AI tools that validate and return tool-layer schemas, using mapping at the tools boundary.
8. Register auth and invalidation middleware in `src/start.ts`.
9. Keep `src/services/ai/navigationManifest.ts` aligned with route structure, including dynamic segments.
10. Include `browserContext` location fields (`currentPathname`, `currentSearch`, `currentHref`) in chat requests for prompt grounding.
11. Build routes using loaders and `validateSearch` for URL state, consuming only tool-layer schemas.
12. Add E2E tests in `e2e/` using Playwright against the seed repository.

## Validation Checklist

- Every external dependency is behind an interface.
- Domain types are schema-first and inferred.
- Repository schemas and tool schemas are defined separately.
- Mapping exists between repository contracts and tool contracts.
- AI and UI do not import or depend on repository schemas directly.
- No `useEffect + useState` data fetching where loaders can be used.
- Mutation server functions include invalidation middleware.
- Read repository methods are represented as AI tools.
- `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, and `pnpm build` pass.
