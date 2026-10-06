import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createSkillEvals, runSkillEvals, uxChoiceViolations } from './runSkillEvals.mjs'
import { formatCompanionInstallCommand } from './validateSkills.mjs'

const createdDirs: string[] = []

const FIXTURE_SKILLS = [
	{
		id: 'tanstack-promptable-fullstack-app-template',
		companionSkills: [
			{ id: 'observability-and-env', relationship: 'companion', summary: 'Env and logging companion.' },
			{ id: 'reference-tech-stack', relationship: 'companion', summary: 'Opinionated package map.' },
		],
	},
	{
		id: 'observability-and-env',
		companionSkills: [
			{
				id: 'tanstack-promptable-fullstack-app-template',
				relationship: 'parent',
				summary: 'Architecture parent skill.',
			},
			{ id: 'reference-tech-stack', relationship: 'companion', summary: 'Opinionated package map.' },
		],
	},
	{
		id: 'reference-tech-stack',
		companionSkills: [
			{
				id: 'tanstack-promptable-fullstack-app-template',
				relationship: 'parent',
				summary: 'Architecture parent skill.',
			},
			{ id: 'observability-and-env', relationship: 'companion', summary: 'Env and logging companion.' },
		],
	},
] as const

function fixtureSkillMd(skill: (typeof FIXTURE_SKILLS)[number], extraSections = '') {
	const companions = skill.companionSkills
		.map(
			(companion) =>
				`- **\`${companion.id}\`** (${companion.relationship}) — ${companion.summary}
  \`\`\`bash
  ${formatCompanionInstallCommand(companion.id)}
  \`\`\`
`,
		)
		.join('\n')

	return `---
name: ${skill.id}
description: "**WORKFLOW SKILL** - Fixture for ${skill.id}. USE FOR: ${skill.id} tasks. DO NOT USE FOR: unrelated work. INVOKES: companion skills. FOR SINGLE OPERATIONS: Load the matching companion instead."
license: MIT
---

## Companion skills (install if missing)

${companions}

## Skill routing

${extraSections}`
}

async function createMinimalWorkspace(overrides = {}) {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-eval-'))
	createdDirs.push(rootDir)

	const skillFiles = Object.fromEntries(
		FIXTURE_SKILLS.map((skill) => {
			const extra =
				skill.id === 'tanstack-promptable-fullstack-app-template'
					? '## Fixed vs swappable stack\n'
					: skill.id === 'reference-tech-stack'
						? '## Stack map\n'
						: ''
			return [`.agents/skills/${skill.id}/SKILL.md`, fixtureSkillMd(skill, extra)]
		}),
	)

	const files = {
		'src/env/webEnv.server.ts': 'export const webServerEnv = {}\nexport const shellSession = {}\n',
		'src/utils/logger.ts': 'export function createModuleLogger() {}\n',
		'src/utils/serverLogger.ts': 'export const createServerLogger = () => {}\n',
		'src/start.ts':
			"import { webEnvMiddleware } from './middleware/webEnv'\nexport const startInstance = { requestMiddleware: [webEnvMiddleware] }\n",
		'src/routes/__root.tsx': 'export const loader = () => getBrowserShellSession()\n',
		'src/components/AppLayout/AppLayout.tsx': '{aiAvailable ? <ChatDrawer /> : null}',
		'src/services/api/serverFns.ts':
			'export const x = () => toToolTask(); export const y = () => toToolUserProfile()\nconst trace = createWriteTrace(context.user.email)\nconst updateTrace = updateWriteTrace(context.user.email)\n',
		'src/services/repository/mongoRepository.server.ts':
			'import { parseTaskRepoList, parseDistinctValues, parseUserProfileRepoOrNull } from "../schemas/repoParsers"\nexport class MongoRepository { async getTasks() { return parseTaskRepoList(rows) } async getDistinctValues() { return parseDistinctValues(values) } async updateTask(_id, _input, trace) { return { lastModifiedBy: trace?.lastModifiedBy } } }\n',
		'src/services/repository/seedRepository.ts':
			'export class SeedRepository { async updateTask(_id, _input, trace) { return { lastModifiedBy: trace?.lastModifiedBy } } }\n',
		'src/services/schemas/repository.ts': 'export const TaskRepoSchema = { lastModifiedBy: true }\n',
		'src/services/schemas/schemas.ts': 'export const TaskSchema = { lastModifiedBy: true }\n',
		'src/services/schemas/taskMappers.ts':
			'export const toToolTask = (row) => ({ lastModifiedBy: row.lastModifiedBy })\n',
		'AGENTS.md': '## Skill alignment roadmap\nPhase 3 chat gating is done.\n',
		'src/routes/api/chat.ts': 'chat({ agentLoopStrategy: maxIterations(10) })\n',
		'vite.config.ts': "tanstackStart({ importProtection: { behavior: 'error' } })\n",
		...skillFiles,
		'instrument.env.shared.mts': 'export const DeploymentEnvSchema = {}\n',
		'instrument.env.mts': 'export function resolveSentryBootstrapEnv() {}\n',
		'instrument.shared.mts': 'export function initSentry() {}\n',
		'instrument.server.mts': 'import "./instrument.env.mts"\n',
		'tsconfig.instrument.json': '{}\n',
		'package.json': JSON.stringify({ scripts: { build: 'vite build && tsc -p tsconfig.instrument.json' } }),
		...overrides,
	}

	for (const [relativePath, content] of Object.entries(files)) {
		const target = path.join(rootDir, relativePath)
		await mkdir(path.dirname(target), { recursive: true })
		await writeFile(target, content, 'utf8')
	}

	return rootDir
}

afterEach(async () => {
	await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function formatEvalFailure(result) {
	const files = (result.files ?? []).map((file) => `- ${file}`).join('\n')
	return [result.message, files].filter(Boolean).join('\n')
}

describe('skill contract evals', () => {
	const evals = createSkillEvals()

	it('covers architecture, observability, reference-stack, repository, promptable-ux, and agentic-ux', () => {
		expect(evals.length).toBeGreaterThanOrEqual(10)
		for (const skill of [
			'observability-and-env',
			'tanstack-promptable-fullstack-app-template',
			'reference-tech-stack',
			'repository-architecture',
			'promptable-ux',
			'agentic-ux',
		]) {
			expect(evals.some((evalDef) => evalDef.skill === skill)).toBe(true)
		}
	})

	for (const evalDef of evals) {
		it(`${evalDef.id} (${evalDef.skill})`, async () => {
			const result = await evalDef.run()
			expect(result.pass, formatEvalFailure(result)).toBe(true)
		})
	}
})

describe('runSkillEvals', () => {
	it('fails when process.env leaks into application code', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/bad.ts': 'const x = process.env.SECRET\n',
		})
		await expect(runSkillEvals({ rootDir, logger: { log() {} } })).rejects.toThrow(/Skill evals failed/)
	})

	it('fails when a client-shared module imports a src/env server module', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/components/Bad/Bad.tsx': "import { webServerEnv } from '../../env/webEnv.server'\n",
		})
		await expect(runSkillEvals({ rootDir, logger: { log() {} } })).rejects.toThrow(/Skill evals failed/)
	})

	it('allows inline type-only imports from src/env in client-shared modules', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/components/Ok/Ok.tsx': "import { type WebServerEnv } from '../../env/webEnv.server'\nexport const x = 1\n",
		})
		const evalDef = createSkillEvals(rootDir).find((e) => e.id === 'observability-no-client-env-imports')
		expect(evalDef).toBeDefined()
		const result = await evalDef.run()
		expect(result.pass).toBe(true)
	})

	it('fails when application code imports the database driver outside repository implementations', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/api/rawDriver.ts': "import { MongoClient } from 'mongodb'\n",
		})
		const evalDef = createSkillEvals(rootDir).find((entry) => entry.id === 'repository-driver-confined')
		expect(evalDef).toBeDefined()
		const result = await evalDef?.run()
		expect(result?.pass).toBe(false)
		expect(result?.files).toContain('src/services/api/rawDriver.ts')
	})

	it('fails when repository consumer contracts import the database driver', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/types.ts': "import type { Collection } from 'mongodb'\n",
		})
		const evalDef = createSkillEvals(rootDir).find((entry) => entry.id === 'repository-driver-confined')
		expect(evalDef).toBeDefined()
		const result = await evalDef?.run()
		expect(result?.pass).toBe(false)
		expect(result?.files).toContain('src/services/repository/types.ts')
	})

	it('fails when the mongo facade exists without both collection owners', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/mongoRepository.server.ts': 'export class MongoRepository {}\n',
			'src/services/db/mongoClient.server.ts': 'export const scope = { [Symbol.asyncDispose]: async () => {} }\n',
		})
		const evalDef = createSkillEvals(rootDir).find((entry) => entry.id === 'repository-collection-owners')
		expect(evalDef).toBeDefined()
		const result = await evalDef?.run()
		expect(result?.pass).toBe(false)
		expect(result?.files).toContain('mongoTaskRepository.server.ts')
	})

	it('asks which UX when the experience is not clear', async () => {
		const evalDef = createSkillEvals().find((entry) => entry.id === 'choose-ux-asks-when-unclear')
		expect(evalDef).toBeDefined()
		await expect(evalDef?.run()).resolves.toEqual({ pass: true })
	})

	it('fails the UX eval when a skill picks prompt-first instead of asking', () => {
		const skills = {
			architecture: `## Choose a UX
| **side** | **\`promptable-ux\`** | Domain screens |
| **prompt-first** | **\`promptable-ux\`** | Composer |
| **agentic** | **\`agentic-ux\`** | Thin shell |
When the app already sets PROMPT_CONCEPT, keep that declaration.
When it is not clear which user experience to implement, ask which of the three and wait.
Do not pick one.
## Next
`,
			promptable: `When it is not clear which user experience to implement, ask which of the three and wait. Do not pick one.`,
			agentic: `When it is not clear which user experience to implement, ask which of the three and wait. Do not build this shell as a fallback.`,
		}
		expect(uxChoiceViolations(skills)).toEqual([])
		expect(
			uxChoiceViolations({
				...skills,
				architecture: skills.architecture.replace(
					'Do not pick one.',
					'If the user does not choose, use **prompt-first**.',
				),
			}).join('\n'),
		).toMatch(/defaults to prompt-first/)
		expect(
			uxChoiceViolations({
				...skills,
				promptable: 'When the preference is unclear, use **prompt-first**.',
			}).join('\n'),
		).toMatch(/picks an experience when the preference is unclear/)
		expect(
			uxChoiceViolations({
				...skills,
				agentic: 'Build the agentic shell.',
			}).join('\n'),
		).toMatch(/agentic-ux must ask which of the three/)
	})

	it('fails when mongo repository casts TaskRepo results', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/mongoRepository.server.ts': 'return col.find() as Promise<TaskRepo[]>\n',
		})
		await expect(runSkillEvals({ rootDir, logger: { log() {} } })).rejects.toThrow(/Skill evals failed/)
	})
})
