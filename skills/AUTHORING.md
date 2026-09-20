# Skills authoring (contributors)

This project stores skills in a vendor-agnostic canonical format and generates platform-specific outputs.

## Canonical source

- Canonical schema: `skills/spec/skill.schema.json`
- Canonical skill files: `skills/src/*.skill.yaml`

Each canonical file contains:

- Portable metadata (`id`, `title`, `summary`, `version`, `tags`, `triggers`)
- Publication metadata (`author`, `license`, `homepage`, `repository`, `documentationUrl`, `status`, `supportedTools`)
- Structured execution hints (`inputs`, `outputs`, `constraints`, `steps`, `examples`)
- Canonical markdown body in `content`

## Generated outputs

Generated files are derived from canonical source and should not be edited manually.

| Path | Purpose |
| --- | --- |
| `.agents/skills/<id>/SKILL.md` | [agentskills.io](https://agentskills.io) standard — read natively by Windsurf and any compatible tool |
| `skills/dist/<id>.md` | Portable docs (GitHub, wikis, copy-paste) |
| `skills/registry.json` | Machine-readable manifest for discovery |

Generated outputs are committed on purpose so other projects can consume the skill without running the build pipeline first.

Tools that don't yet read `.agents/skills/` (for example Cursor, Claude Code) can use the same `SKILL.md` by copying the skill folder into their tool's directory (for example `~/.cursor/skills/` or `.claude/skills/`).

## Commands

```bash
pnpm skills:build   # Validate + generate all outputs
pnpm skills:check   # Validate + fail if generated files drift
pnpm skills:waza    # Waza readiness + spec coverage + mock eval run
```

`pnpm skills:waza` requires the [Waza](https://microsoft.github.io/waza/) CLI (`waza`). Install with:

```bash
curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash
```

Generated `SKILL.md` descriptions follow [Waza](https://microsoft.github.io/waza/) / Agent Skills rules: `USE FOR`, `DO NOT USE FOR`, `INVOKES`, `FOR SINGLE OPERATIONS`, max 1024 characters, no angle brackets. Configure that routing in the canonical YAML `waza:` block. **Do not put commas inside `doNotUseFor` items** — Waza splits anti-triggers on commas.

CI installs a pinned Waza release and runs this command in `.github/workflows/skills.yml`. Locally, if `waza` is missing the script skips unless `WAZA_REQUIRED=1` or `CI=true`.

## Workflow

1. Edit or add a canonical file under `skills/src/`.
2. Run `pnpm skills:build`.
3. Commit both canonical and generated outputs.
4. CI/lint should run `pnpm skills:check` to prevent drift.

## Skill ↔ example app sync loop

This repo is both the **skill contract** and the **reference app**. They must stay aligned.

| Artifact | Role | Edit? |
| --- | --- | --- |
| `skills/src/*.skill.yaml` | Architectural contract (source of truth) | Yes |
| `.agents/skills/*/SKILL.md`, `skills/dist/`, `skills/registry.json` | Generated from YAML | No — via `pnpm skills:build` |
| `src/` | Reference implementation that must satisfy the contract | Yes |
| `AGENTS.md` | Ops handbook + alignment roadmap (not alternate architecture) | Yes |
| `scripts/skills/runSkillEvals.mjs` | Static app↔skill invariants enforced in CI | Yes when contract changes |

When app and skill disagree, pick one:

1. **Promote app → skill** — the learning is correct; update YAML + evals + bump skill `version`.
2. **Align app → skill** — the contract is correct; fix `src/`.
3. **Carve exception** — mark the pattern optional in the skill and track deferral in the AGENTS roadmap.

### PR checklist (architecture changes)

- [ ] Skill contract changed? → edit YAML, run `pnpm skills:build`, bump skill `version` if Core Contract / checklist changed
- [ ] Example app updated to match (or roadmap exception documented)?
- [ ] Skill eval added/updated for the new invariant?
- [ ] Waza eval task covers new `USE FOR` / `DO NOT USE FOR` phrases (`pnpm skills:waza`)?
- [ ] `AGENTS.md` roadmap status still accurate?
- [ ] Generated artifacts committed?
- [ ] `pnpm lint && pnpm test && pnpm build` green (`lint` includes `skills:check` + skill evals)
