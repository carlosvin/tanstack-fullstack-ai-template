# TanStack Full-Stack Template

A production-ready full-stack starter template for building **AI-promptable** internal tools and web applications.

Built with [TanStack Start](https://tanstack.com/start) — with every external service behind an interface so you can swap implementations without touching application code.

**Default stack**: [Mantine](https://mantine.dev/) + [MongoDB](https://www.mongodb.com/) + [TanStack AI](https://tanstack.com/ai) (OpenAI) + [Sentry](https://sentry.io/). All swappable.

## Quick Start

```bash
# Clone the template
git clone https://github.com/your-org/tanstack-fullstack-template.git
cd tanstack-fullstack-template

# Install dependencies
pnpm install

# Start the dev server (uses in-memory seed data, no DB required)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app works immediately with seed data — no database, no API keys, no configuration needed.

## Architecture

The architecture is organized in layers with clear interface boundaries. Everything below the dotted line is swappable — the interfaces are the contract, the implementations are your choice.

```mermaid
graph TB
    subgraph client ["Client (Browser)"]
        UILib["UI Components<br/><i>default: Mantine</i>"]
        Router["TanStack Router<br/>file-based, type-safe"]
        ChatUI["Chat Drawer<br/>TanStack AI React"]
    end

    subgraph middleware ["Global Middleware"]
        Auth["Auth Middleware<br/>JWT → AuthContext"]
        Invalidate["Invalidate Middleware<br/>POST → router.invalidate()"]
    end

    subgraph serverFns ["Server Functions (TanStack Start)"]
        Queries["Queries (GET)<br/>route loaders"]
        Mutations["Mutations (POST)<br/>event handlers"]
        ChatAPI["Chat API (SSE)<br/>/api/chat"]
    end

    subgraph interfaces ["Interface Boundaries"]
        RepoInterface["ReadRepository / WritableRepository"]
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
        Zod["Zod Schemas<br/>single source of truth<br/>types + validation + AI metadata"]
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

### Key Design Decisions

- **Repository Pattern**: All data access goes through an interface. A seed implementation ships for development; swap to MongoDB (or anything else) via environment variable.
- **Auth via Middleware**: A global TanStack Start middleware extracts JWT identity from headers and provides typed `AuthContext` to every server function — no manual auth boilerplate per handler.
- **Invalidation Middleware**: All POST server functions chain `invalidateMiddleware`, which calls `router.invalidate()` on the client after mutations. Components never invalidate manually.
- **Promptable by Default**: All read repository methods are exposed as AI tools via TanStack AI. The chat drawer lets users query data in natural language.
- **Observability as a Plugin**: Behind an `ObservabilityService` interface. No DSN configured? A no-op implementation is used. Want Datadog? Implement the interface.
- **Schemas = Source of Truth**: Every domain type is a schema with `.describe()` metadata. Types are inferred, JSON Schemas flow to AI tools automatically.
- **URL-as-State**: Page state (filters, selections, tabs) lives in URL search params, not component state. Shareable, bookmarkable, survives refresh.
- **Loaders-First**: Data is fetched in route loaders, never in `useEffect` + `useState`. Loaders provide caching, SSR, and parallel fetching for free.

## Project Structure

```
src/
├── start.ts                    # Global middleware registration
├── router.tsx                  # Router + client observability
├── middleware/
│   ├── auth.ts                 # JWT → AuthContext
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
| `VITE_SENTRY_DSN` | No | — | Sentry DSN. Observability disabled without it. |
| `AUTH_HEADER_NAME` | No | `Authorization` | HTTP header containing the JWT. |

## Extending the Template

### Adding a New Entity (End-to-End)

1. **Schema**: Add Zod schemas in `src/services/schemas/schemas.ts` with `.describe()` on every field.
2. **Repository**: Add methods to the `ReadRepository` and/or `WritableRepository` interfaces in `types.ts`. Implement in both `seedRepository.ts` and `mongoRepository.ts`.
3. **Server Functions**: Add `createServerFn` wrappers in `src/services/api/serverFns.ts`. Chain `.middleware([invalidateMiddleware])` on mutations.
4. **AI Tools**: Expose read methods as tools in `src/services/ai/tools.ts` wrapped with `safeToolHandler()`. Update the system prompt.
5. **Routes**: Create route files under `src/routes/`. Use loaders to fetch data.
6. **Tests**: Write unit tests for the seed repository and any new utilities.

### Swapping the Database

Replace `mongoRepository.ts` with your implementation of the `Repository` interface. Update the factory in `getRepository.ts`.

### Swapping the AI Provider

Create a new class implementing `AIAdapterService` from `src/services/ai/types.ts`. Update the factory in `adapter.ts`.

### Swapping Observability

1. Create a new class implementing `ObservabilityService` from `src/services/observability/types.ts`.
2. Update the factory in `src/services/observability/index.ts`.
3. Update `instrument.server.mjs` for server-side init.

### Swapping the UI Library

Replace Mantine imports in components. The architectural layers (repository, server functions, middleware) are unaffected.

## Scripts

```bash
pnpm dev        # Start dev server on port 3000
pnpm build      # Production build
pnpm start      # Run production server
pnpm test       # Run tests
pnpm lint       # Lint + typecheck (Biome)
pnpm format     # Auto-format (Biome)
```

## Docker

```bash
docker build -t my-app .
docker run --rm -p 3000:3000 my-app
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
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Server**: [Nitro](https://nitro.build/) (universal JavaScript server)

## Using This Template

### Option A: Clone and Build (New Project)

```bash
git clone https://github.com/your-org/tanstack-fullstack-template.git my-app
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
5. Expose read methods as AI tools in `src/services/ai/tools.ts` (wrapped with `safeToolHandler()`)
6. Create file-based routes under `src/routes/` (data in loaders, state in URL search params)
7. When ready for real data, implement `mongoRepository.ts` and set `MONGODB_URI`

### Option B: AI-Assisted via Cursor Skill (New or Existing Project)

This template ships with a [Cursor Skill](https://docs.cursor.com/context/skills) that guides an AI agent through applying the pattern step-by-step — either to a fresh project or to an existing codebase.

**Install the skill** by copying the skill folder into your Cursor skills directory:

```bash
cp -r path/to/tanstack-fullstack-template/.cursor/skills/tanstack-fullstack-pattern ~/.cursor/skills/
```

Or create it as a project-level skill (shared with your team via git):

```bash
mkdir -p .cursor/skills
cp -r path/to/tanstack-fullstack-template/.cursor/skills/tanstack-fullstack-pattern .cursor/skills/
```

Once installed, the skill is automatically available in Cursor. Ask the agent to apply the pattern:

- *"Set up this project using the TanStack fullstack pattern"*
- *"Add the repository pattern to this existing app"*
- *"Migrate this project to use interface-first architecture"*

The skill covers:
- The 6 architectural layers and their boundaries
- All 4 interface contracts (`ReadRepository`/`WritableRepository`, `AIAdapterService`, `ObservabilityService`, `AuthContext`)
- Rigid rules (loaders-first, URL-as-state, schema-first types, invalidation middleware)
- Implementation choices (swap any layer: database, AI, UI, observability, schema library)
- A validation checklist to verify the pattern is correctly applied

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
