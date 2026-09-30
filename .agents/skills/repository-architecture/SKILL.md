---
name: repository-architecture
description: >-
  **WORKFLOW SKILL** - Language-agnostic repository architecture for injected
  class-based repositories that own database and external-system access.

  USE FOR: repository architecture, collection repository, stale-data cleanup,
  resource lifetime, injected repository contract.

  DO NOT USE FOR: TanStack routes schemas or AI tools (use
  tanstack-promptable-fullstack-app-template), env parse or logger factories
  (use observability-and-env), template package lookup (use
  reference-tech-stack).

  INVOKES: repository interfaces, collection owners, composition-root
  injection, and companion skills.

  FOR SINGLE OPERATIONS: Load this skill for repository ownership and
  lifetime; load the parent architecture skill for TanStack wiring.
license: MIT
metadata:
  author: Carlos Martin-Sanchez
  version: "1.0.0"
  repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
---

## Companion skills (install if missing)

This template publishes **multiple** skills. If only **this** skill is installed, add companions **before** related work:

- **`tanstack-promptable-fullstack-app-template`** (parent) — TanStack architecture contract: schema layers, server functions, AI tools, and middleware-inferred request context. Install for route and tool wiring around a repository.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
  ```

- **`observability-and-env`** (companion) — Env parse, logger factories, and error-tracking bootstrap. Install when repository setup must read validated env instead of `process.env`.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
  ```

- **`reference-tech-stack`** (companion) — Opinionated packages for this template's reference app, including the database driver. Install when matching the demo stack.
  ```bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
  ```

Discover all skills: `npx skills add carlosvin/tanstack-fullstack-ai-template --list`

# Repository architecture

Use this skill when application or pipeline code reaches into database collections, HTTP clients, or other external systems directly, or when a large repository needs smaller, cohesive collection-level responsibilities.

The examples are **language-agnostic patterns shown in TypeScript** (MongoDB driver + a runtime schema library). They are illustrative, not a required dependency. Translate them to the project's language, driver, and validation library. Resource lifetime uses the same ownership rules in Java (`AutoCloseable` / try-with-resources), Python (context-manager magic methods), and other runtimes with deterministic cleanup.

In this TanStack template, schema layers, server functions, and AI tools stay in the parent skill **`tanstack-promptable-fullstack-app-template`**. This skill owns how repository classes are split, injected, indexed, cleaned up, and disposed.

## Skill routing

| Task | Load |
|------|------|
| Collection repositories, indexes, stale-data cleanup, resource lifetime, composition root | **This skill** |
| TanStack routes, schema layers, server functions, AI tools, auth ticket | **`tanstack-promptable-fullstack-app-template`** |
| Env schemas, logger factories, error-tracking bootstrap | **`observability-and-env`** |
| Which database driver or validator this template uses | **`reference-tech-stack`** |
| File paths in this repo | **AGENTS.md** §6 |

## Boundary and ownership

```
UI / pipeline steps / CLI / AI tools
            |
      application API or orchestration
            |
    injected domain interfaces
            |
  domain repository implementation
            |
 collection repositories / external adapters
            |
    database driver / HTTP client
```

- Business code asks for domain operations, not a driver, collection, cursor, query, bulk-write operation, or loader that exposes them. In web apps, route/AI layers call authenticated server functions; those functions invoke repositories. Pipeline steps may use injected repository interfaces directly.
- Define interfaces around consumers' use cases; implement them with classes. Construct concrete implementations at a composition root and inject interfaces into steps/services. Do not add `Db | Repository` unions, runtime type detection, or backwards-compatibility adapters to perpetuate the old path.
- Keep the database connection or external client private to the composition root and implementations. A repository method should express intent (for example `cleanupStale(runId, window)`), never return a collection or expose an arbitrary query escape hatch.
- Separate cohesive domains (for example inventory, billing, identity). Where one domain spans several collections, compose smaller collection repositories behind a domain facade. Each child owns its schema mapping, queries, writes, indexes, and relevant stale-data policy. Group tightly related collections when the same invariant spans them; do not force one class per table.
- The domain facade exposes readonly child interfaces if consumers genuinely need them, plus domain-level operations that coordinate them. It delegates rather than recreating driver queries. Avoid bypassing the facade to import concrete children into business code.
- Put calls to other external systems behind their own adapters/repositories too. An HTTP client that fetches records and a database repository that persists them have different responsibilities; do not bury orchestration or business calculations in either.

## Contracts and data safety

- Accept immutable inputs (`readonly T[]`, `Readonly<Options>`, readonly properties) and return domain shapes rather than driver documents. Define serializable shapes with the project's runtime schema system when available and validate at inbound/external boundaries.
- Bind each collection once as a private constructor property. Only implementation modules and small implementation-private bulk helpers should use driver primitives.
- Each owner defines its own `createIndexes()` alongside the queries requiring those indexes. The composition root invokes initialization; a domain facade delegates to its children. Index creation must be safe to repeat. Do not copy index specifications into CLI scripts or pipeline steps.
- Put inserts, upserts, deletes, run-window filters, and stale-record cleanup in the owning repository. A step determines *when* a complete refresh has succeeded; the repository determines *how* records are swept. Scope destructive cleanup to the intended source and refresh window; never sweep after a failed, partial, or invalid extraction. Test the guard as well as the filter.
- Surface failures to the caller; do not replace a failed read with an empty success, silently skip failed writes, or catch broadly without rethrowing/reporting. An empty successful extract and a failed extract are not interchangeable.

### Example: collection owner and domain facade

```ts
import type { Collection, Db } from 'mongodb'
import { z } from 'zod'

interface IndexableRepository {
  createIndexes(): Promise<void>
}

const SnapshotSchema = z.object({
  key: z.string().describe('Stable key within a source and period'),
  source: z.string().describe('Origin of the refreshed data'),
  period: z.string().describe('Refreshed reporting period'),
  sourceRunId: z.string().describe('Run that last wrote this snapshot'),
}).describe('Snapshot persisted by a full-refresh sync')
type Snapshot = z.infer<typeof SnapshotSchema>
type CleanupScope = Readonly<Pick<Snapshot, 'source' | 'period' | 'sourceRunId'>>

interface SnapshotRepository extends IndexableRepository {
  upsert(rows: readonly Readonly<Snapshot>[]): Promise<number>
  cleanupStale(scope: CleanupScope): Promise<number>
}

class MongoSnapshotRepository implements SnapshotRepository {
  private readonly collection: Collection<Snapshot>

  constructor(db: Db) {
    this.collection = db.collection<Snapshot>('snapshots')
  }

  async createIndexes(): Promise<void> {
    await this.collection.createIndex({ source: 1, period: 1, key: 1 }, { unique: true })
  }

  async upsert(rows: readonly Readonly<Snapshot>[]): Promise<number> {
    if (rows.length === 0) return 0
    const result = await this.collection.bulkWrite(
      rows.map(row => ({
        updateOne: {
          filter: { source: row.source, period: row.period, key: row.key },
          update: { $set: row },
          upsert: true,
        },
      }))
    )
    return result.upsertedCount + result.modifiedCount
  }

  async cleanupStale(scope: CleanupScope): Promise<number> {
    const result = await this.collection.deleteMany({
      source: scope.source,
      period: scope.period,
      sourceRunId: { $ne: scope.sourceRunId },
    })
    return result.deletedCount
  }
}

interface InventoryRepository extends IndexableRepository {
  readonly snapshots: SnapshotRepository
}

class MongoInventoryRepository implements InventoryRepository {
  readonly snapshots: SnapshotRepository

  constructor(db: Db) {
    this.snapshots = new MongoSnapshotRepository(db)
  }

  async createIndexes(): Promise<void> {
    await this.snapshots.createIndexes()
  }
}
```

The caller invokes `cleanupStale` only after successfully fetching, validating, and upserting the *complete* source/period. Validate external rows with the snapshot schema (`parse` or `safeParse`) at the ingestion boundary; index and sweep predicates must agree on the source/period partition.

**Avoid:** `loader.collection('snapshots').drop()`, `db.collection('snapshots').createIndex(...)` in a pipeline step, or a facade that forwards `getCollection()` to callers.

## Resource lifetime is not data cleanup

- Use `AsyncDisposable` and `await using` when the TypeScript target/runtime support explicit resource management. The scope that **owns** a connection closes it with `[Symbol.asyncDispose]()`; borrowed `Db`, collections, and injected clients must not close the shared connection. Do not require no-op disposal methods on every child merely for symmetry.
- If a child owns a resource, its parent disposes that child before closing its own resource. Decide whether siblings can be disposed concurrently; preserve the original failure while still attempting necessary cleanup. On initialization failure, dispose already-acquired resources before rethrowing.
- `cleanupStale(...)` deletes persisted records as part of a successful sync; `[Symbol.asyncDispose]()` releases connections and other owned resources on scope exit. **Never perform stale-data deletion in a disposer.**

```ts
import type { Db, MongoClient } from 'mongodb'

class RepositoryScope implements AsyncDisposable {
  readonly inventory: InventoryRepository

  constructor(private readonly client: MongoClient, db: Db) {
    this.inventory = new MongoInventoryRepository(db)
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.client.close()
  }
}

await using repositories = await createRepositoryScope(config)
await syncInventory(repositories.inventory)
```

The factory should connect, construct, and initialize repositories; if initialization fails, it must close the owned client before propagating the failure. Where `await using` is unavailable, use the equivalent `try/finally` with the same ownership rules.

### Same ownership in other languages

| Concern | TypeScript | Java | Python |
|---------|------------|------|--------|
| Who closes the connection | The scope that **owns** the client, via `[Symbol.asyncDispose]()` | The scope that **owns** the client, via `AutoCloseable.close()` | The scope that **owns** the client, via `__exit__` or `__aexit__` |
| Caller syntax | `await using` | try-with-resources | `with` / `async with` |
| Borrowed handle | Must not close the shared client | Must not close the shared client | Must not close the shared client |
| Stale rows | `cleanupStale(...)` after a successful full refresh | Same method; never inside `close()` | Same method; never inside `__exit__` / `__aexit__` |

**Java.** Implement `AutoCloseable` (or `Closeable`) on the owning scope and close the client in `close()`. Try-with-resources is the caller syntax. A child that owns a resource is closed before the parent closes its own. Initialization failure still closes what was already acquired.

```java
final class RepositoryScope implements AutoCloseable {
  final InventoryRepository inventory;
  private final MongoClient client;

  RepositoryScope(MongoClient client, InventoryRepository inventory) {
    this.client = client;
    this.inventory = inventory;
  }

  @Override
  public void close() {
    client.close();
  }
}

try (RepositoryScope repositories = createRepositoryScope(config)) {
  syncInventory(repositories.inventory);
}
```

**Python.** Use the context-manager protocol. Synchronous owners implement `__enter__` and `__exit__`; asynchronous owners implement `__aenter__` and `__aexit__`. Returning a false-y value from the exit method preserves the original failure. Do not delete persisted rows from either magic method.

```python
class RepositoryScope:
    def __init__(self, client, inventory):
        self._client = client
        self.inventory = inventory

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self._client.close()
        return False

async with await create_repository_scope(config) as repositories:
    await sync_inventory(repositories.inventory)
```

**Other runtimes.** Use that language's deterministic cleanup — C# `IAsyncDisposable` and `await using`, Go `defer`, Rust `Drop` — with the same split: the disposer releases connections and file handles; a repository method sweeps stale records only after a successful refresh.

## Migration and verification workflow

1. Inventory every use of direct driver access, legacy loaders, index definitions, cleanup calls, and connection closure. Identify which system and collection owns each operation.
2. Define focused interfaces and readonly inputs; implement collection owners, compose domain facades, and create a single composition root. Move index definitions and query/write/cleanup details behind the owning implementations.
3. Inject interfaces into every caller (including CLI, tests, server functions, and AI-facing capabilities). Remove obsolete loaders, duplicate helpers, imports, union-type shims, and now-unused configuration. Keep external-system access out of route and AI-tool modules.
4. Test repositories against representative database behavior: index initialization, upserts, filters, counts, safe stale sweeps, failure propagation, and owned-resource disposal including initialization failure. Test steps with typed in-memory/fake repositories rather than mocking cursor chains.
5. Run targeted unit and type/lint checks, then the real pipeline or application flow with a safe test/local environment. Confirm the complete refresh, cleanup guards, error path, and UI/API behavior as relevant. Never publish environment files or credentials in examples or logs.

Before finishing, search the changed feature for remaining direct `collection`, driver-client, raw HTTP client, and legacy-loader access outside repository implementations. Explain intentional exceptions (such as the composition root), and update the project's architectural instructions to reflect the actual boundaries.
