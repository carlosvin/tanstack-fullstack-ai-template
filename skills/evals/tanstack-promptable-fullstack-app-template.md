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
