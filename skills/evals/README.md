# Skill evals

Automated static checks that validate the **example app** against the generated skills. Run locally or in CI via `pnpm test:skill-evals`.

## Commands

```bash
pnpm test:skill-evals          # all evals (architecture + observability)
pnpm test:skill-evals -- --skill observability-and-env
pnpm test:skill-evals -- --skill tanstack-promptable-fullstack-app-template
```

`pnpm lint` also runs skill evals after `skills:check`.

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
- Bounded agent loop in `chat.ts`
- `importProtection` in `vite.config.ts`
- Generated skills include **Skill routing** tables and **Companion skills (install if missing)** sections

## Manual pressure scenarios

See also `tanstack-promptable-fullstack-app-template.md` for prompt-based review scenarios (entity scaffold, loader refactor, markdown surface, etc.).
