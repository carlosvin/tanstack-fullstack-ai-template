# TanStack Promptable Fullstack skills

This repo ships **[Agent Skills](https://agentskills.io)** for the TanStack fullstack template:

- **`tanstack-promptable-fullstack-app-template`** — **architecture contract**: interface-first services, three schema layers, loader-first routes, URL-as-state, AI tool coverage, server/client boundaries, middleware-inferred request context. **Vendor-agnostic** for UI kits and observability SDKs. **Mobile first** by default; ask the developer if the app should follow a different UX pattern.
- **`observability-and-env`** — **companion recipe**: centralized env parsing, structured logging + error-tracking bootstrap behind `ObservabilityService`, `webEnvMiddleware`, and `getBrowserShellSession` (no `window.__ENV__`).
- **`reference-tech-stack`** — **opinionated defaults** for *this* template: Zod, Mantine, lucide-react, MongoDB + seed, jose JWT, OpenAI adapter, pino + Sentry, react-markdown, Biome, Vitest, Playwright, Netlify.

Operational how-to (file paths, snippets, validation commands) still lives in **[AGENTS.md](../AGENTS.md)**.

## Which skill to load

| You're working on… | Load |
|--------------------|------|
| New entity, routes, schemas, AI tools, auth, import protection | `tanstack-promptable-fullstack-app-template` |
| Logging, error tracking, `instrument.*.mts`, `src/env/`, env leaks, `shellSession` | `observability-and-env` |
| "Which package does this template use?" / match the demo app | `reference-tech-stack` |
| Scaffolding this template as-is | Architecture + `reference-tech-stack` (+ observability when touching env) |

Keep them **separate**. The parent skill states architecture **invariants** and which stack pieces are **swappable**; `reference-tech-stack` names this repo's vendors; `observability-and-env` owns the env/logging setup recipe; AGENTS.md owns day-to-day ops.

**Use them when** you scaffold or extend a TanStack Start app from this pattern, migrate an existing app, or need agents to follow current TanStack docs instead of guessing.

## Published skills

- `tanstack-promptable-fullstack-app-template`: architecture, schema boundaries, routing, server functions, AI tools, and parent layout patterns.
- `observability-and-env`: logging, error-tracking bootstrap, validated env schemas, and runtime config plumbing.
- `reference-tech-stack`: opinionated package map for the reference app.

## Super quick install

**Recommended:** install all three (architecture + observability + reference stack):

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
```

Or install individually:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
```

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
```

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
```

Each generated `SKILL.md` includes a **Companion skills (install if missing)** section with install commands if you only added one skill initially.

Optional: install **globally** so the skills are available in every project:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template -g
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env -g
npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack -g
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
- `.agents/skills/reference-tech-stack/SKILL.md` — opinionated stack map for this template
- `skills/dist/<id>.md` — portable copies for docs or paste
- `skills/registry.json` — machine-readable manifest

## Other install options

- **One-shot installer** (Cursor, Windsurf, Claude Code global dirs): see the root [README.md](../README.md#use-the-agent-skill).
- **Manual copy**: copy the folder `.agents/skills/<id>/` into your tool's skills directory (for example `~/.cursor/skills/`).

## Try it

Paste one of these into your agent after install:

- "Follow this repo's TanStack fullstack skill: what are the core contract items I must not violate?"
- "Add a new domain entity using the template's schema layers, repository, server functions, routes, and AI tools."
- "What UI library and validator does the reference tech stack skill pick for this template?"
- "Review my nested routes: shared `beforeLoad` / loaders should live on the parent layout — what should move?"

## Contributors

To edit or regenerate the skill from YAML, see **[AUTHORING.md](./AUTHORING.md)**.
