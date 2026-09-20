# Skills authoring (contributors)

This project uses **one** skill standard: **[Agent Skills](https://agentskills.io)**.

Do not add a parallel format (canonical `.skill.yaml`, generated `skills/dist/` markdown, a custom registry schema, or TanStack Intent package skills).

## Source of truth

Each skill is a directory that contains `SKILL.md`:

```
.agents/skills/<name>/SKILL.md
```

`name` in the YAML frontmatter must match the directory name. Required fields are `name` and `description` (max 1024 characters). Optional spec fields: `license`, `compatibility`, `metadata` (string-to-string), `allowed-tools`.

Install instructions for consumers belong in the skill body (**Companion skills (install if missing)**) using `npx skills add carlosvin/tanstack-fullstack-ai-template --skill <id>`.

## Commands

```bash
pnpm skills:check   # Validate .agents/skills/*/SKILL.md against agentskills.io
```

`pnpm lint` runs `skills:check` and the skill evals.

## Workflow

1. Edit `.agents/skills/<id>/SKILL.md` (frontmatter + body).
2. If you add a companion, list it in **both** skills and include the `npx skills` install command.
3. Run `pnpm skills:check`.
4. Commit the `SKILL.md` files.

## Skill ↔ example app sync loop

This repo is both the **skill contract** and the **reference app**. They must stay aligned.

| Artifact | Role | Edit? |
| --- | --- | --- |
| `.agents/skills/*/SKILL.md` | Architectural / stack contract (agentskills.io) | Yes |
| `src/` | Reference implementation that must satisfy the contract | Yes |
| `AGENTS.md` | Ops handbook + alignment roadmap (not alternate architecture) | Yes |
| `scripts/skills/runSkillEvals.mjs` | Static app↔skill invariants enforced in CI | Yes when contract changes |

When app and skill disagree, pick one:

1. **Promote app → skill** — the learning is correct; update `SKILL.md` + evals (bump `metadata.version` if Core Contract / checklist changed).
2. **Align app → skill** — the contract is correct; fix `src/`.
3. **Carve exception** — mark the pattern optional in the skill and track deferral in the AGENTS roadmap.

### PR checklist (architecture changes)

- [ ] Skill contract changed? → edit `SKILL.md`, run `pnpm skills:check`, bump `metadata.version` if Core Contract / checklist changed
- [ ] Example app updated to match (or roadmap exception documented)?
- [ ] Skill eval added/updated for the new invariant?
- [ ] `AGENTS.md` roadmap status still accurate?
- [ ] `pnpm lint && pnpm test && pnpm build` green (`lint` includes `skills:check` + skill evals)
