import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createSkillEvals, type SkillEvalResult, uxChoiceViolations } from './skillEvals'
import { formatCompanionInstallCommand } from './validateSkills.mjs'

const createdDirs: string[] = []

const PUBLISHED_SKILLS = [
	'observability-and-env',
	'tanstack-promptable-fullstack-app-template',
	'promptable-ux',
	'reference-tech-stack',
	'repository-architecture',
	'agentic-ux',
] as const

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

async function createMinimalWorkspace(overrides: Record<string, string> = {}) {
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

	const files: Record<string, string> = {
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

async function runEval(rootDir: string, id: string): Promise<SkillEvalResult> {
	const evalDef = createSkillEvals(rootDir).find((entry) => entry.id === id)
	expect(evalDef, id).toBeDefined()
	return evalDef?.run() ?? { pass: false, message: `Missing eval ${id}` }
}

afterEach(async () => {
	await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function formatEvalFailure(result: SkillEvalResult) {
	if (result.pass) return ''
	const files = (result.files ?? []).map((file) => `- ${file}`).join('\n')
	return [result.message, files].filter(Boolean).join('\n')
}

const workspaceEvals = createSkillEvals()
const skills = [...new Set(workspaceEvals.map((evalDef) => evalDef.skill))]

describe('skill evals', () => {
	it('covers every published skill', () => {
		expect(skills).toEqual([...PUBLISHED_SKILLS])
	})

	for (const skill of skills) {
		describe(skill, () => {
			for (const evalDef of workspaceEvals.filter((entry) => entry.skill === skill)) {
				it(`${evalDef.id}: ${evalDef.description}`, async () => {
					const result = await evalDef.run()
					expect(result.pass, formatEvalFailure(result)).toBe(true)
				})
			}
		})
	}
})

describe('skill eval fixtures', () => {
	it('fails when process.env leaks into application code', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/bad.ts': 'const x = process.env.SECRET\n',
		})
		const result = await runEval(rootDir, 'observability-process-env-centralized')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('src/services/bad.ts')
		}
	})

	it('fails when a client-shared module imports a src/env server module', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/components/Bad/Bad.tsx': "import { webServerEnv } from '../../env/webEnv.server'\n",
		})
		const result = await runEval(rootDir, 'observability-no-client-env-imports')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('src/components/Bad/Bad.tsx')
		}
	})

	it('allows inline type-only imports from src/env in client-shared modules', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/components/Ok/Ok.tsx': "import { type WebServerEnv } from '../../env/webEnv.server'\nexport const x = 1\n",
		})
		const result = await runEval(rootDir, 'observability-no-client-env-imports')
		expect(result.pass).toBe(true)
	})

	it('fails when application code imports the database driver outside repository implementations', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/api/rawDriver.ts': "import { MongoClient } from 'mongodb'\n",
		})
		const result = await runEval(rootDir, 'repository-driver-confined')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('src/services/api/rawDriver.ts')
		}
	})

	it('fails when repository consumer contracts import the database driver', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/types.ts': "import type { Collection } from 'mongodb'\n",
		})
		const result = await runEval(rootDir, 'repository-driver-confined')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('src/services/repository/types.ts')
		}
	})

	it('fails when the mongo facade exists without both collection owners', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/mongoRepository.server.ts': 'export class MongoRepository {}\n',
			'src/services/db/mongoClient.server.ts': 'export const scope = { [Symbol.asyncDispose]: async () => {} }\n',
		})
		const result = await runEval(rootDir, 'repository-collection-owners')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('mongoTaskRepository.server.ts')
		}
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
		).toMatch(/chooses an experience when the choice is missing/)
		expect(
			uxChoiceViolations({
				...skills,
				architecture: `${skills.architecture}\nPrompt-first is the default when no choice is provided.`,
			}).join('\n'),
		).toMatch(/prompt-first is the default/i)
		expect(
			uxChoiceViolations({
				...skills,
				promptable: `${skills.promptable}\nWhen unclear, choose side.`,
			}).join('\n'),
		).toMatch(/choose side/)
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
		const result = await runEval(rootDir, 'architecture-mongo-repo-parse')
		expect(result.pass).toBe(false)
		if (!result.pass) {
			expect(result.files).toContain('src/services/repository/mongoRepository.server.ts')
		}
	})
})
