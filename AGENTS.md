# Agent Instructions

This document provides instructions for AI agents working on projects built from this template.

## 1. General Principles

- **SOLID, DRY, YAGNI, KISS**: Adhere to these fundamental software design principles.
- **Readability & Clarity**: Code must be easy to read and understand.
- **Modularity & Reusability**: Write code that can be reused.
- **Pragmatic Programming**: Be practical and realistic in your approach.
- **Clean Code**: Follow clean code best practices.
- **Interface-First**: All external services (database, AI, observability) are accessed through interfaces, not concrete implementations.

## 2. File and Project Structure

- `src/components`: React components. Each component in its own folder with `Component.tsx` and optional `Component.module.css` and `Component.test.tsx`.
- `src/routes`: TanStack Router file-based routes. This is where pages are created. The route tree is auto-generated in `routeTree.gen.ts`.
- `src/middleware`: TanStack Start middleware (auth, observability). Registered globally in `src/start.ts`.
- `src/services/api`: Server function wrappers and shared response utilities.
- `src/services/repository`: Repository interface, MongoDB and seed implementations, and the factory.
- `src/services/schemas`: Centralized Zod schemas — the single source of truth for all domain types.
- `src/services/ai`: AI chat adapter and tool definitions.
- `src/services/observability`: Observability interface with Sentry and no-op implementations.
- `src/services/db`: Database client singleton.
- `src/utils`: Generic helper functions (JWT, HTTP errors).
- `src/types`: Re-exports from schemas.
- `src/constants`: Shared constant arrays and enums.
- `src/test-utils`: Test helpers.

### File Naming

- Use `PascalCase` for component files (e.g., `MyComponent.tsx`).
- Use `camelCase` for utility, service, and route files.
- Test files are co-located with source as `*.test.ts` or `*.test.tsx`.

### Code Organization

- Place React components in their own files.
- Group related utility functions in a single file.
- Functions and methods should have a single responsibility.
- Avoid mixing unrelated code in the same file.

## 3. Styling and UI Components

### Mantine UI Framework

This project uses [Mantine](https://mantine.dev/) as the primary UI framework.

- **Use Mantine components first**: Before creating custom components, check if Mantine provides one.
- **Styling props**: Use Mantine's built-in props (`c`, `fw`, `size`, `variant`, etc.) instead of CSS.
- **CSS Modules**: When custom CSS beyond Mantine is needed, use CSS Modules (`Component.module.css`).
- **Responsive props**: Use object syntax for responsive values: `<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>`.
- **Theming**: Customize the theme in `__root.tsx`. Use Mantine CSS variables (`--mantine-color-*`) in CSS Modules.
- **Avoid inline styles**: Use Mantine props or CSS Modules instead.
- **Avoid `!important`**: Minimize its use.
- **Dark mode**: All components must work in both light and dark color schemes.

## 4. TypeScript and React

- **Functional Components**: Prefer functional components and hooks over class components.
- **Type Safety**: Use TypeScript features like interfaces, types, and generics effectively.
- **Zod-First Types**: All domain types are defined as Zod schemas in `src/services/schemas/schemas.ts` and TypeScript types are inferred via `z.infer<>`.
- **Schema Metadata**: Use `.describe()` on Zod fields. Descriptions flow through to generated JSON Schemas for AI tools.
- **Type Reuse**: Import types from `src/types`. Do not redefine existing types.
- **State Management**: Minimize hooks and contexts. Use URL search parameters for page state.
- **Internal Links**: Use TanStack Router's `Link` component for internal navigation.

## 5. Middleware and Auth

### TanStack Start Middleware

Authentication is handled via global request middleware registered in `src/start.ts`:

- `authMiddleware` in `src/middleware/auth.ts` extracts the JWT from the configured header and provides `context.user` to all handlers.
- Server functions access the user via `context.user` — no manual header extraction needed.
- The JWT header name is configurable via `AUTH_HEADER_NAME` env var (default: `Authorization`).

### Adding Authorization

Create composable middleware that builds on `authMiddleware`:

```tsx
const requireAuthMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(({ next, context }) => {
    if (!context.user.email) throw new HttpError(401, 'Auth required')
    return next()
  })
```

## 6. Server Functions and Data Access

This is a full-stack TanStack Start application. There is no separate backend API.

```
Route Loader → Server Function (serverFns.ts) → Repository → Database / Seed Data
```

- **Server Functions**: Defined with `createServerFn` from `@tanstack/react-start` in `src/services/api/`.
- **Input Validation**: Server functions pass Zod schemas to `.inputValidator(Schema)`.
- **Repository Pattern**: All data access goes through the repository interface.

### Data Fetching (Queries)

- Use TanStack Router loaders for data fetching.
- Use `createServerFn({ method: 'GET' })` for queries.
- Loaders should throw on failure for centralized error handling.

### Data Writing (Mutations)

- Use `createServerFn({ method: 'POST' })` for mutations.
- Mutations should NOT throw. Use `processResponse()` to return `{ data, error }`.
- Call mutations from event handlers. Provide toast feedback after mutations.

## 7. Routing (TanStack Router)

- **File-Based Routing**: Routes are defined as files in `src/routes/`. The route tree is auto-generated.
- **Nested Routes**: Use nested routes for modals and lazy-loaded UI.
- **Preserve Search Params**: `navigate({ to: '/path', search: prev => ({ ...prev, newParam: 'value' }) })`.

## 8. AI Chat and Tools

- **Adapter**: `src/services/ai/adapter.ts` wraps the AI provider (OpenAI by default). Swap the adapter to change providers.
- **Tools**: `src/services/ai/tools.ts` defines read-only tools from repository methods using `toolDefinition` from `@tanstack/ai`.
- **Endpoint**: `POST /api/chat` in `src/routes/api/chat.ts` with SSE streaming.
- **System Prompt**: Keep the system prompt in the chat endpoint updated when the data model changes.
- When adding new repository read methods, expose them as AI tools.

## 9. Observability

- **Interface**: `src/services/observability/types.ts` defines the `ObservabilityService` interface.
- **Implementations**: Sentry (`sentry.ts`) and no-op (`noop.ts`). Factory in `index.ts`.
- **Server Init**: `instrument.server.mjs` conditionally initializes the server-side SDK.
- **Client Init**: `src/router.tsx` conditionally initializes client-side tracing.
- **Usage**: Wrap server function internals with `getObservability().startSpan('name', fn)`.
- **To swap providers**: Replace the Sentry implementation and update `instrument.server.mjs`.

## 10. Testing

- **Framework**: Vitest with jsdom environment.
- **Libraries**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/dom`.
- **Setup**: Global setup in `src/test-utils/setupTests.ts`.
- **Convention**: Test files co-located as `*.test.ts` or `*.test.tsx`.

## 11. Validate Changes

Always verify changes with:

```bash
pnpm format    # Auto-fix formatting
pnpm lint      # Check for lint errors and type errors
pnpm test      # Run all tests
pnpm build     # Verify production build
```

Linting uses Biome, not ESLint.
