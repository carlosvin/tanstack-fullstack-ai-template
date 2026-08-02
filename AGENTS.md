<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Agent Instructions

This document is the default agent and contributor guide for projects built from this template. It covers project structure, conventions, tooling, and operational detail.

The **architectural contract** lives in the [TanStack Promptable Fullstack App Template skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) (generated from `skills/src/*.skill.yaml`; regenerate with `pnpm skills:build`). **This handbook** covers project layout, UI kit, auth wiring, AI adapter setup, observability recipes, and validation commands — not alternate architecture.

Before non-trivial changes: read the skill **Core Contract** and run the **Architecture Checklist**.

## Skill alignment roadmap

This template is the reference app for the skill. **Already landed on `main`:** server-only boundaries ([#7](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/7)), request-context via middleware `next({ context })` + chaining ([#8](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/8), refined in [#12](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/12)), skill v1.19 Request Context rules, handbook dedupe ([#9](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/9)), Cursor Cloud setup ([#10](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/10)).

**Observability & env ([#6](https://github.com/carlosvin/tanstack-fullstack-ai-template/pull/6)):** companion skill `observability-and-env` — Zod env schemas (`src/env/webEnv.ts`: `webServerEnv` + `shellSession`), pino, `instrument.*.mts` bootstrap, middleware-injected context, `getBrowserShellSession` via root loader (no `window.__ENV__`).

| Phase | Skill contract | Status / files |
|-------|----------------|----------------|
| **0 — Observability & env** | Centralized env parse once; pino; Sentry; `webServerEnv` + `shellSession` | **Done** — `src/env/webEnv.ts`, `instrument.*.mts`, `webEnvMiddleware`, `getBrowserShellSession` |
| **1 — Schema boundaries** | Outbound `Schema.parse()` (repo → tools); router defaults bundle; `Link` with `search: true` | **Done** — `serverFns.ts`, `taskMappers.ts`, `router.tsx`, `src/components/Link/Link.tsx` |
| **2 — Auth & writes** | Auth ticket + `TraceabilityContext` (skill allows stock `user`/`userProfile` until enriched) | **Partial** — `TraceabilityContext` on writes; full auth ticket still open |
| **3 — Data loading & AI** | Parent loader dedup; `getAIAvailability()` gates chat UI | **Done** — `__root.tsx`, task routes, `Header`, `AppLayout`, `ChatDrawer` |
| **4 — Hardening** | `createServerOnlyFn`; `PUBLIC_ROUTES`; router introspection for nav manifest | **Partial** — `PUBLIC_ROUTES`, `*.server.ts` + import protection done; `createServerOnlyFn` deferred |
| **5 — Deploy** | Ship to [leafy-manatee-16b96c.netlify.app](https://leafy-manatee-16b96c.netlify.app) | After merge to `main` |

**CI/CD (Netlify-native):** GitHub Actions runs validation only (`.github/workflows/ci.yml`: lint, test, build). Netlify Git integration handles all deploys — **deploy previews** on pull requests and **production** on merge to `main` (`netlify.toml` → `pnpm build`, publish `dist`). With `NETLIFY=true` (set automatically on Netlify), `@netlify/vite-plugin-tanstack-start` writes static assets to `dist/` and SSR to `.netlify/`; local non-Netlify builds still emit `.output/public`. No `NETLIFY_AUTH_TOKEN` secrets in GitHub. In Netlify: production branch `main`, deploy previews on, branch deploys off.

**Phase 5 checklist:** `pnpm format && pnpm lint && pnpm test && pnpm build` → merge → Netlify auto-deploy from `main` → smoke-test demo. **Netlify env** (post-#6): `SENTRY_DSN`, `ENV`, `LOG_LEVEL`, `REPOSITORY_TYPE=seed`, `OPENAI_API_KEY` (or chosen provider) — not `VITE_SENTRY_DSN`.

See the skill **Implementation Flow** for the per-entity file checklist when adding domain entities.

## 1. General Principles

- **SOLID, DRY, YAGNI, KISS**: Adhere to these fundamental software design principles.
- **Readability & Clarity**: Code must be easy to read and understand.
- **Modularity & Reusability**: Write code that can be reused.
- **Pragmatic Programming**: Be practical and realistic in your approach.
- **Clean Code**: Follow clean code best practices.
- **Interface-First**: All external services (database, AI, observability) are accessed through interfaces, not concrete implementations.

## 2. File and Project Structure

- `src/components`: React components. Each component in its own folder with `Component.tsx` and optional `Component.module.css` and `Component.test.tsx`. Page-level components (e.g. `DashboardPage`, `TasksPage`) also live here so they can be tested independently.
- `src/routes`: TanStack Router file-based routes — thin route config only; page UI in `src/components/`. See skill **Core Contract** #7. Route tree: `routeTree.gen.ts`.
- `src/middleware`: TanStack Start middleware (auth, invalidation). Registered globally in `src/start.ts`.
- `src/services/api`: Server functions (exported directly from `createServerFn`) and shared response utilities.
- `src/services/repository`: Repository interface, implementations (MongoDB, seed), and the factory.
- `src/services/schemas`: Centralized Zod schemas — tools-layer schemas in `schemas.ts`, repository-layer schemas in `repository.ts`. See the [skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) for the full three-layer model.
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

Page components receive loader data as props and render in Vitest with `renderWithProviders()` without a running router. Shared display helpers belong in `src/utils/`. Examples: `src/routes/index.tsx`, `src/routes/tasks/index.tsx`.

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

- **Server Components by Default**: Rely on Server Components; use `"use client"` only for hooks or browser APIs. Keep client components leaf-level.
- **Functional Components**: Prefer functional components and hooks over class components.
- **Type Reuse**: Import types from `src/types`. Do not redefine existing types.
- **Architecture** (schema layers, URL-as-state, `loaderDeps`, `satisfies` over `as`, boundary parsing): follow the [skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) **Core Contract** #3–5, #7–8 and **Schema Boundaries**. Tools-layer schemas: `src/services/schemas/schemas.ts`; repository-layer: `src/services/schemas/repository.ts`.

## 5. Middleware and Auth

**Skill contract:** repository-backed auth ticket, server-enforced guards, `TraceabilityContext` on writes — see skill **Request Context** and **Interface Contracts**. **Current template** uses a simpler `AuthContext` (migration tracked in the alignment roadmap above).

### Files and env

| Piece | Path |
|-------|------|
| Global middleware registration | `src/start.ts` |
| JWT + profile load | `src/middleware/auth.ts` |
| Mutation auth gate | `src/middleware/requireAuth.ts` |
| Post-mutation invalidation | `src/middleware/invalidate.ts` |
| Guard helpers | `src/utils/auth.ts` — `requireAuth`, `requireGroup` |
| JWT parsing | `src/utils/jwt.server.ts` |

- **JWT header:** `AUTH_HEADER_NAME` env var (default: `Authorization`).
- **Mutations only:** POST server functions chain `requireAuthMiddleware`; GET queries are unauthenticated unless the handler adds auth middleware.
- **Custom authorization:** Chain composable middleware off `authMiddleware` (see `requireAuth.ts`).

### Auth Context (current)

```tsx
// src/middleware/auth.ts
interface AuthContext {
  user: UserIdentity
  userProfile: UserProfile | null
}
```

`requireAuthMiddleware` chains `authMiddleware` so `context.user` is typed in mutation handlers.

### Optional patterns (skill)

- **Public-route allowlist** — synthetic anonymous context for health/static paths (not yet in this template).
- **Pre-auth 308 redirects** — legacy URL compatibility before `authMiddleware` (skill **Implementation Flow** #5).

## 6. Server Functions and Data Access

Full-stack TanStack Start — no separate backend API. Architecture (layering, isomorphic loaders, tool coverage, boundary parsing): [skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) **Core Contract** #6, #16 and **Server execution boundaries**.

```
Route Loader → serverFns.ts → Repository → Database / Seed Data
```

| Concern | Where |
|---------|--------|
| RPC entry points | `src/services/api/serverFns.ts` — all `createServerFn` exports |
| UI mutation errors | `src/services/api/processResponse.ts` |
| AI tool errors | `src/services/ai/serverTool.ts` — `createSafeServerTool`, `safeToolHandler` |
| Repository factory | `src/services/repository/getRepository.server.ts` |
| Import protection | `vite.config.ts` → `tanstackStart({ importProtection })` |

**Calling convention:** `getTasks({ data: filter })` — pass `{ data: … }` to server functions.

**Mutations (template pattern):**

```tsx
export const myMutation = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware, invalidateMiddleware])
  .inputValidator(MyInputSchema)
  .handler(async ({ data, context }) => {
    return getWritableRepository().doSomething(data, context.user.email)
  })

const result = await processResponse(() => myMutation({ data: input }))
```

Call mutations from event handlers; show toast feedback on success/failure.

## 7. Routing (TanStack Router)

Routes live in `src/routes/`; tree is auto-generated in `routeTree.gen.ts`. Router config: `src/router.tsx`.

**Architecture** (`validateSearch`, `loaderDeps`, parent layout loaders, router defaults bundle, project `Link` wrapper): skill **Core Contract** #7–9, #15.

**Operational tip:** preserve search params with the functional navigate form — `navigate({ to: '/path', search: prev => ({ ...prev, newParam: 'value' }) })` — to avoid unnecessary re-renders from reading `useSearch()` only to spread into `navigate`.

## 8. AI Chat and Tools

**Architecture** (tool coverage, `browserContext`, bounded agent loop, prompt structure, virtual fields): [skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) **Core Contract** #11–14 and **Implementation Flow** #4, #7. **This section:** adapter setup, file paths, chat UI wiring, navigation manifest maintenance.

| File | Role |
|------|------|
| `src/services/ai/adapter.ts` | Provider implementation |
| `src/services/ai/tools.ts` | Server + client tool definitions |
| `src/services/ai/serverTool.ts` | `createSafeServerTool` / `safeToolHandler` |
| `src/services/ai/navigationManifest.ts` | AI route manifest — update when routes/search params change |
| `src/routes/api/chat.ts` | SSE endpoint, `BASE_SYSTEM_PROMPT`, `buildSystemPrompt` |
| `src/components/ChatDrawer/ChatDrawer.tsx` | `useChat`, client tools, markdown rendering |

**Promptable gating (skill #12):** root loader should call `getAIAvailability()` and mount chat UI only when configured. *Template gap:* `Header` / `ChatDrawer` currently always render; see alignment roadmap phase 3.

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

Definitions in `src/services/ai/tools.ts` — each calls the same `serverFns.ts` exports as routes. When adding repository methods, add matching `toolDefinition` + `createSafeServerTool` entries (skill **Core Contract** #11).

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

When routes or `validateSearch` schemas change, update `APP_NAVIGATION` in `src/services/ai/navigationManifest.ts` (descriptions should match schema `.describe()` text). Long-term: skill **Special Patterns** — derive from router introspection where possible.

- Internal links in assistant messages: `ChatDrawer` `MarkdownLink` → TanStack Router `Link` with `preload="intent"`.
- AI uses markdown links in replies; **navigate** client tool for programmatic navigation.

### AI System Prompt Context

`buildSystemPrompt()` in `src/routes/api/chat.ts` merges `BASE_SYSTEM_PROMPT`, navigation manifest, and dynamic blocks (Current User, Browser Context, Current Location). Client sends `browserContext` from `ChatDrawer`; server validates with `BrowserContextSchema` in `schemas.ts`.

When adding dynamic route segments, add pattern-matching in `buildSystemPrompt()` so the AI can resolve "this task" to the current id.

### Chat Drawer Convention

Unless the user specifies otherwise, the AI chat is rendered in a Mantine [`Drawer`](https://mantine.dev/core/drawer/) positioned on the **right** side (`position="right"`, `size="lg"`). The drawer is mounted at the root layout level (`AppLayout`) so messages persist across route navigation. The `useDisclosure` hook from `@mantine/hooks` controls open/close state.

### Chat Drawer Rendering

Assistant messages are rendered with [`react-markdown`](https://github.com/remarkjs/react-markdown) + [`remark-gfm`](https://github.com/remarkjs/remark-gfm) inside a `div` with the `.markdown` CSS Module class from `ChatDrawer.module.css`.

- **Tables**: GFM tables render as native `<table>` elements styled in the CSS Module with Mantine CSS variables (`--mantine-color-default-border`, `--mantine-color-default-hover`, `--mantine-font-size-xs`). Do **not** use Mantine `Table` components for markdown output — extend the `.markdown` CSS class instead.
- **Code blocks**: `pre` and `code` elements are styled in the same CSS Module using `--mantine-font-family-monospace` and `--mantine-radius-md`. No syntax highlighting library is included by default.
- **Internal links**: A custom `MarkdownLink` component detects internal paths (starts with `/`, not `/api/`) and renders TanStack Router `Link` with `preload="intent"` and query param parsing. Clicking navigates the app via client-side routing without closing the drawer or losing chat history — the drawer is mounted at the root layout level (`AppLayout`) so its `useChat` message state survives route changes. External links render as `<a target="_blank" rel="noopener noreferrer">`.
- **Adding markdown features**: To support new markdown elements (e.g. syntax highlighting, custom block renderers), add a `components` entry to the `Markdown` component in `ChatDrawer.tsx` and extend the `.markdown` CSS Module rules using Mantine CSS variables for theme consistency.

### System Prompt Generation

For new projects, ask the user about domain entities and permissions, then tailor `BASE_SYSTEM_PROMPT` in `src/routes/api/chat.ts` (do not copy the template task prompt verbatim). Section structure: skill **Implementation Flow** #7.

### Chat Endpoint (`src/routes/api/chat.ts`)

The chat endpoint is a TanStack Start file-based route at `/api/chat` with two server handlers. It is the central wiring point that connects the AI adapter, system prompt, tools, and auth context.

**File structure:** `BASE_SYSTEM_PROMPT` (domain-specific static prompt) → `buildSystemPrompt()` (composes base + manifest + dynamic context) → GET handler (`{ available }`) + POST handler (SSE stream).

**GET handler** — `{ available: boolean }` from `getAIAdapterService().isConfigured()`.

**POST handler flow:** check adapter → parse `{ messages, browserContext }` → `buildSystemPrompt` → assemble tools → `chat({ …, agentLoopStrategy: maxIterations(N) })` → SSE via `toServerSentEventsResponse`. Set `maxIterations` explicitly (skill **Core Contract** #13).

When modifying: add server tools to the `tools` array; add client tool defs and wire `.client()` in `ChatDrawer`; update `BASE_SYSTEM_PROMPT` and `navigationManifest.ts` when domain or routes change.

## 9. Observability

**Architecture & setup:** [observability-and-env skill](.agents/skills/observability-and-env/SKILL.md) (landed via PR #6). **This section:** file map and usage in this repo.

| Piece | Path |
|-------|------|
| Interface | `src/services/observability/types.ts` |
| Sentry / no-op | `sentry.ts`, `noop.ts`; factory `index.ts` |
| Server bootstrap | `instrument.env.mts` → `instrument.shared.mts` → `instrument.server.mts` (emitted `.mjs` in `.output/server`) |
| Env schemas | `src/env/runtimeEnvSchema.ts`, `src/env/webEnv.ts` |
| Pino | `src/utils/logger.ts`, `src/utils/serverLogger.ts` |
| Public env middleware | `src/middleware/webEnv.ts` |
| Public env + app meta for client | `getBrowserShellSession` in `serverFns.ts` + root loader (not `window.__ENV__`) |
| Typed request context | `webEnvMiddleware` via `next({ context })`; chain middleware on consumers |

- **Usage:** `getObservability().startSpan('name', fn)` in server handlers; `createServerLogger('module')` for structured logs.
- **Env vars:** `SENTRY_DSN`, `ENV`, `LOG_LEVEL` — see `.env.example`. Keep `NODE_ENV` and `ENV` aligned in production so Sentry tags match runtime behavior.

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
- **After any dependency change**, run the full validation checklist (section 15) to catch regressions.

## 13. Public Runtime Config

Handled by the [observability-and-env skill](.agents/skills/observability-and-env/SKILL.md) (PR #6): startup-validated `webServerEnv` / `webPublicEnv` / `appMeta` on middleware context; browser-safe projection via `getBrowserShellSession` in the root loader — **not** `window.__ENV__` or `import.meta.env` for deployment-specific values.

## 14. Special Patterns

Bulk edit (URL multi-select), overlay repository, distinct-values tools, help surface, controlled components: [skill](.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md) **Special Patterns** and **Core Contract** #7–8.

## 15. Validate Changes

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

## Cursor Cloud specific instructions

Package manager is **pnpm**; the standard commands live in `package.json` and section 15 above (`pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`). Node 22 works fine even though the `Dockerfile` pins Node 24 (there is no `engines` field). The app runs on **port 3000**.

- **No external services required.** With no `MONGODB_URI`, the app uses the in-memory **seed** repository, so `pnpm dev` is fully functional on its own. MongoDB, an AI provider (Gemini/Azure OpenAI), and Sentry are all optional — the app degrades gracefully when their env vars are unset.
- **Auth is header-only.** The auth middleware reads a JWT from the `Authorization` header (`src/middleware/auth.ts`); there is no cookie/session login. A plain browser is therefore anonymous and cannot mutate (the "Add task" button and edit/delete icons are hidden). E2E tests inject an unsigned JWT via `extraHTTPHeaders` (`e2e/auth.ts`). To manually exercise authenticated flows in a real browser, put a small reverse proxy in front of `:3000` that adds an `Authorization: Bearer <unsigned-jwt>` header (unsigned `alg:none` tokens are accepted — signatures are not verified).
- **E2E gotcha — `networkidle` hangs in dev mode.** `pnpm test:e2e` defaults to starting `pnpm dev` (see `playwright.config.ts`, `reuseExistingServer: true`). The `@tanstack/devtools-vite` plugin holds an open background connection in dev, so the `task-crud` specs that use `page.goto(..., { waitUntil: 'networkidle' })` never settle and time out. To get a clean run, start a **production** server first and let Playwright reuse it: `pnpm build` then `REPOSITORY_TYPE=seed PORT=3000 pnpm start`, then `pnpm test:e2e` in another shell.
- **Pre-existing E2E selector drift (not an environment issue).** `e2e/task-crud.spec.ts` "creates a new task" targets Priority via `getByRole('textbox', { name: 'Priority' })`, but Mantine v9 renders that Select as a `combobox`, so this one test fails regardless of setup. Expect ~17/22 E2E specs green; unit tests (`pnpm test`), lint, and build are all fully green.
- **Harmless noise:** `pnpm install` prints an "Ignored build scripts" warning (esbuild/swc/etc.) — build/dev/test all work anyway. `pnpm test` (Vitest) prints a "close timed out" / "module is not defined" message during teardown after all tests pass.
- **Deploys are Netlify-only.** PR previews and production deploys come from Netlify Git integration, not GitHub Actions. GHA validates; Netlify publishes. Confirm deploy previews are enabled in the Netlify site settings.
