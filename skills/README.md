# TanStack Promptable Fullstack skills

This repo ships **[Agent Skills](https://agentskills.io)** for the TanStack fullstack template:

- **`tanstack-promptable-fullstack-app-template`** — **architecture contract**: interface-first services, three schema layers, loader-first routes, URL-as-state, AI tool coverage, server/client boundaries, middleware-inferred request context. **UI-library-agnostic** — does not prescribe Mantine or any component kit.
- **`observability-and-env`** — **companion recipe**: centralized env parsing, structured logging + error-tracking bootstrap behind `ObservabilityService`, `webEnvMiddleware`, and `getBrowserShellSession` (no `window.__ENV__`). Reference app uses pino + Sentry; swap vendors without changing handler contracts.

Operational detail that should stay repo-local (UI kit, auth snippets, chat wiring, tests) still lives in **[AGENTS.md](../AGENTS.md)**.

## Which skill to load

| You're working on… | Load |
|--------------------|------|
| New entity, routes, schemas, AI tools, auth, import protection | `tanstack-promptable-fullstack-app-template` |
| Logging, error tracking, `instrument.*.mts`, `src/env/`, env leaks, `shellSession` | `observability-and-env` |
| Both (e.g. server fn that logs and reads `context.serverEnv`) | **Both** — architecture first, then observability |

Keep them **separate** (industry norm: core + focused sub-skill). The parent skill states architecture **invariants** and which stack pieces are **swappable**; companions and AGENTS.md own concrete vendor choices.

**Use them when** you scaffold or extend a TanStack Start app from this pattern, migrate an existing app, or need agents to follow current TanStack docs instead of guessing.

## Published skills

- `tanstack-promptable-fullstack-app-template`: architecture, schema boundaries, routing, server functions, AI tools, and parent layout patterns.
- `observability-and-env`: logging, error-tracking bootstrap, validated env schemas, and runtime config plumbing (reference: pino + Sentry).

## Super quick install

**Recommended:** install **both** skills (architecture + observability companion):

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
```

Or install individually:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
```

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
```

Each generated `SKILL.md` includes a **Companion skills (install if missing)** section with install commands if you only added one skill initially.

Optional: install **globally** so the skills are available in every project:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template -g
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env -g
```

List what this repo publishes, then confirm:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --list
npx skills list
```

## Skill files in this repository

After clone, the generated skill lives here (committed on purpose):

- `.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md` — standard skill document agents load
- `.agents/skills/observability-and-env/SKILL.md` — observability and env companion skill
- `skills/dist/tanstack-promptable-fullstack-app-template.md` — portable copy for docs or paste
- `skills/dist/observability-and-env.md` — portable copy for docs or paste
- `skills/registry.json` — machine-readable manifest

## Other install options

- **One-shot installer** (Cursor, Windsurf, Claude Code global dirs): see the root [README.md](../README.md#use-the-agent-skill).
- **Manual copy**: copy the folder `.agents/skills/tanstack-promptable-fullstack-app-template/` into your tool's skills directory (for example `~/.cursor/skills/`).

## Try it

Paste one of these into your agent after install:

- "Follow this repo's TanStack fullstack skill: what are the core contract items I must not violate?"
- "Add a new domain entity using the template's schema layers, repository, server functions, routes, and AI tools."
- "Review my nested routes: shared `beforeLoad` / loaders should live on the parent layout — what should move?"

## Contributors

To edit or regenerate the skill from YAML, see **[AUTHORING.md](./AUTHORING.md)**.
