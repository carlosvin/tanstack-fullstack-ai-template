# TanStack Full-Stack Template

A production-ready full-stack starter template for building **AI-promptable** internal tools and web applications.

Built with [TanStack Start](https://tanstack.com/start), [Mantine](https://mantine.dev/), [TanStack AI](https://tanstack.com/ai), and [MongoDB](https://www.mongodb.com/) — with every external service behind an interface so you can swap implementations without touching application code.

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

```
┌─────────────────────────────────────────────┐
│  Client (React + Mantine)                   │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Routes  │ │ AppShell │ │ Chat Drawer │  │
│  └────┬────┘ └──────────┘ └──────┬──────┘  │
│       │                          │          │
├───────┼──────────────────────────┼──────────┤
│  Global Middleware (auth, observability)     │
├───────┼──────────────────────────┼──────────┤
│  Server Functions                           │
│  ┌────┴────┐                ┌────┴─────┐    │
│  │ Queries │                │ Chat API │    │
│  │  (GET)  │                │  (POST)  │    │
│  └────┬────┘                └────┬─────┘    │
│       │                          │          │
│  ┌────┴──────────────────────────┴─────┐    │
│  │         Repository Interface        │    │
│  ├────────────────┬────────────────────┤    │
│  │  Seed (memory) │   MongoDB          │    │
│  └────────────────┴────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

- **Repository Pattern**: All data access goes through an interface. A seed implementation ships for development; swap to MongoDB (or anything else) via environment variable.
- **Auth via Middleware**: A global TanStack Start middleware extracts JWT identity from headers and provides `context.user` to every server function — no manual auth boilerplate per handler.
- **Promptable by Default**: All read repository methods are exposed as AI tools via TanStack AI. The chat drawer lets users query data in natural language.
- **Observability as a Plugin**: Sentry is behind an `ObservabilityService` interface. No DSN configured? A no-op implementation is used. Want Datadog? Implement the interface.
- **Zod Schemas = Source of Truth**: Every domain type is a Zod schema with `.describe()` metadata. Types are inferred, JSON Schemas flow to AI tools automatically.

## Project Structure

```
src/
├── start.ts                    # Global middleware registration
├── router.tsx                  # Router + client observability
├── middleware/auth.ts          # JWT → context.user
├── routes/                     # File-based routes (pages)
├── components/                 # React components
├── services/
│   ├── schemas/schemas.ts      # Zod schemas (single source of truth)
│   ├── repository/             # Interface + Seed + Mongo implementations
│   ├── api/serverFns.ts        # Server functions (TanStack Start)
│   ├── ai/                     # AI adapter + tool definitions
│   ├── observability/          # Interface + Sentry + no-op
│   └── db/mongoClient.ts       # MongoDB singleton
├── utils/                      # JWT decode, HTTP errors
├── constants/                  # Shared enums
└── test-utils/                 # Vitest helpers
```

## Environment Variables

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
3. **Server Functions**: Add `createServerFn` wrappers in `src/services/api/serverFns.ts`.
4. **AI Tools**: Expose read methods as tools in `src/services/ai/tools.ts`. Update the system prompt.
5. **Routes**: Create route files under `src/routes/`. Use loaders to fetch data.
6. **Tests**: Write unit tests for the seed repository and any new utilities.

### Swapping the Database

Replace `mongoRepository.ts` with your implementation of the `Repository` interface. Update the factory in `getRepository.ts`.

### Swapping the AI Provider

Replace `src/services/ai/adapter.ts` with a different `@tanstack/ai-*` adapter (Anthropic, Gemini, Ollama, etc.).

### Swapping Observability

1. Replace the implementation in `src/services/observability/sentry.ts`.
2. Update `instrument.server.mjs` for server-side init.
3. Update `src/router.tsx` for client-side init.

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
- **Observability**: [Sentry](https://sentry.io/) (behind interface, optional)
- **Testing**: [Vitest](https://vitest.dev/) + Testing Library
- **Linting**: [Biome](https://biomejs.dev/)
- **Server**: [Nitro](https://nitro.build/) (universal JavaScript server)

## License

MIT
