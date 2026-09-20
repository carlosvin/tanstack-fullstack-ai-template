import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { formatCompanionInstallCommand, loadSkills, parseSkillMarkdown, validateSkills } from './validateSkills.mjs'

const createdDirs: string[] = []

async function createWorkspace(skills: Record<string, string>) {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), 'agent-skill-'))
	createdDirs.push(rootDir)
	for (const [id, contents] of Object.entries(skills)) {
		const dir = path.join(rootDir, '.agents', 'skills', id)
		await mkdir(dir, { recursive: true })
		await writeFile(path.join(dir, 'SKILL.md'), contents, 'utf8')
	}
	return rootDir
}

function skillMd(name: string, extraBody = '', extras: { description?: string; extraFrontmatter?: string } = {}) {
	const description =
		extras.description ??
		`Use this skill for ${name} tasks. Install with npx skills add carlosvin/tanstack-fullstack-ai-template --skill ${name}.`
	return `---
name: ${name}
description: ${description}
license: MIT
${extras.extraFrontmatter ?? ''}---

## Companion skills (install if missing)

${extraBody}
`
}

afterEach(async () => {
	await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

const reciprocalPair = {
	'alpha-skill': skillMd(
		'alpha-skill',
		`- **\`beta-skill\`** (companion) — Pair skill.
  \`\`\`bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill beta-skill
  \`\`\`
`,
	),
	'beta-skill': skillMd(
		'beta-skill',
		`- **\`alpha-skill\`** (companion) — Pair skill.
  \`\`\`bash
  npx skills add carlosvin/tanstack-fullstack-ai-template --skill alpha-skill
  \`\`\`
`,
	),
}

describe('validateSkills', () => {
	it('accepts agentskills.io SKILL.md folders', async () => {
		const rootDir = await createWorkspace(reciprocalPair)
		const skills = await validateSkills({ rootDir, logger: { log() {} } })
		expect(skills.map((skill) => skill.id).sort()).toEqual(['alpha-skill', 'beta-skill'])
	})

	it('rejects unknown frontmatter fields', () => {
		expect(() =>
			parseSkillMarkdown(
				`---
name: example-skill
description: A valid description for the example skill used in tests.
id: example-skill
---

Body
`,
				{ directoryName: 'example-skill', relativePath: '.agents/skills/example-skill/SKILL.md' },
			),
		).toThrow(/unknown frontmatter field/)
	})

	it('rejects descriptions longer than 1024 characters', () => {
		const description = 'x'.repeat(1025)
		expect(() =>
			parseSkillMarkdown(
				`---
name: example-skill
description: "${description}"
---

Body
`,
				{ directoryName: 'example-skill', relativePath: '.agents/skills/example-skill/SKILL.md' },
			),
		).toThrow(/exceeds 1024 characters/)
	})

	it('rejects a name that does not match the directory', () => {
		expect(() =>
			parseSkillMarkdown(
				`---
name: other-name
description: A valid description for the example skill used in tests.
---

Body
`,
				{ directoryName: 'example-skill', relativePath: '.agents/skills/example-skill/SKILL.md' },
			),
		).toThrow(/must match the parent directory/)
	})

	it('fails when companion skills are not reciprocal', async () => {
		const rootDir = await createWorkspace({
			'alpha-skill': reciprocalPair['alpha-skill'],
			'beta-skill': skillMd('beta-skill', 'No companions listed.\n'),
		})
		await expect(loadSkills({ rootDir })).rejects.toThrow(/Companion skill reciprocity failed/)
	})

	it('fails when a companion is missing an npx skills install command', async () => {
		const rootDir = await createWorkspace({
			'alpha-skill': skillMd('alpha-skill', '- **`beta-skill`** (companion) — Pair skill.\n'),
			'beta-skill': skillMd('beta-skill', '- **`alpha-skill`** (companion) — Pair skill.\n'),
		})
		await expect(validateSkills({ rootDir, logger: { log() {} } })).rejects.toThrow(
			/missing npx skills install command/,
		)
	})

	it('formats npx skills install commands', () => {
		expect(formatCompanionInstallCommand('reference-tech-stack')).toBe(
			'npx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack',
		)
		expect(formatCompanionInstallCommand('reference-tech-stack', { global: true })).toContain(' -g')
	})
})
