# Skills Authoring Guide

This project stores skills in a vendor-agnostic canonical format and generates platform-specific outputs.

## Canonical Source

- Canonical schema: `skills/spec/skill.schema.json`
- Canonical skill files: `skills/src/*.skill.yaml`

Each canonical file contains:

- Portable metadata (`id`, `title`, `summary`, `version`, `tags`, `triggers`)
- Publication metadata (`author`, `license`, `homepage`, `repository`, `documentationUrl`, `status`, `supportedTools`)
- Structured execution hints (`inputs`, `outputs`, `constraints`, `steps`, `examples`)
- Canonical markdown body in `content`

## Generated Outputs

Generated files are derived from canonical source and should not be edited manually.

| Path | Purpose |
| --- | --- |
| `.agents/skills/<id>/SKILL.md` | [agentskills.io](https://agentskills.io) standard — read natively by Windsurf and any compatible tool |
| `skills/dist/<id>.md` | Portable docs (GitHub, wikis, copy-paste) |
| `skills/registry.json` | Machine-readable manifest for discovery |

Generated outputs are committed on purpose so other projects can consume the skill without running the build pipeline first.

Tools that don't yet read `.agents/skills/` (e.g. Cursor, Claude Code) can use the same `SKILL.md` by copying the skill folder into their tool's directory (e.g. `~/.cursor/skills/` or `.claude/skills/`).

## Commands

```bash
pnpm skills:build   # Validate + generate all outputs
pnpm skills:check   # Validate + fail if generated files drift
```

## Workflow

1. Edit or add a canonical file under `skills/src/`.
2. Run `pnpm skills:build`.
3. Commit both canonical and generated outputs.
4. CI/lint should run `pnpm skills:check` to prevent drift.
