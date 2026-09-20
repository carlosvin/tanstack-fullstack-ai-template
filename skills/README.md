# TanStack Promptable Fullstack skills

This repo ships **[Agent Skills](https://agentskills.io)** — one `SKILL.md` per skill directory, nothing else.

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

## Install with `npx skills`

[skills](https://github.com/vercel-labs/skills) copies Agent Skills from this GitHub repo into your agent’s skills directory (Cursor, Claude Code, Codex, Windsurf, and others).

Install **all** skills from this repo:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template
```

Or install one skill:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
npx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env
npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack
```

List what this repo publishes:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --list
npx skills list
```

Optional: install **globally** (`-g`) so the skills are available in every project:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template -g
```

Target a specific agent with `-a` / `--agent` (for example `cursor`, `claude-code`, `codex`). See `npx skills add --help`.

Each `SKILL.md` includes a **Companion skills (install if missing)** section with `npx skills` commands if you only added one skill initially.

### Similar installers

```bash
gh skill install carlosvin/tanstack-fullstack-ai-template
```

Using **this repo as-is:** agents that read `.agents/skills/` (Cursor, Codex, Windsurf, and other agentskills.io clients) already see the skills — no extra step.

Manual copy: copy `.agents/skills/<id>/` into your tool’s skills directory (for example `~/.cursor/skills/`).

## Skill files in this repository

Author and commit these files — they are the contract, not generated output:

- `.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md`
- `.agents/skills/observability-and-env/SKILL.md`
- `.agents/skills/reference-tech-stack/SKILL.md`

Format: [agentskills.io specification](https://agentskills.io/specification) (`name` + `description` frontmatter; directory name matches `name`).

## Try it

Paste one of these into your agent after install:

- "Follow this repo's TanStack fullstack skill: what are the core contract items I must not violate?"
- "Add a new domain entity using the template's schema layers, repository, server functions, routes, and AI tools."
- "What UI library and validator does the reference tech stack skill pick for this template?"
- "Review my nested routes: shared `beforeLoad` / loaders should live on the parent layout — what should move?"

## Contributors

To edit or validate skills, see **[AUTHORING.md](./AUTHORING.md)**.
