# Pressure scenarios — TanStack Promptable Fullstack App Template skill

Lightweight prompts for manual review or future automation. A compliant agent should satisfy **Core Contract + Architecture Checklist** without contradicting **AGENTS.md** operational detail.

## 1. Entity scaffold

**Prompt:** Add a new domain entity quickly (e.g. `Project`) with list + detail routes.

**Expect:** Tools-layer + repository-layer schemas; repository interface + seed + Mongo implementations; GET/POST server functions with correct middleware on mutations; AI tools mirroring repo/server surface; thin routes + page components; at least smoke/unit coverage where the template expects tests.

## 2. Route refactor

**Prompt:** Nested routes repeat the same `beforeLoad` auth check and re-fetch the same parent data in each child loader — fix it.

**Expect:** Shared `beforeLoad` / loader / expensive reads on the **parent** layout route; children use `getRouteApi` / `useLoaderData({ from: ... })` instead of duplicating parent work.

## 3. Metadata / type-safety

**Prompt:** Add a filter enum (e.g. task view) and expose consistent labels/metadata for the AI and UI table.

**Expect:** Closed vocabulary via `z.enum` (often backed by a `const` tuple), `.describe()` on fields, `.meta()` where structured extras are needed, `z.infer<>` — avoid treating loose `as const` object maps as the single source of truth without schema alignment.

## 4. Markdown response surface

**Prompt:** Ensure the assistant can answer with a short summary **table**, a **code snippet**, and **internal markdown links** that navigate inside the app.

**Expect:** Chat UI continues to render assistant messages as **Markdown (GFM)**; internal paths stay navigable via the app’s markdown link handling; implementation details remain per **AGENTS.md §8** (`react-markdown`, `remark-gfm`, styling) — do not “fix” by flattening assistant output to plain text.

## 5. Loader must not call Mongo directly

**Prompt:** In `/tasks` loader, query Mongo directly with `getDb()` — skip server fn overhead.

**Expect:** Refuse; explain that route loaders are **isomorphic** (SSR + client navigations). Use existing `getTasks` from `serverFns.ts` or add a new `createServerFn` there — never import `getDb`, repositories, or DB drivers in route files.

**Baseline rationalizations to watch for (pre-skill):** “Loader ran on SSR so it’s server-only”; “dynamic import in the loader is enough”; “one extra RPC is unnecessary.”

## 6. Secrets must not live in loaders

**Prompt:** Read `process.env.JWT_SECRET` in the route loader for filtering.

**Expect:** Refuse; move secret or env-dependent logic into a `createServerFn` handler or a `.server.ts` helper. Loaders may only call exported server functions.

## 7. Server-only factory vs RPC

**Prompt:** Add a `createServerOnlyFn` factory for the DB client; wire repositories through it.

**Expect:** Use `createServerOnlyFn` for internal singletons that must never be client-callable RPCs. Keep `createServerFn` for reads/writes invoked from loaders, mutations, and AI tools. DB modules use `*.server.ts` or `import '@tanstack/react-start/server-only'` at file top.

## 8. Traceability on writes

**Prompt:** On `updateTask`, pass the editor’s email as a bare string second argument to the repository (skip TraceabilityContext).

**Expect:** Refuse; build a `TraceabilityContext` (`updateWriteTrace(context.user.email)` or `{ lastModifiedBy }`) and have the repository **persist** `lastModifiedBy` on the entity. Do not ignore the `trace` argument in seed/Mongo implementations.
