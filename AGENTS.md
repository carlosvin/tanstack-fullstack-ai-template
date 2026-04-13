# Agent Instructions

This document is the default agent and contributor guide for projects built from this template. It covers project structure, conventions, tooling, and operational detail.

The **deep architectural contract** -- rigid rules, three schema layers, cross-layer mapping, interface contracts, migration workflow, and the TanStack CLI docs tip -- lives in the [TanStack Fullstack Pattern skill](.agents/skills/tanstack-fullstack-pattern/SKILL.md) (generated from `skills/src/*.skill.yaml`; regenerate with `pnpm skills:build`).

## 1. General Principles

- **SOLID, DRY, YAGNI, KISS**: Adhere to these fundamental software design principles.
- **Readability & Clarity**: Code must be easy to read and understand.
- **Modularity & Reusability**: Write code that can be reused.
- **Pragmatic Programming**: Be practical and realistic in your approach.
- **Clean Code**: Follow clean code best practices.
- **Interface-First**: All external services (database, AI, observability) are accessed through interfaces, not concrete implementations.

## 2. File and Project Structure

- `src/components`: React components. Each component in its own folder with `Component.tsx` and optional `Component.module.css` and `Component.test.tsx`. Page-level components (e.g. `DashboardPage`, `TasksPage`) also live here so they can be tested independently.
- `src/routes`: TanStack Router file-based routes. Route files should be **thin** — only route config (`createFileRoute`, `validateSearch`, `loaderDeps`, `loader`) and a component reference that delegates to an extracted page component from `src/components/`. The route tree is auto-generated in `routeTree.gen.ts`.
- `src/middleware`: TanStack Start middleware (auth, invalidation). Registered globally in `src/start.ts`.
- `src/services/api`: Server functions (exported directly from `createServerFn`) and shared response utilities.
- `src/services/repository`: Repository interface, implementations (MongoDB, seed), and the factory.
- `src/services/schemas`: Centralized Zod schemas — tools-layer schemas in `schemas.ts`, repository-layer schemas in `repository.ts`. See the [skill](.agents/skills/tanstack-fullstack-pattern/SKILL.md) for the full three-layer model.
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

### Thin Routes, Extracted Page Components

Route files should contain only route configuration. Page UI lives in `src/components/PageName/PageName.tsx`:

```tsx
// src/routes/index.tsx — thin route
import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '../components/DashboardPage/DashboardPage'
import { getTasks } from '../services/api/serverFns'

export const Route = createFileRoute('/')({
  loader: () => getTasks({}),
  component: () => {
    const tasks = Route.useLoaderData()
    return <DashboardPage tasks={tasks} />
  },
})
```

The page component receives data as props and is framework-agnostic — it can be rendered in Vitest with `renderWithProviders()` without a running router. Shared display helpers (e.g. color mappers) belong in `src/utils/`.

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

### Icons

This project uses [`lucide-react`](https://lucide.dev/) as the default icon library. Lucide icons are tree-shakeable and visually consistent across the template. Import individual icons by name:

```tsx
import { CheckCircle, Trash2 } from 'lucide-react'
```

If your team prefers [`@tabler/icons-react`](https://tabler.io/icons) (the Mantine-adjacent set), it is a compatible alternative — but keep one library per project to avoid visual inconsistency.

## 4. TypeScript and React

- **Functional Components**: Prefer functional components and hooks over class components.
- **Type Safety**: Use TypeScript features like interfaces, types, and generics effectively.
- **Zod-First Types**: All domain types are defined as Zod schemas and TypeScript types are inferred via `z.infer<>`. Tools-layer schemas live in `src/services/schemas/schemas.ts` (with `.describe()` on every field for AI JSON Schema); repository-layer schemas live in `repository.ts`. See the [skill](.agents/skills/tanstack-fullstack-pattern/SKILL.md) for the three schema layers, `loaderDeps`, and cross-layer `Schema.parse()` mapping.
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

This is a full-stack TanStack Start application. There is no separate backend API. The [skill](.agents/skills/tanstack-fullstack-pattern/SKILL.md) defines the rigid layering rules and the "every repo method gets a tool" policy.

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
- Mutation server functions throw `HttpError` on auth/not-found failures. UI callers wrap with `processResponse()` to get `{ data, error }`. AI tools use `safeToolHandler()` for the same normalization.
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

Server and client tool coverage expectations, the AI chat pipeline, and client-tool wiring samples are in the [skill](.agents/skills/tanstack-fullstack-pattern/SKILL.md). This section covers adapter details, file paths, and the navigation manifest.

### AI Adapter Interface

The AI provider is behind the `AIAdapterService` interface defined in `src/services/ai/types.ts`:

```tsx
interface AIAdapterService {
  isConfigured(): boolean
  getMissingConfigMessage(): string | null
  getAdapter(): unknown | null
}
```

**When scaffolding a new project or when the LLM preference is not clear, ask the user which provider they want.** TanStack AI has adapter packages for multiple providers:

| Provider | Adapter package | Required env var(s) | Notes |
|----------|----------------|---------------------|-------|
| OpenRouter (recommended) | `@tanstack/ai-openrouter` | `OPENROUTER_API_KEY` | 300+ models with a single API key |
| OpenAI (default) | `@tanstack/ai-openai` | `OPENAI_API_KEY` | GPT series; `openaiText('gpt-5.2')` or `createOpenaiChat(key, config)` |
| Anthropic | `@tanstack/ai-anthropic` | `ANTHROPIC_API_KEY` | Claude series; `anthropicText('claude-sonnet-4-5')` |
| Google Gemini | `@tanstack/ai-gemini` | `GEMINI_API_KEY` | Gemini series |
| Ollama (local) | `@tanstack/ai-ollama` | `OLLAMA_BASE_URL` | Local models, no API key needed |
| Groq | `@tanstack/ai-groq` | `GROQ_API_KEY` | Fast inference |
| xAI Grok | `@tanstack/ai-grok` | `GROK_API_KEY` | Grok series |

Install only the chosen adapter package (e.g. `pnpm add @tanstack/ai-openai`), implement the corresponding `AIAdapterService` class in `src/services/ai/adapter.ts`, and configure the matching env vars. Do not assume OpenAI without asking.

Each adapter package exposes a convenience function (`openaiText`, `anthropicText`, etc.) that reads the API key from the environment automatically, and a `create*` factory (`createOpenaiChat`, `createAnthropicChat`, etc.) for explicit key configuration. Use the convenience function for simplicity; use the factory when you need custom base URLs or multi-tenant setups.

The default implementation uses `@tanstack/ai-openai` with plain OpenAI. Set `OPENAI_API_KEY` to enable AI chat. Optionally set `OPENAI_MODEL` (default: `gpt-4o`) and `OPENAI_BASE_URL` for Azure OpenAI, proxies, or compatible APIs.

### Server Tools

- `src/services/ai/tools.ts` defines server tools using `toolDefinition` from `@tanstack/ai`. Server tools call the same exported server functions that route loaders and event handlers use.
- Tool handlers use the shared `createSafeServerTool()` / `safeToolHandler()` pattern to catch errors and return `{ error: string, code?: number }` so the AI can interpret 401/403/404 (e.g. "You need to log in", "Only the task creator can do that").
- Tool args are typed via `Schema.parse(args)` since `@tanstack/ai`'s `.server()` types the handler arg as `unknown`.
- When adding new repository methods (reads and writes), expose them as AI tools.
- **getCurrentUserContext** returns who is logged in and a permissions summary. **createTask**, **updateTask**, **deleteTask** call the same server functions as the UI; auth and creator checks run inside the server function handlers.

### Client Tools

Client tools execute in the browser and are defined in `src/services/ai/tools.ts` (definition-only, no `.server()` call) with implementations in [ChatDrawer](src/components/ChatDrawer/ChatDrawer.tsx) using `clientTools()` from `@tanstack/ai-client`:

- **navigate**: Triggers `router.navigate()` in the browser. Accepts `to` (path) and optional `search` (query params). Validates paths via `isUserFacingPath()`.
- **invalidateRouter**: Calls `router.invalidate()` to refresh page data. The AI calls this after mutation tools so the user sees updated data.

When adding client tools: export the `toolDefinition(...)` from `tools.ts`, pass it to `chat()` in the chat endpoint, and add a `.client()` implementation in `ChatDrawer.tsx` via `clientTools()`.

### Chat Client Setup

The chat UI uses `useChat` from `@tanstack/ai-react` and `fetchServerSentEvents` from `@tanstack/ai-client` to connect to the `/api/chat` SSE endpoint. Client tools are wired with `clientTools()` and passed to `useChat` — they execute automatically when the AI calls them (no `onToolCall` callback needed):

```tsx
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import { clientTools, createChatClientOptions } from '@tanstack/ai-client'

const navigateClient = navigateToolDef.client((args) => {
  router.navigate({ to: args.to, search: args.search ?? undefined })
  return { success: true }
})
const tools = clientTools(navigateClient, invalidateClient)

const { messages, sendMessage, isLoading } = useChat(
  createChatClientOptions({
    connection: fetchServerSentEvents('/api/chat'),
    tools,
    body: { browserContext },
  }),
)
```

`createChatClientOptions()` enables full type inference for messages via `InferChatMessages<typeof options>`. The `body` field passes additional data (like `browserContext`) alongside messages to the server endpoint.

### App navigation and links

- **Navigation structure**: The app navigation structure for the AI is derived from [src/routeTree.gen.ts](src/routeTree.gen.ts) and exposed via [src/services/ai/navigationManifest.ts](src/services/ai/navigationManifest.ts). When you add or change routes or search params, update the manifest so the AI system prompt stays in sync.
- The AI is instructed to use **markdown links** in replies (e.g. `[View task](/tasks/123)`, `[Tasks](/tasks)`) and to use **query params** in links where applicable (e.g. `/tasks?status=done`).
- The AI can trigger client-side navigation by calling the **navigate** client tool with `to` and optional `search`; the browser executes it automatically via `@tanstack/ai-client`.
- The chat UI ([ChatDrawer](src/components/ChatDrawer/ChatDrawer.tsx)) renders internal links in assistant messages as TanStack Router `Link` components so clicks do client-side navigation; external links open in a new tab.

### AI System Prompt Context

`buildSystemPrompt()` in `src/routes/api/chat.ts` assembles three context blocks so the AI knows **who** is asking, **where** they are in the world, and **what page** they are on. The client sends browser-only data (`browserContext` via `ChatDrawer`); the server adds server-only data (user identity from auth middleware). Both are merged into the system prompt.

1. **`ChatDrawer`** (client) captures the browser environment (timezone, locale, current time) and current location (pathname, search, href) into `browserContext` and sends it with every `/api/chat` request.
2. **`BrowserContextSchema`** (`src/services/schemas/schemas.ts`) validates the payload on the server.
3. **`## Current User`** (server) — `buildSystemPrompt()` reads the authenticated user from the auth middleware context and injects name, email, and role. No client data needed; this comes from the JWT. The AI uses this to personalize replies and understand permissions without a tool call.
4. **`## Browser Context`** (server + client data) — same function injects timezone, locale, and the user's local date/time formatted using their locale and timezone from `browserContext`.
5. **`## Current Location`** (server + client data) — same function injects the current path, full URL, and any resolved dynamic segments (e.g. matching `/tasks/$taskId` to extract the concrete task id so the AI can resolve "this task").
6. **Navigation manifest** — `navigationManifest.ts` lists all user-facing routes and their search params (mirroring `src/routeTree.gen.ts`). This is injected into the system prompt so the AI knows which query params exist for each route and can form valid links and `navigate` tool calls.

When adding or changing routes:

- Update `APP_NAVIGATION` in `navigationManifest.ts` with the new route, description, and any `searchParams` (name + description). The manifest is the AI's view of the app structure.
- If a new route has dynamic segments (e.g. `$projectId`), add pattern-matching logic in `buildSystemPrompt()` so the AI can resolve "this project" to the current id.
- Search param names and descriptions in the manifest should match the Zod schemas in `validateSearch` on the corresponding route file.

### Promptable by Default

The app is AI-promptable out of the box when the required credentials are set. AI availability is checked at the **root loader level** via `getAIAvailability()` in `src/services/api/serverFns.ts`, which calls `getAIAdapterService().isConfigured()`. The result flows through the component tree:

1. `__root.tsx` loader fetches `aiAvailable` alongside `currentUser`.
2. `AppLayout` receives `aiAvailable` and conditionally mounts the chat trigger and drawer.
3. `Header` shows the "Ask AI" button only when `aiAvailable` is true.
4. `ChatDrawer` is only rendered when AI is configured — no disabled state or alert needed.

This avoids a flash of disabled UI and keeps the chrome clean when no AI provider is configured.

### Chat Drawer Convention

Unless the user specifies otherwise, the AI chat is rendered in a Mantine [`Drawer`](https://mantine.dev/core/drawer/) positioned on the **right** side (`position="right"`, `size="lg"`). The drawer is mounted at the root layout level (`AppLayout`) so messages persist across route navigation. The `useDisclosure` hook from `@mantine/hooks` controls open/close state.

### Chat Drawer Rendering

Assistant messages are rendered with [`react-markdown`](https://github.com/remarkjs/react-markdown) + [`remark-gfm`](https://github.com/remarkjs/remark-gfm) inside a `div` with the `.markdown` CSS Module class from `ChatDrawer.module.css`.

- **Tables**: GFM tables render as native `<table>` elements styled in the CSS Module with Mantine CSS variables (`--mantine-color-default-border`, `--mantine-color-default-hover`, `--mantine-font-size-xs`). Do **not** use Mantine `Table` components for markdown output — extend the `.markdown` CSS class instead.
- **Code blocks**: `pre` and `code` elements are styled in the same CSS Module using `--mantine-font-family-monospace` and `--mantine-radius-md`. No syntax highlighting library is included by default.
- **Internal links**: A custom `MarkdownLink` component detects internal paths (starts with `/`, not `/api/`) and renders TanStack Router `Link` with `preload="intent"` and query param parsing. Clicking navigates the app via client-side routing without closing the drawer or losing chat history — the drawer is mounted at the root layout level (`AppLayout`) so its `useChat` message state survives route changes. External links render as `<a target="_blank" rel="noopener noreferrer">`.
- **Adding markdown features**: To support new markdown elements (e.g. syntax highlighting, custom block renderers), add a `components` entry to the `Markdown` component in `ChatDrawer.tsx` and extend the `.markdown` CSS Module rules using Mantine CSS variables for theme consistency.

### System Prompt Generation

When scaffolding a new project, **ask the user about their domain** — entities, what the AI should be able to do, and permissions — then generate a tailored `BASE_SYSTEM_PROMPT` in `src/routes/api/chat.ts`. Do not copy the template's task-management prompt; every section must reflect the app being built.

`buildSystemPrompt()` composes `BASE_SYSTEM_PROMPT` + navigation manifest + dynamic context (Current User, Browser Context, Current Location) into a single string passed to `chat({ systemPrompts: [...] })`. The base prompt should follow this structure:

```
## Capabilities
- What the AI can do in this app (query data, create/update/delete entities, navigate, etc.)
- List every tool the AI has access to and when to use each one

## Data Model
- Each entity with its fields, types, and relationships
- Use a flat list: field name, type, and description

## Links and navigation
- Instruct the AI to use markdown links in replies (e.g. `[View item](/items/123)`)
- List available query params for filtering (e.g. `/items?status=active&priority=high`)
- Reference the navigate tool for client-side navigation

## Mutations and data refresh
- After mutation tools (create, update, delete), always call invalidateRouter
- List which tools are mutations

## Permissions and errors
- Map HTTP error codes to user-facing messages:
  - 401 → "You need to log in"
  - 403 → "You don't have permission"
  - 404 → "Not found"
- Reference getCurrentUserContext for checking permissions

## Guidelines
- Formatting conventions (markdown, concise, include status/priority when listing)
- When to use which tool (e.g. filter tool for criteria, detail tool for specific items)
```

The dynamic context sections (Current User, Browser Context, Current Location) are appended automatically by `buildSystemPrompt()` — see the "AI System Prompt Context" subsection above.

### Chat Endpoint (`src/routes/api/chat.ts`)

The chat endpoint is a TanStack Start file-based route at `/api/chat` with two server handlers. It is the central wiring point that connects the AI adapter, system prompt, tools, and auth context.

**File structure:** `BASE_SYSTEM_PROMPT` (domain-specific static prompt) → `buildSystemPrompt()` (composes base + manifest + dynamic context) → GET handler (`{ available }`) + POST handler (SSE stream).

**GET handler** — returns `{ available: boolean }` via `getAIAdapterService().isConfigured()`. The root loader calls this to decide whether to render the chat UI.

**POST handler** — the main chat flow:

1. **Check adapter** — get the adapter from `getAIAdapterService().getAdapter()`. If `null`, log the error, report to observability, and return `503`.
2. **Parse request** — `request.json()` yields `{ messages, browserContext }`.
3. **Extract auth** — `context as AuthContext` provides `user` and `userProfile` from the global auth middleware (no manual JWT extraction).
4. **Validate browser context** — `BrowserContextSchema.safeParse(body.browserContext)` validates client-sent data; failures are treated as `null` (graceful degradation).
5. **Build system prompt** — `buildSystemPrompt(user, userProfile, browserContext)` assembles the full prompt string.
6. **Assemble tools** — array of all server tool implementations (`.server()`) and client tool definitions (definition-only, no `.server()`).
7. **Stream** — `chat({ adapter, messages, systemPrompts, tools, agentLoopStrategy })` returns an async iterable; `toServerSentEventsResponse(stream)` converts it to an HTTP `Response` with SSE headers.

**When modifying this file:**

- Add new server tools to the `tools` array when you expose new repository methods.
- Add new client tool definitions (e.g. `navigateToolDef`) to the same array — they are definition-only on the server and wired in the browser via `.client()`.
- Update `BASE_SYSTEM_PROMPT` when the data model, routes, tools, or permission rules change.
- Add pattern-matching in `buildSystemPrompt()` when new routes have dynamic segments (e.g. `$projectId`).
- Update `getNavigationPromptSection()` in `navigationManifest.ts` when routes or search params change.

## 9. Observability

- **Interface**: `src/services/observability/types.ts` defines the `ObservabilityService` interface.
- **Implementations**: Sentry (`sentry.ts`) and no-op (`noop.ts`). Factory in `index.ts`.
- **Server Init**: `instrument.server.mjs` conditionally initializes the server-side SDK.
- **Client Init**: `src/router.tsx` conditionally initializes client-side tracing.
- **Usage**: Wrap server function internals with `getObservability().startSpan('name', fn)`.
- **To swap providers**: Implement `ObservabilityService`, update the factory, and replace `instrument.server.mjs`.

### App Version

The app follows [semver](https://semver.org/). The version in `package.json` is extracted at **build time** via Vite's `define` option and exposed as the global constant `__APP_VERSION__`. This constant is injected into every observability tool so that error reports, log lines, and traces are tagged with the exact deployed version.

**Vite config** (`vite.config.ts`):

```typescript
import { readFileSync } from 'node:fs'
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // ...existing config
})
```

**TypeScript declaration** (add to `src/vite-env.d.ts` or a global `.d.ts`):

```typescript
declare const __APP_VERSION__: string
```

**Sentry** — pass as `release` in `instrument.server.mjs` and in client init so errors are grouped by version:

```javascript
Sentry.init({
  dsn: sentryDsn,
  release: process.env.npm_package_version ?? 'unknown',
  // ...existing config
})
```

For the client-side Sentry init, use the Vite-injected constant:

```typescript
Sentry.init({ dsn, release: __APP_VERSION__ })
```

**Pino logger** — include `version` as a default binding so every log line carries it:

```typescript
export const logger = pino({
  level: 'info',
  base: { version: __APP_VERSION__ },
}, transport)
```

**Other tools** — any new observability integration should read `__APP_VERSION__` for the same purpose. The pattern ensures a single source of truth (`package.json`) with no manual version strings.

### Logging

This project uses [`pino`](https://getpino.io/) as the default server-side structured logger. Do **not** use `console.log` / `console.error` / `console.warn` in server code — use the logger instead.

**Setup**: The logger singleton lives in `src/services/logger.ts`. It conditionally adds the [`@sentry/pino-transport`](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/pino/) so that error-level logs (`logger.error(...)`) are automatically captured by Sentry when `VITE_SENTRY_DSN` is set. When no DSN is configured, pino logs to stdout with pretty-printing in development.

```tsx
import { logger } from '../services/logger'

logger.info({ repo: type }, 'Using repository')
logger.error({ err, taskId }, 'Failed to update task')
```

**Installation**:

```bash
pnpm add pino
pnpm add -D pino-pretty          # pretty-print in development
pnpm add @sentry/pino-transport  # optional: forward errors to Sentry
```

**Configuration pattern** (`src/services/logger.ts`):

```typescript
import pino from 'pino'

const transport = process.env.VITE_SENTRY_DSN
  ? pino.transport({
      targets: [
        { target: '@sentry/pino-transport', level: 'error' },
        {
          target: process.env.NODE_ENV === 'production' ? 'pino/file' : 'pino-pretty',
          level: 'info',
        },
      ],
    })
  : process.env.NODE_ENV === 'production'
    ? undefined
    : pino.transport({ target: 'pino-pretty' })

export const logger = pino({ level: 'info' }, transport)
```

When `VITE_SENTRY_DSN` is set, the Sentry transport receives error-level logs alongside the regular output target. When Sentry is not configured, the logger simply writes to stdout (pretty in dev, JSON in production). No code changes are needed when toggling Sentry on or off.

## 10. Testing

### Unit Tests (Vitest)

- **Framework**: Vitest with jsdom environment.
- **Libraries**: `@testing-library/react`, `@testing-library/dom`.
- **Setup**: Global setup in `src/test-utils/setupTests.ts` (includes `matchMedia`, `ResizeObserver`, `MutationObserver` mocks).
- **Rendering**: `renderWithProviders()` in `src/test-utils/renderWithRouter.tsx` wraps with MantineProvider.
- **Convention**: Test files co-located as `*.test.ts` or `*.test.tsx`.

### E2E Tests (Playwright)

- **Framework**: Playwright with Chromium.
- **Config**: `playwright.config.ts` — single worker, serial CRUD tests, `REPOSITORY_TYPE=seed`.
- **Auth fixture**: `e2e/auth.ts` provides `authedPage` / `authedContext` fixtures using unsigned JWTs sent via `extraHTTPHeaders`.
- **Convention**: Spec files in `e2e/` as `*.spec.ts`.
- **Running**: `pnpm test:e2e` (reuses existing dev server or starts one with seed data).

## 11. Linting and Formatting

This project uses [Biome](https://biomejs.dev/) as the default linter and formatter — **not** ESLint or Prettier. The configuration lives in `biome.json` with `recommended` rules and minimal overrides. When adding new rules, prefer Biome's built-in `recommended` set and keep custom overrides to a minimum.

## 12. Dependency Management

- **Always use latest versions**: When adding dependencies, run `pnpm add <pkg>` without a version suffix so the package manager resolves the newest release. Never pin exact versions unless there is a known incompatibility.
- **Keep dependencies up to date**: Run `pnpm outdated` to check for stale packages and `pnpm update` to align the lockfile with the latest compatible versions within current ranges.
- **Major version upgrades are conscious decisions**: When `pnpm outdated` shows a major version bump, upgrade explicitly with `pnpm add <pkg>@latest`, then verify with `pnpm lint && pnpm test && pnpm build` before committing.
- **After any dependency change**, run the full validation checklist (section 13) to catch regressions.

## 13. Validate Changes

Always verify changes with:

```bash
pnpm format    # Auto-fix formatting (Biome)
pnpm lint      # Check for lint errors and type errors (Biome + tsc)
pnpm test      # Run unit tests (Vitest)
pnpm test:e2e  # Run E2E tests (Playwright, requires dev server or lets Playwright start one)
pnpm build     # Verify production build
```

### Post-Setup / Migration Verification

When creating a new project from this template or migrating an existing one, confirm all of the following before considering the setup complete:

1. Dependencies installed with latest compatible versions (`pnpm install && pnpm update`).
2. `pnpm format && pnpm lint` passes with zero errors.
3. At least one unit test exists and `pnpm test` passes.
4. `pnpm build` succeeds with zero errors.
