# Skill evals

Automated static checks that validate the **example app** against the Agent Skills in `.agents/skills/`. Run locally or in CI via `pnpm test:skill-evals`.

## Commands

```bash
pnpm test:skill-evals          # all evals
pnpm test:skill-evals -- --skill observability-and-env
pnpm test:skill-evals -- --skill tanstack-promptable-fullstack-app-template
pnpm test:skill-evals -- --skill reference-tech-stack
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
- Agent Skills: reciprocal companions, Skill routing, `npx skills` companion install commands
- Architecture skill documents **Fixed vs swappable stack** and stays vendor-agnostic in prose

### `reference-tech-stack`

- `SKILL.md` includes a **Stack map** section

## Manual pressure scenarios

See also `tanstack-promptable-fullstack-app-template.md` for prompt-based review scenarios (entity scaffold, loader refactor, markdown surface, etc.).
