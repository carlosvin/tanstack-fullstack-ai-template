# Skill evals

Automated static checks that validate the **example app** against the Agent Skills in `.agents/skills/`. Run locally or in CI via `pnpm test:skill-evals`.

## Commands

```bash
pnpm test:skill-evals          # all evals
pnpm test:skill-evals -- --skill observability-and-env
pnpm test:skill-evals -- --skill tanstack-promptable-fullstack-app-template
pnpm test:skill-evals -- --skill reference-tech-stack
pnpm test:skill-evals -- --skill repository-architecture
pnpm test:skill-evals -- --skill promptable-ux
```

`pnpm lint` also runs skill evals after `skills:check`.

## Waza (Agent Skills compliance)

[Waza](https://microsoft.github.io/waza/) validates authored `.agents/skills/*/SKILL.md` files (frontmatter, token budget, links) and checks that `evals/<skill-id>/` tasks cover `USE FOR` / `DO NOT USE FOR` phrases.

```bash
pnpm skills:waza    # waza check + spec verify + mock run
```

CI runs this in `.github/workflows/skills.yml` with a pinned `waza` binary. Config lives in `.waza.yaml`. Suites use the **mock** executor so PRs do not need model API keys.

## What is checked

### `observability-and-env`

- `process.env` only in `src/env/*.ts` and `instrument.env.mts`
- No `window.__ENV__`
- Logger factories do not read `process.env`
- `instrument.*.mts` bootstrap files + build script
- `webEnvMiddleware` registered in `start.ts`
- Root loader calls `getBrowserShellSession()`

### `tanstack-promptable-fullstack-app-template`

- No DB/repo/`process.env` in route files
- `createServerFn` centralized in `serverFns.ts`
- `MongoRepository` uses `parseTaskRepo` (no casts)
- `serverFns` maps outbound rows via `toToolTask` / `toToolUserProfile`
- No middleware context casts or runtime guards
- AI chat gated on `getAIAvailability`
- Writes use `TraceabilityContext` helpers; repos persist `createdBy` / `lastModifiedBy`
- AGENTS.md does not claim chat UI always renders
- Bounded agent loop in `chat.ts`
- `importProtection` in `vite.config.ts`
- Agent Skills companion reciprocity and `npx skills` install commands (`pnpm skills:check`)
- Architecture skill documents **Fixed vs swappable stack** and stays vendor-agnostic in prose

### `reference-tech-stack`

- `SKILL.md` includes a **Stack map** section

### `repository-architecture`

- Skill documents boundary ownership, runtime validators (including Pydantic) and decode-into-the-type for strongly typed languages, that disposers release resources, that `cleanupStale` sweeps rows, Java `AutoCloseable`, and Python `__aexit__`
- Parent architecture skill lists `repository-architecture` as a companion
- Database driver imports stay in `src/services/db/` and `src/services/repository/`
- Task and user collections are private owners with their own indexes; the Mongo scope disposes the client and does not sweep rows

### `promptable-ux`

- Skill defines **Promptable UI (side)** and **Prompt-first**, with mobile first in the shared section
- Architecture skill points at `promptable-ux` and does not own the mobile-first essay
- `AppLayout` declares Promptable UI (side)
- AGENTS.md names both concepts and still asks the developer before switching

## Manual pressure scenarios

See also `tanstack-promptable-fullstack-app-template.md` for prompt-based review scenarios (entity scaffold, loader refactor, markdown surface, etc.) and `promptable-ux.md` for the two prompt concepts.
