---
name: tanstack-fullstack-pattern
description: Apply the TanStack Start fullstack architectural pattern with interface-first boundaries for repository, AI, and observability services. Project: TanStack AI-Promptable Full-Stack Template. Triggers on "fullstack template", "TanStack Start project", "repository pattern", "interface-first", "new app scaffold".
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
- URL-driven page state and loader-driven data fetching

## Rigid Rules (Must Follow)

1. Interface-first services: every external service (database, AI, observability) is accessed through an interface.
2. Schema-first types: domain types are schema-derived and inferred, never duplicated manually.
3. Loaders-first data fetching: fetch route data in loaders through server functions.
4. URL-as-state: filters, tabs, selections, and modal state live in URL search params.
5. Middleware chain: auth is global middleware, invalidation runs on mutation server functions.
6. Mutation pattern: POST server functions use `invalidateMiddleware -> inputValidator -> handler` and return normalized `{ data, error }`.
7. Query pattern: GET server functions validate input and throw on failure for centralized route error handling.
8. AI tools from repository: expose read repository methods as tools wrapped with `safeToolHandler()`.
9. Keep AI chat context URL-aware: pass current location to `/api/chat` and keep route pattern metadata (for example `/tasks/$taskId`) aligned in the navigation manifest.

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

1. Define schemas in `src/services/schemas/schemas.ts` and export inferred types from `src/types`.
2. Define repository interfaces in `src/services/repository/types.ts`.
3. Implement seed repository first, then production repository.
4. Add query/mutation server functions in `src/services/api/serverFns.ts`.
5. Register auth and invalidation middleware in `src/start.ts`.
6. Add AI tools and keep chat system prompt aligned with data model.
7. Keep `src/services/ai/navigationManifest.ts` aligned with route structure, including dynamic segments.
8. Include `browserContext` location fields (`currentPathname`, `currentSearch`, `currentHref`) in chat requests for prompt grounding.
9. Build routes using loaders and `validateSearch` for URL state.
10. Add E2E tests in `e2e/` using Playwright against the seed repository.

## Validation Checklist

- Every external dependency is behind an interface.
- Domain types are schema-first and inferred.
- No `useEffect + useState` data fetching where loaders can be used.
- Mutation server functions include invalidation middleware.
- Read repository methods are represented as AI tools.
- `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, and `pnpm build` pass.
