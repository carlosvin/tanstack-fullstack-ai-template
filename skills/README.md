# TanStack Promptable Fullstack skill

This repo ships an **[Agent Skill](https://agentskills.io)** that teaches coding agents the **architecture contract** for this template: interface-first services, three schema layers with explicit parsing at boundaries, loader-first routes, URL-as-state, AI tool coverage, and strong TypeScript inside the typed flow. Operational detail (UI kit, auth snippets, chat wiring, tests) stays in the repo's **[AGENTS.md](../AGENTS.md)** — the skill focuses on **what to enforce**, not every implementation recipe.

**Use it when** you scaffold or extend a TanStack Start app from this pattern, migrate an existing app, or need agents to follow current TanStack docs instead of guessing.

## Super quick install

From any machine with Node/npm:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template
```

Optional: install **globally** so the skill is available in every project:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template -g
```

List what this repo publishes, then confirm:

```bash
npx skills add carlosvin/tanstack-fullstack-ai-template --list
npx skills list
```

## Skill files in this repository

After clone, the generated skill lives here (committed on purpose):

- `.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md` — standard skill document agents load
- `skills/dist/tanstack-promptable-fullstack-app-template.md` — portable copy for docs or paste
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
