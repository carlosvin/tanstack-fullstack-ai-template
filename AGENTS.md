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
- `src/middleware`: TanStack Start middleware (auth, invalidation). Registered globally in `src/start.ts`.
- `src/services/api`: Server functions (exported directly from `createServerFn`) and shared response utilities.
- `src/services/repository`: Repository interface, implementations (MongoDB, seed), and the factory.
- `src/services/schemas`: Centralized Zod schemas — the single source of truth for all domain types.
- `src/services/ai`: AI adapter interface, implementation, and tool definitions.
- `src/services/observability`: Observability interface with Sentry and no-op implementations.
- `src/services/db`: Database client singleton.
- `src/utils`: Generic helper functions (JWT, HTTP errors, auth guards).
- `src/types`: Re-exports from schemas.
- `src/constants`: Shared constant arrays and enums.
- `src/test-utils`: Vitest helpers.

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
- **Zod-First Types**: All domain types are defined as Zod schemas in `src/services/schemas/schemas.ts` and TypeScript types are inferred via `z.infer<>`. ArkType is a strong alternative (template uses Zod for wider adoption).
- **Schema Metadata**: Use `.describe()` on Zod fields. With Zod v4 you can add extra metadata (e.g. formatting, units) for UI and AI hints. Descriptions and metadata flow through to generated JSON Schemas for AI tools.
- **Type Reuse**: Import types from `src/types`. Do not redefine existing types.
- **URL-as-State**: Page state (filters, selections, active tabs, modal open/close) **must** live in URL search params, not `useState`. This makes state shareable via URL, survives refresh, and enables deep-linking. Use `validateSearch` on routes with Zod schemas to define and validate search params.
  - **Correct**: `const { filter } = Route.useSearch()` — state comes from the URL.
  - **Incorrect**: `const [filter, setFilter] = useState('all')` — state trapped in component.
- **Internal Links**: Use TanStack Router's `Link` component for internal navigation.

## 5. Middleware and Auth

### TanStack Start Middleware

Authentication is handled via global request middleware registered in `src/start.ts`:

- `authMiddleware` in `src/middleware/auth.ts` extracts the JWT from the configured header and provides `context.user` and `context.userProfile` to all handlers.
- The decoded identity and loaded profile are available as the typed `AuthContext` interface, exported from `src/middleware/auth.ts`.
- Server functions access the user via `context` — no manual header extraction needed.
- The JWT header name is configurable via `AUTH_HEADER_NAME` env var (default: `Authorization`).
- **Mutations only**: POST server functions chain `requireAuthMiddleware` from `src/middleware/requireAuth.ts`, so auth is required only for server functions that mutate; GET (query) handlers remain unauthenticated.

### Auth Context

The `AuthContext` interface is exported from `src/middleware/auth.ts`:

```tsx
interface AuthContext {
  user: UserIdentity
  userProfile: UserProfile | null
}
```

`requireAuthMiddleware` chains `authMiddleware`, so `context.user` and `context.userProfile` are typed automatically in downstream handlers — no casts needed.

### Auth Guard Helpers

Composable authorization guards are defined in `src/utils/auth.ts`:

- `requireAuth(context)`: Throws `HttpError(401)` if user is anonymous. Returns the `UserIdentity`.
- `requireGroup(context, group)`: Throws `HttpError(403)` if user is not in the specified group. Returns the `UserIdentity`.

For mutations, use `requireAuthMiddleware` so the handler runs only when the user is authenticated; the handler can then read `context.user` directly (typed via middleware chaining):

```tsx
.middleware([requireAuthMiddleware, invalidateMiddleware])
.handler(async ({ data, context }) => {
  // context.user is typed — no cast needed
  return getWritableRepository().doSomething(data, context.user.email)
})
```

For one-off auth in other handlers, use `requireAuth(context)` or `requireGroup(context, group)`; they throw 401/403.

### Adding Custom Authorization

Create composable middleware that chains `authMiddleware` for context typing (see `src/middleware/requireAuth.ts` for the pattern). Chain it with `invalidateMiddleware` on POST server functions.

## 6. Server Functions and Data Access

This is a full-stack TanStack Start application. There is no separate backend API.

```
Route Loader → Server Function (serverFns.ts) → Repository → Database / Seed Data
```

- **Server Functions**: Defined with `createServerFn` from `@tanstack/react-start` in `src/services/api/serverFns.ts` and exported directly (no wrapper functions). All core logic (repository calls, authorization, observability spans) lives inside the `.handler()` callback.
- **Input Validation**: Server functions pass Zod schemas to `.inputValidator(Schema)`.
- **Repository Pattern**: All data access goes through the repository interface.
- **Calling convention**: Callers pass `{ data: inputData }` to server functions (e.g. `getTasks({ data: filter })`).

### 6.1. Data Fetching (Queries)

- **Loaders-first**: Always fetch data in route `loader` functions via server functions. Never use `useEffect` + `useState` for data that can be loaded in a loader. Loaders provide automatic caching, parallel fetching, SSR support, and `pendingComponent` / stale-while-revalidate.
- **No useEffect for data**: The only valid use of `useEffect` for data fetching is when reacting to a non-URL event (e.g., WebSocket message).
- **Nested route data**: If a parent route has already loaded data, child routes should access it using `useLoaderData({ from: '...' })` instead of re-fetching.
- Use `createServerFn({ method: 'GET' })` for queries.
- Loaders should throw on failure for centralized error handling.

### 6.2. Data Writing (Mutations)

- Use `createServerFn({ method: 'POST' })` for mutations.
- **Invalidation middleware**: All POST server functions must chain `.middleware([requireAuthMiddleware, invalidateMiddleware])`. The middleware runs on the client after the mutation completes and calls `router.invalidate()`, which triggers loaders to re-fetch. Components do **not** call `router.invalidate()` manually.
- Mutation server functions throw on error. Callers in route components wrap calls with `processResponse()` to get `{ data, error }`.
- Call mutations from event handlers. Provide toast feedback after mutations.

```tsx
export const myMutation = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware, invalidateMiddleware])
  .inputValidator(MyInputSchema)
  .handler(async ({ data, context }) => {
    // context.user is typed via requireAuthMiddleware
    return getWritableRepository().doSomething(data, context.user.email)
  })

// In a route component:
const result = await processResponse(() => myMutation({ data: input }))
```

## 7. Routing (TanStack Router)

- **File-Based Routing**: Routes are defined as files in `src/routes/`. The route tree is auto-generated.
- **Nested Routes**: Use nested routes for modals and lazy-loaded UI.
- **Loaders over useEffect**: Data fetching belongs in `loader`, not in component effects. See section 6.1.
- **Preserve Search Params**: `navigate({ to: '/path', search: prev => ({ ...prev, newParam: 'value' }) })`.

## 8. AI Chat and Tools

### AI Adapter Interface

The AI provider is behind the `AIAdapterService` interface defined in `src/services/ai/types.ts`:

```tsx
interface AIAdapterService {
  isConfigured(): boolean
  getMissingConfigMessage(): string | null
  getAdapter(): unknown | null
}
```

The default implementation in `src/services/ai/adapter.ts` uses `@tanstack/ai-openai` (OpenAI/Azure-compatible). To swap providers (Anthropic, Gemini, Ollama), create a new class implementing `AIAdapterService` and update the factory.

### Server Tools

- `src/services/ai/tools.ts` defines server tools using `toolDefinition` from `@tanstack/ai`. Server tools call the same exported server functions that route loaders and event handlers use.
- Tool handlers use `withErrorHandling()` to catch errors and return `{ error: string, code?: number }` so the AI can interpret 401/403/404 (e.g. "You need to log in", "Only the task creator can do that").
- Tool args are typed via `Schema.parse(args)` since `@tanstack/ai`'s `.server()` types the handler arg as `unknown`.
- When adding new repository read methods, expose them as AI tools.
- **getCurrentUserContext** returns who is logged in and a permissions summary. **createTask**, **updateTask**, **deleteTask** call the same server functions as the UI; auth and creator checks run inside the server function handlers.

### Client Tools

Client tools execute in the browser and are defined in `src/services/ai/tools.ts` (definition-only, no `.server()` call) with implementations in [ChatDrawer](src/components/ChatDrawer/ChatDrawer.tsx) using `@tanstack/ai-client`:

- **navigate**: Triggers `router.navigate()` in the browser. Accepts `to` (path) and optional `search` (query params). Validates paths via `isUserFacingPath()`.
- **invalidateRouter**: Calls `router.invalidate()` to refresh page data. The AI calls this after mutation tools so the user sees updated data.

When adding client tools: export the `toolDefinition(...)` from `tools.ts`, pass it to `chat()` in the chat endpoint, and add a `.client()` implementation in `ChatDrawer.tsx` via `clientTools()`.

### App navigation and links

- **Navigation structure**: The app navigation structure for the AI is derived from [src/routeTree.gen.ts](src/routeTree.gen.ts) and exposed via [src/services/ai/navigationManifest.ts](src/services/ai/navigationManifest.ts). When you add or change routes or search params, update the manifest so the AI system prompt stays in sync.
- The AI is instructed to use **markdown links** in replies (e.g. `[View task](/tasks/123)`, `[Tasks](/tasks)`) and to use **query params** in links where applicable (e.g. `/tasks?status=done`).
- The AI can trigger client-side navigation by calling the **navigate** client tool with `to` and optional `search`; the browser executes it automatically via `@tanstack/ai-client`.
- The chat UI ([ChatDrawer](src/components/ChatDrawer/ChatDrawer.tsx)) renders internal links in assistant messages as TanStack Router `Link` components so clicks do client-side navigation; external links open in a new tab.

### Chat Endpoint

- `POST /api/chat` in `src/routes/api/chat.ts` with SSE streaming.
- Uses the auth middleware context (no manual JWT extraction).
- Keep the system prompt updated when the data model changes.

## 9. Observability

- **Interface**: `src/services/observability/types.ts` defines the `ObservabilityService` interface.
- **Implementations**: Sentry (`sentry.ts`) and no-op (`noop.ts`). Factory in `index.ts`.
- **Server Init**: `instrument.server.mjs` conditionally initializes the server-side SDK.
- **Client Init**: `src/router.tsx` conditionally initializes client-side tracing.
- **Usage**: Wrap server function internals with `getObservability().startSpan('name', fn)`.
- **To swap providers**: Implement `ObservabilityService`, update the factory, and replace `instrument.server.mjs`.

## 10. Testing

- **Framework**: Vitest with jsdom environment.
- **Libraries**: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/dom`.
- **Setup**: Global setup in `src/test-utils/setupTests.ts` (includes `matchMedia`, `ResizeObserver`, `MutationObserver` mocks).
- **Rendering**: `renderWithProviders()` in `src/test-utils/renderWithRouter.tsx` wraps with MantineProvider.
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
