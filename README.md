# TanStack AI-Promptable Full-Stack Template

A production-ready full-stack starter template for building **AI-promptable** internal tools and web applications.

Built with [TanStack Start](https://tanstack.com/start) — with every external service behind an interface so you can swap implementations without touching application code.

**Default stack**: [Mantine](https://mantine.dev/) + [MongoDB](https://www.mongodb.com/) + [TanStack AI](https://tanstack.com/ai) (OpenAI) + [Sentry](https://sentry.io/). All swappable.

**[Live Demo](https://leafy-manatee-16b96c.netlify.app)** | **[Blog Post](building-ai-promptable-fullstack-apps.md)**

## Use the Agent Skill

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
```

Optional: `-g` installs globally; `npx skills add carlosvin/tanstack-fullstack-ai-template --list` lists skills from this repo; `npx skills list` verifies installed skills.

The **TanStack Promptable Fullstack** skill is an [Agent Skill](https://agentskills.io) that teaches coding assistants the template’s **architecture contract**: interface-first boundaries, three schema layers with `Schema.parse()` at each boundary, thin routes + loaders (no `useEffect` data fetching for route data), URL state via `validateSearch`, repository interfaces, AI tools aligned with server functions, auth + invalidation on mutations, and TypeScript discipline inside the typed flow. **[AGENTS.md](./AGENTS.md)** stays the **handbook** (UI, auth snippets, chat, tests, checklist); the skill is the **rules agents must not break**.

**Why it helps:** fewer regressions when scaffolding features, migrating code, or refactoring routes — agents follow the same non-obvious invariants the template depends on.

**When to use it:** starting from this template, adding entities or AI tools, adopting the pattern in another TanStack Start app, or fixing duplicated parent/child route work.

### Other ways to install

- **Shell installer** (Cursor / Windsurf / Claude Code global dirs):  
  `curl -sL https://raw.githubusercontent.com/carlosvin/tanstack-fullstack-ai-template/main/scripts/skills/install.sh | bash -s -- --force`
- **Manual copy:** copy `.agents/skills/tanstack-promptable-fullstack-app-template/` to `~/.cursor/skills/`, `~/.claude/skills/`, or your editor’s documented skills path.
- **Using this repo as-is:** Windsurf and compatible tools can read `.agents/skills/` directly — no extra step.

More user-focused detail: **[skills/README.md](./skills/README.md)** · Editing/regenerating the skill (YAML, CI): **[skills/AUTHORING.md](./skills/AUTHORING.md)**.

### Try it

Ask your agent:

- "What are the core contract items in the TanStack fullstack skill I must not violate?"
- "Add a new domain entity following this template’s schema layers, repository, server functions, routes, and AI tools."
- "Should any of my nested routes move shared `beforeLoad` or loader work to a parent layout?"

### What the skill enforces (outcomes)

- **One tools-layer schema** for both server functions and AI tools; **parse both ways** (tools ↔ repo) at mapper boundaries.
- **Thin routes**; **loaders** fetch data; **URL search params** hold filters/tabs/selections with `loaderDeps` for cache keys.
- **POST mutations** use auth + invalidation middleware; callers normalize errors consistently for UI and AI.
- **AI:** expose repository capabilities as tools; client **navigate** / **invalidateRouter**; gate chat on availability; bounded agent loop in `chat()`.
- **Parent layouts** own shared guards and expensive reads; children read parent loader data instead of duplicating work.
- **TypeScript** after parsing: preserve inference — prefer `satisfies`, exhaustive handling, and guards over `any` and loose `as` casts.

## Architecture

The architecture is organized in layers with clear interface boundaries. The interfaces are the contract — the implementations are your choice.

### High-Level Overview

```mermaid
flowchart TB
    subgraph Client ["Client Layer"]
        direction LR
        Pages["Pages & Components"]
        Chat["AI Chat Drawer"]
    end

    subgraph Mid ["Middleware Layer"]
        direction LR
        AuthMW["Auth (JWT)"]
        InvMW["Invalidation (POST)"]
    end

    subgraph Server ["Server Function Layer"]
        direction LR
        GET["Queries (GET)"]
        POST["Mutations (POST)"]
        SSE["Chat API (SSE)"]
    end

    subgraph Boundary ["Interface Boundary — swap anything below"]
        direction LR
        Repo["Repository"]
        AI["AIAdapterService"]
        Obs["ObservabilityService"]
    end

    subgraph Impl ["Implementations (swappable)"]
        direction LR
        DB["MongoDB, Postgres, ..."]
        LLM["OpenAI, Anthropic, ..."]
        Mon["Sentry, Datadog, ..."]
    end

    Schemas["Schemas (Zod / ArkType / Valibot)"]

    Client --> Mid --> Server
    Server --> Boundary
    Boundary --> Impl
    Schemas -..-> Server
    Schemas -..-> Boundary
```

### Detailed Data Flow

```mermaid
flowchart TB
    subgraph client ["Client (Browser)"]
        UILib["UI Components"]
        Router["TanStack Router"]
        ChatUI["Chat Drawer"]
    end

    subgraph middleware ["Global Middleware"]
        Auth["Auth Middleware"]
        Invalidate["Invalidate Middleware"]
    end

    subgraph serverFns ["Server Functions (TanStack Start)"]
        Queries["Queries (GET)"]
        Mutations["Mutations (POST)"]
        ChatAPI["Chat API (SSE)"]
    end

    subgraph interfaces ["Interface Boundaries"]
        RepoInterface["Repository"]
        AIInterface["AIAdapterService"]
        ObsInterface["ObservabilityService"]
    end

    subgraph implementations ["Swappable Implementations"]
        direction LR
        MongoDB["MongoDB"]
        SeedRepo["Seed (in-memory)"]
        OpenAI["OpenAI / Azure"]
        Sentry["Sentry"]
        NoOp["No-op"]
    end

    subgraph schemas ["Schema Layer"]
        Zod["Zod Schemas"]
    end

    Router --> Queries
    ChatUI --> ChatAPI
    UILib --> Mutations

    Queries --> RepoInterface
    Mutations --> RepoInterface
    ChatAPI --> AIInterface
    Queries --> ObsInterface
    Mutations --> ObsInterface

    RepoInterface --> MongoDB
    RepoInterface --> SeedRepo
    AIInterface --> OpenAI
    ObsInterface --> Sentry
    ObsInterface --> NoOp

    Zod -.-> serverFns
    Zod -.-> interfaces
    Auth -.-> serverFns
    Invalidate -.-> Mutations
```

### Swappable Layers

| Layer | Interface | Default | Alternatives |
|-------|-----------|---------|-------------|
| **Database** | `ReadRepository` / `WritableRepository` | [MongoDB](https://www.mongodb.com/) | [Postgres](https://www.postgresql.org/), [DynamoDB](https://aws.amazon.com/dynamodb/), [Supabase](https://supabase.com/), in-memory |
| **AI Provider** | `AIAdapterService` | [OpenAI](https://platform.openai.com/) (Azure) | [Anthropic](https://www.anthropic.com/), [Gemini](https://ai.google.dev/), [Ollama](https://ollama.com/), any OpenAI-compatible |
| **Observability** | `ObservabilityService` | [Sentry](https://sentry.io/) | [Datadog](https://www.datadoghq.com/), [OpenTelemetry](https://opentelemetry.io/), no-op |
| **UI Library** | — (component layer) | [Mantine](https://mantine.dev/) | [MongoDB.design](https://www.mongodb.design/), [shadcn/ui](https://ui.shadcn.com/), [Chakra](https://chakra-ui.com/), [Ant Design](https://ant.design/), [Radix](https://www.radix-ui.com/) |
| **Schema Validation** | — ([Standard Schema](https://github.com/standard-schema/standard-schema) spec) | [Zod](https://zod.dev/) | [ArkType](https://arktype.io/), [Valibot](https://valibot.dev/), [Effect Schema](https://effect.website/docs/schema/introduction/) |

**Schema library note:** [ArkType](https://arktype.io/) is a very good alternative to Zod (and many prefer its syntax). This template uses Zod because it is more widely known and has broad ecosystem support. With Zod v4 you can attach extra metadata to fields—e.g. formatting or units—which helps both UI rendering and AI tool hints; the same idea applies if you swap to ArkType or another schema library.

### Key Design Decisions

- **Repository Pattern**: All data access goes through an interface. A seed implementation ships for development; swap to MongoDB (or anything else) via environment variable.
- **Auth via Middleware**: A global TanStack Start middleware extracts JWT identity from headers and provides typed `AuthContext` to every server function. Mutations additionally use function-level `requireAuthMiddleware` so only POST server functions require authentication; queries stay unauthenticated.
- **Invalidation Middleware**: All POST server functions chain `invalidateMiddleware`, which calls `router.invalidate()` on the client after mutations. Components never invalidate manually. The AI chat uses an `invalidateRouter` client tool for the same purpose.
- **Task CRUD UI**: Add, edit, and delete tasks from the list and detail pages. Only the task creator can edit or delete; anyone logged in can create. Buttons are gated by auth and creator checks.
- **Promptable by Default**: AI tools call the same server functions that the UI uses — a single code path for validation, auth, and data access. Read and mutation tools go through the shared `createSafeServerTool()` helper so errors still return `{ error, code }` without repeating wrapper logic in every tool. A **getCurrentUserContext** tool lets the AI check who is logged in and what they can do. When the user is not allowed, tools return errors with 401/403 so the AI can inform the user. [Client tools](https://tanstack.com/ai/latest/docs/guides/client-tools) (`navigate`, `invalidateRouter`) run in the browser via `@tanstack/ai-client`.
- **URL-Aware AI Prompt**: The chat request includes browser context and current location (`currentPathname`, `currentSearch`, `currentHref`). The system prompt includes this as `Current Location` context and uses route-pattern guidance (for example `/tasks/$taskId` -> `/tasks/<taskId>`) so references like "this task" resolve to the page in view.
- **Observability as a Plugin**: Behind an `ObservabilityService` interface. No DSN configured? A no-op implementation is used. Want Datadog? Implement the interface.
- **Schemas = Source of Truth**: Every domain type is a schema with `.describe()` metadata. Types are inferred, JSON Schemas flow to AI tools automatically.
- **URL-as-State**: Page state (filters, selections, tabs) lives in URL search params, not component state. Shareable, bookmarkable, survives refresh.
- **Loaders-First**: Data is fetched in route loaders, never in `useEffect` + `useState`. Loaders provide caching, SSR, and parallel fetching for free.
- **E2E Tests Against Seed Data**: Playwright tests run against the dev server with `REPOSITORY_TYPE=seed`. An unsigned JWT fixture provides authenticated browser contexts. Tests cover dashboard, task list, task detail, and full CRUD — all without a real database.

## Project Structure

```
src/
├── start.ts                    # Global middleware registration
├── router.tsx                  # Router + client observability
├── middleware/
│   ├── auth.ts                 # JWT → AuthContext
│   ├── requireAuth.ts          # Function middleware for mutations (401 if not logged in)
│   └── invalidate.ts           # POST → router.invalidate()
├── routes/                     # File-based routes (pages)
├── components/                 # React components
├── services/
│   ├── schemas/schemas.ts      # Zod schemas (single source of truth)
│   ├── repository/             # Interface + Seed + Mongo implementations
│   ├── api/serverFns.ts        # Server functions (TanStack Start)
│   ├── ai/
│   │   ├── types.ts            # AIAdapterService interface
│   │   ├── adapter.ts          # OpenAI implementation + factory
│   │   └── tools.ts            # AI tool definitions
│   ├── observability/
│   │   ├── types.ts            # ObservabilityService interface
│   │   ├── sentry.ts           # Sentry implementation
│   │   ├── noop.ts             # No-op implementation
│   │   └── index.ts            # Factory
│   └── db/mongoClient.ts       # MongoDB singleton
├── utils/
│   ├── auth.ts                 # requireAuth(), requireGroup()
│   ├── httpError.ts            # HttpError class
│   └── jwt.ts                  # JWT decode
├── constants/                  # Shared enums
└── test-utils/                 # Vitest helpers

e2e/                               # Playwright E2E tests
├── auth.ts                        # Unsigned JWT helper + authenticated fixtures
├── dashboard.spec.ts
├── tasks-list.spec.ts
├── task-detail.spec.ts
└── task-crud.spec.ts
```

## Environment Variables

See [`.env.example`](.env.example) for the full list with documentation.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | No | — | MongoDB connection string. If absent, seed repo is used. |
| `MONGODB_DB_NAME` | No | `app-db` | Database name. |
| `REPOSITORY_TYPE` | No | auto | `seed` or `mongo`. Auto-detected from `MONGODB_URI`. |
| `AZURE_OPENAI_API_KEY` | No | — | OpenAI API key. AI chat is disabled without it. |
| `AZURE_OPENAI_ENDPOINT` | No | — | OpenAI base URL (e.g., `https://host/openai/v1`). |
| `AZURE_OPENAI_DEPLOYMENT` | No | `gpt-4o` | Model deployment name. |
| `SENTRY_DSN` | No | — | Sentry DSN for server and browser observability. Observability disabled without it. |
| `AUTH_HEADER_NAME` | No | `Authorization` | HTTP header containing the JWT. |

## Extending the Template

### Adding a New Entity (End-to-End)

1. **Schema**: Add Zod schemas in `src/services/schemas/schemas.ts` with `.describe()` on every field.
2. **Repository**: Add methods to the `ReadRepository` and/or `WritableRepository` interfaces in `types.ts`. Implement in both `seedRepository.ts` and `mongoRepository.ts`.
3. **Server Functions**: Add `createServerFn` wrappers in `src/services/api/serverFns.ts`. Chain `.middleware([invalidateMiddleware])` on mutations.
4. **AI Tools**: Expose methods as tools in `src/services/ai/tools.ts` that call your server functions through `createSafeServerTool()`. Update the system prompt.
   - Keep `src/services/ai/navigationManifest.ts` aligned with routes (including dynamic segments like `/tasks/$taskId`).
   - Ensure chat requests include current URL context in `browserContext` so the prompt can reason about the current page.
5. **Routes**: Create route files under `src/routes/`. Use loaders to fetch data.
6. **Tests**: Write unit tests for the seed repository and E2E tests in `e2e/` for the new routes.

### Swapping the Database

Replace `mongoRepository.ts` with your implementation of the `Repository` interface. Update the factory in `getRepository.ts`.

### Swapping the AI Provider

Create a new class implementing `AIAdapterService` from `src/services/ai/types.ts`. Update the factory in `adapter.ts`.

### Swapping Observability

1. Create a new class implementing `ObservabilityService` from `src/services/observability/types.ts`.
2. Update the factory in `src/services/observability/index.ts`.
3. Update `instrument.server.mts` (and rebuild so `.output/server/instrument.server.mjs` reflects the change) for server-side init.

### Swapping the UI Library

Replace Mantine imports in components. The architectural layers (repository, server functions, middleware) are unaffected.

## Generated Example

You can easily run it just by.

```bash

# Install dependencies
pnpm install

# Start the dev server (uses in-memory seed data, no DB required)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app works immediately with seed data — no database, no API keys, no configuration needed.

### Run it with Docker

```bash
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
```

### Scripts

```bash
# commands for the app generated by the skill
pnpm dev        # Start dev server on port 3000
pnpm build      # Production build
pnpm start      # Run production server
pnpm test       # Run unit tests (Vitest)
pnpm test:e2e   # Run E2E tests (Playwright, uses seed data)
pnpm lint       # Lint + typecheck (Biome)
pnpm format     # Auto-format (Biome)

# skill dev commands
pnpm skills:build  # Generate Cursor + markdown skill artifacts
pnpm skills:check  # Validate canonical skills and check for drift
```

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (full-stack React with SSR)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based, type-safe)
- **AI**: [TanStack AI](https://tanstack.com/ai) (multi-provider, tool calling)
- **UI**: [Mantine](https://mantine.dev/) (component library + hooks)
- **Database**: [MongoDB](https://www.mongodb.com/) (via repository pattern)
- **Validation**: [Zod](https://zod.dev/) (schemas as source of truth)
- **Auth**: [jose](https://github.com/panva/jose) (JWT decode, any JS runtime)
- **Observability**: [Sentry](https://sentry.io/) (behind interface, optional)
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (unit), [Playwright](https://playwright.dev/) (E2E)
- **Linting**: [Biome](https://biomejs.dev/)
- **Server**: [Nitro](https://nitro.build/) (universal JavaScript server)

## Using This Template

### Option A: Clone and Build (New Project)

```bash
git clone https://github.com/carlosvin/tanstack-fullstack-ai-template.git my-app
cd my-app
rm -rf .git && git init    # Start fresh git history
pnpm install
pnpm dev                   # Works immediately with seed data
```

Then follow the end-to-end workflow:

1. Define your domain schemas in `src/services/schemas/schemas.ts` (Zod schemas with `.describe()` on every field, types inferred via `z.infer<>`)
2. Define your repository interface in `src/services/repository/types.ts` (`ReadRepository` + `WritableRepository`)
3. Implement the seed repository in `seedRepository.ts` (in-memory data for development)
4. Add server functions in `src/services/api/serverFns.ts` (GET for loaders, POST with `invalidateMiddleware` for mutations)
5. Expose methods as AI tools in `src/services/ai/tools.ts` that call your server functions through `createSafeServerTool()`
6. Create file-based routes under `src/routes/` (data in loaders, state in URL search params)
7. When ready for real data, implement `mongoRepository.ts` and set `MONGODB_URI`

### Option B: AI-assisted (skill)

See **[Use the Agent Skill](#use-the-agent-skill)** above for install commands, quick prompts, and what the skill enforces. Contributor workflow (edit YAML, regenerate): **[skills/AUTHORING.md](./skills/AUTHORING.md)**.

### Option C: Adopt Incrementally (Existing Project)

You don't need to adopt the whole pattern at once. Each layer is independently valuable:

1. **Schema layer** — Move types to a centralized schema file with `.describe()` metadata
2. **Repository interface** — Extract data access behind `ReadRepository`/`WritableRepository`
3. **Server functions** — Wrap repository calls with `createServerFn` and `processResponse()`
4. **Auth middleware** — Add global JWT extraction and typed `AuthContext`
5. **Observability interface** — Put monitoring behind `ObservabilityService`
6. **AI tools** — Expose read methods as tools for the chat assistant
7. **Route migration** — Move `useEffect` data fetching into loaders, `useState` into URL search params

## License

MIT
