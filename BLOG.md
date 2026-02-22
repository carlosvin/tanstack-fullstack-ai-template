# Building AI-Promptable Full-Stack Apps: A Reproducible Architecture

Every time our team started a new internal tool, we faced the same problem: rebuild the same architecture from scratch. Authentication, database access, UI shell, AI integration — all the plumbing that has nothing to do with the actual business logic.

After building several applications this way, we extracted the common patterns into a template. This post explains the architecture and the reasoning behind each decision.

## The Problem

Internal tools share a remarkable amount of infrastructure:

- A database-backed API with CRUD operations
- Authentication from a JWT in request headers
- A component library with dark/light mode
- Error monitoring and performance tracing
- Increasingly, an AI assistant that can query the data

Yet every project starts from `npm init` and rebuilds all of this. The code looks similar but is never quite the same, making it hard to maintain patterns across a growing portfolio of tools.

## The Stack

We chose [TanStack Start](https://tanstack.com/start) as the foundation — a full-stack React meta-framework that gives us:

- **Server functions** (`createServerFn`) that act as type-safe RPC endpoints
- **File-based routing** with TanStack Router
- **SSR** via Nitro, deployable anywhere
- **Middleware** that runs on every request, perfect for auth

For the UI, [Mantine](https://mantine.dev/) gives us 120+ production-ready components, dark/light mode out of the box, and a theme system that keeps things consistent without writing custom CSS.

For AI, [TanStack AI](https://tanstack.com/ai) provides a unified interface across OpenAI, Anthropic, Gemini, and more — with first-class support for tool calling and streaming.

## Architecture: Everything Behind an Interface

The core principle is simple: **every external service is accessed through an interface**. This makes each piece swappable without touching application code.

### The Repository Pattern

All data access goes through a `ReadRepository` + `WritableRepository` interface:

```typescript
export interface ReadRepository {
  getTasks(filter?: TaskFilter): Promise<Task[]>
  getTask(taskId: string): Promise<Task | null>
  getAssignees(): Promise<string[]>
}

export interface WritableRepository {
  createTask(input: TaskInput, createdBy?: string): Promise<Task>
  updateTask(taskId: string, input: Partial<TaskInput>): Promise<Task | null>
  deleteTask(taskId: string): Promise<boolean>
}
```

Two implementations ship with the template:

1. **SeedRepository** — in-memory with sample data. Zero configuration, works instantly.
2. **MongoRepository** — production MongoDB implementation.

A factory function auto-detects which to use based on whether `MONGODB_URI` is set. For development, you never need a database.

### Auth via Global Middleware

TanStack Start supports [global middleware](https://tanstack.com/start/latest/docs/framework/react/guide/middleware) — functions that run on every request before any handler executes.

We use this for authentication:

```typescript
// src/middleware/auth.ts
export const authMiddleware = createMiddleware().server(({ next, request }) => {
  const authHeader = request.headers.get(AUTH_HEADER_NAME)
  const identity = extractIdentityFromJwt(authHeader)
  
  const user = identity.email
    ? identity
    : process.env.NODE_ENV !== 'production'
      ? DEV_USER
      : ANONYMOUS_USER

  return next({ context: { user } })
})
```

Registered globally in `src/start.ts`:

```typescript
export default createStart({
  requestMiddleware: [authMiddleware],
})
```

Every server function automatically receives `context.user` — no manual header extraction, no `requireAuth()` boilerplate. Authorization checks become composable middleware that builds on the auth context.

### Promptable by Design

This is the pattern we are most excited about. Every read method in the repository is automatically exposed as an AI tool:

```typescript
const getTasksToolDef = toolDefinition({
  name: 'getTasks',
  description: 'Get all tasks with optional filters...',
  inputSchema: TaskFilterSchema,  // Zod schema with .describe()
})

export const getTasksTool = getTasksToolDef.server(
  args => getReadRepository().getTasks(args)
)
```

Because we use Zod schemas with `.describe()` on every field, the AI model receives rich JSON Schema metadata explaining what each parameter means. The model can then compose tool calls to answer complex queries.

A chat drawer component connected via Server-Sent Events gives users a natural language interface to their data — for free, just by maintaining the repository interface.

### Observability as a Plugin

Monitoring is important but vendor lock-in is not. We define a minimal interface:

```typescript
export interface ObservabilityService {
  startSpan<T>(name: string, fn: () => Promise<T>): Promise<T>
  setUser(user: { email: string; name: string }): void
  captureError(error: unknown): void
}
```

Sentry is the default implementation. If `VITE_SENTRY_DSN` is not set, a no-op implementation is used — the app works perfectly fine without any observability configured. To switch to Datadog, New Relic, or anything else, implement the three methods.

## Zod Schemas as the Single Source of Truth

Every domain type starts as a Zod schema:

```typescript
export const TaskSchema = TaskInputSchema.extend({
  id: z.string().describe('Unique identifier for the task'),
  createdAt: z.string().describe('ISO 8601 timestamp when created'),
  updatedAt: z.string().describe('ISO 8601 timestamp when last updated'),
})

export type Task = z.infer<typeof TaskSchema>
```

This single definition serves four purposes:

1. **TypeScript types** — inferred via `z.infer<>`
2. **Server function validation** — passed to `.inputValidator(Schema)`
3. **AI tool schemas** — converted to JSON Schema automatically
4. **Documentation** — `.describe()` metadata is embedded everywhere

No more maintaining separate interfaces, validation logic, and documentation that inevitably drift apart.

## Getting Started in 30 Seconds

```bash
git clone https://github.com/your-org/tanstack-fullstack-template.git
cd tanstack-fullstack-template
pnpm install
pnpm dev
```

The app starts with seed data — a working task management system with dashboard, list views, detail pages, dark/light mode, and an AI chat drawer. No database, no API keys, no environment variables needed.

When you're ready to connect to a real database, set `MONGODB_URI`. When you want AI chat, set the OpenAI variables. When you want monitoring, set `VITE_SENTRY_DSN`. Each capability layers on independently.

## Extending the Template

Adding a new domain entity is a five-step process:

1. **Zod schema** in `schemas.ts` with `.describe()` annotations
2. **Repository methods** in the interface, then implement in seed and MongoDB
3. **Server functions** wrapping the repository
4. **AI tools** exposing the read methods
5. **Routes** for the UI pages

Because every layer follows the same pattern, adding a new entity takes minutes, not hours.

## Conclusion

The goal is not a framework — it's a **starting point**. Fork the template, replace the Task domain with your own, and you have a production-ready full-stack application with:

- Type-safe server functions
- JWT authentication via middleware
- AI-powered data querying
- Dark/light mode UI
- Swappable database, AI provider, and observability
- Docker-ready deployment

All with zero configuration for local development.

The code is open source. We hope it saves you the same weeks of scaffolding it saved us.

---

*Built with TanStack Start, Mantine, TanStack AI, MongoDB, Zod, Sentry, Vitest, and Biome.*
