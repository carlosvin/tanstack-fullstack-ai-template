import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createSkillEvals, runSkillEvals } from './runSkillEvals.mjs'

const createdDirs: string[] = []

async function createMinimalWorkspace(overrides = {}) {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-eval-'))
	createdDirs.push(rootDir)

	const files = {
		'src/env/webEnv.ts': 'export const webServerEnv = {}\nexport const shellSession = {}\n',
		'src/utils/logger.ts': 'export function createModuleLogger() {}\n',
		'src/utils/serverLogger.ts': 'export const createServerLogger = () => {}\n',
		'src/start.ts':
			"import { webEnvMiddleware } from './middleware/webEnv'\nexport const startInstance = { requestMiddleware: [webEnvMiddleware] }\n",
		'src/routes/__root.tsx': 'export const loader = () => getBrowserShellSession()\n',
		'src/components/AppLayout/AppLayout.tsx': '{aiAvailable ? <ChatDrawer /> : null}',
		'src/services/api/serverFns.ts':
			'export const x = () => toToolTask(); export const y = () => toToolUserProfile()\nconst trace = createWriteTrace(context.user.email)\nconst updateTrace = updateWriteTrace(context.user.email)\n',
		'src/services/repository/mongoRepository.server.ts':
			'import { parseTaskRepo, parseUserProfileRepoOrNull } from "../schemas/repoParsers"\nexport class MongoRepository { async getTasks() { return rows.map(parseTaskRepo) } async updateTask(_id, _input, trace) { return { lastModifiedBy: trace?.lastModifiedBy } } }\n',
		'src/services/repository/seedRepository.ts':
			'export class SeedRepository { async updateTask(_id, _input, trace) { return { lastModifiedBy: trace?.lastModifiedBy } } }\n',
		'src/services/schemas/repository.ts': 'export const TaskRepoSchema = { lastModifiedBy: true }\n',
		'src/services/schemas/schemas.ts': 'export const TaskSchema = { lastModifiedBy: true }\n',
		'src/services/schemas/taskMappers.ts':
			'export const toToolTask = (row) => ({ lastModifiedBy: row.lastModifiedBy })\n',
		'AGENTS.md': '## Skill alignment roadmap\nPhase 3 chat gating is done.\n',
		'src/routes/api/chat.ts': 'chat({ agentLoopStrategy: maxIterations(10) })\n',
		'vite.config.ts': "tanstackStart({ importProtection: { behavior: 'error' } })\n",
		'.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md':
			'## Skill routing\n## Companion skills (install if missing)\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack\n',
		'.agents/skills/observability-and-env/SKILL.md':
			'## Skill routing\n## Companion skills (install if missing)\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill reference-tech-stack\n',
		'.agents/skills/reference-tech-stack/SKILL.md':
			'## Skill routing\n## Companion skills (install if missing)\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill tanstack-promptable-fullstack-app-template\nnpx skills add carlosvin/tanstack-fullstack-ai-template --skill observability-and-env\n',
		'skills/registry.json': JSON.stringify({
			skills: [
				{
					id: 'tanstack-promptable-fullstack-app-template',
					companionSkills: [
						{ id: 'observability-and-env' },
						{ id: 'reference-tech-stack' },
					],
				},
				{
					id: 'observability-and-env',
					companionSkills: [
						{ id: 'tanstack-promptable-fullstack-app-template' },
						{ id: 'reference-tech-stack' },
					],
				},
				{
					id: 'reference-tech-stack',
					companionSkills: [
						{ id: 'tanstack-promptable-fullstack-app-template' },
						{ id: 'observability-and-env' },
					],
				},
			],
		}),
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

describe('runSkillEvals', () => {
	it('exposes architecture and observability eval suites', () => {
		const evals = createSkillEvals()
		expect(evals.length).toBeGreaterThanOrEqual(10)
		expect(evals.some((evalDef) => evalDef.skill === 'observability-and-env')).toBe(true)
		expect(evals.some((evalDef) => evalDef.skill === 'tanstack-promptable-fullstack-app-template')).toBe(true)
	})

	it('passes on the real workspace', async () => {
		await expect(runSkillEvals({ logger: { log() {} } })).resolves.toBeDefined()
	})

	it('fails when process.env leaks into application code', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/bad.ts': 'const x = process.env.SECRET\n',
		})
		await expect(runSkillEvals({ rootDir, logger: { log() {} } })).rejects.toThrow(/Skill evals failed/)
	})

	it('fails when mongo repository casts TaskRepo results', async () => {
		const rootDir = await createMinimalWorkspace({
			'src/services/repository/mongoRepository.server.ts': 'return col.find() as Promise<TaskRepo[]>\n',
		})
		await expect(runSkillEvals({ rootDir, logger: { log() {} } })).rejects.toThrow(/Skill evals failed/)
	})
})
