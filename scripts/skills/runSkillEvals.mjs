import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const PROCESS_ENV_ALLOWED = new Set([
	'src/env/webEnv.ts',
	'src/env/runtimeEnvSchema.ts', // comment-only references allowed
	'instrument.env.mts',
])

const PROCESS_ENV_ALLOWED_PREFIXES = ['e2e/', 'playwright.config.ts', 'instrument.env.test.ts']

async function walkFiles(dir, options = {}) {
	const { extensions = null, ignoreDirs = new Set(['node_modules', '.output', 'dist', '.git']) } = options
	const results = []

	async function walk(currentDir) {
		const entries = await fs.readdir(currentDir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name)
			if (entry.isDirectory()) {
				if (!ignoreDirs.has(entry.name)) {
					await walk(fullPath)
				}
				continue
			}
			if (extensions && !extensions.some((ext) => entry.name.endsWith(ext))) {
				continue
			}
			results.push(fullPath)
		}
	}

	await walk(dir)
	return results
}

function relative(rootDir, filePath) {
	return path.relative(rootDir, filePath).split(path.sep).join('/')
}

function isProcessEnvAllowed(relativePath) {
	if (PROCESS_ENV_ALLOWED.has(relativePath)) return true
	return PROCESS_ENV_ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix) || relativePath.endsWith(prefix))
}

async function readText(filePath) {
	return fs.readFile(filePath, 'utf8')
}

async function collectMatches(rootDir, files, pattern) {
	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g')
	const matches = []
	for (const filePath of files) {
		const content = await readText(filePath)
		if (regex.test(content)) {
			matches.push(relative(rootDir, filePath))
			regex.lastIndex = 0
		}
	}
	return matches
}

function fail(message, files = []) {
	return { pass: false, message, files }
}

function pass() {
	return { pass: true }
}

export function createSkillEvals(rootDir = defaultRootDir) {
	return [
		{
			id: 'observability-process-env-centralized',
			skill: 'observability-and-env',
			description: 'process.env is read only in src/env/*.ts and instrument.env.mts',
			async run() {
				const srcFiles = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx', '.mts'] })
				const violations = []
				for (const filePath of srcFiles) {
					const rel = relative(rootDir, filePath)
					if (isProcessEnvAllowed(rel)) continue
					const content = await readText(filePath)
					if (/process\.env\b/.test(content)) {
						violations.push(rel)
					}
				}
				return violations.length === 0 ? pass() : fail('Unexpected process.env reads in application code', violations)
			},
		},
		{
			id: 'observability-no-window-env',
			skill: 'observability-and-env',
			description: 'No window.__ENV__ global in src/',
			async run() {
				const srcFiles = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx'] })
				const matches = await collectMatches(rootDir, srcFiles, /window\.__ENV__/)
				return matches.length === 0 ? pass() : fail('window.__ENV__ found', matches)
			},
		},
		{
			id: 'observability-logger-no-process-env',
			skill: 'observability-and-env',
			description: 'Logger factories do not read process.env',
			async run() {
				const files = ['src/utils/logger.ts', 'src/utils/serverLogger.ts'].map((f) => path.join(rootDir, f))
				const matches = await collectMatches(rootDir, files, /process\.env\b/)
				return matches.length === 0 ? pass() : fail('Logger modules read process.env', matches)
			},
		},
		{
			id: 'observability-instrument-bootstrap',
			skill: 'observability-and-env',
			description: 'instrument.*.mts bootstrap files exist and build emits .mjs',
			async run() {
				const required = [
					'instrument.env.shared.mts',
					'instrument.env.mts',
					'instrument.shared.mts',
					'instrument.server.mts',
					'tsconfig.instrument.json',
				]
				const missing = []
				for (const file of required) {
					try {
						await fs.access(path.join(rootDir, file))
					} catch {
						missing.push(file)
					}
				}
				if (missing.length > 0) {
					return fail('Missing instrument bootstrap files', missing)
				}
				const pkg = JSON.parse(await readText(path.join(rootDir, 'package.json')))
				if (!pkg.scripts?.build?.includes('tsconfig.instrument.json')) {
					return fail('package.json build script must compile instrument files')
				}
				return pass()
			},
		},
		{
			id: 'observability-web-env-middleware',
			skill: 'observability-and-env',
			description: 'webEnvMiddleware is registered globally in start.ts',
			async run() {
				const start = await readText(path.join(rootDir, 'src/start.ts'))
				if (!/webEnvMiddleware/.test(start) || !/requestMiddleware:\s*\[webEnvMiddleware\]/.test(start)) {
					return fail('src/start.ts must register webEnvMiddleware in requestMiddleware')
				}
				return pass()
			},
		},
		{
			id: 'observability-browser-shell-loader',
			skill: 'observability-and-env',
			description: 'Root loader calls getBrowserShellSession()',
			async run() {
				const root = await readText(path.join(rootDir, 'src/routes/__root.tsx'))
				if (!/getBrowserShellSession\s*\(/.test(root)) {
					return fail('src/routes/__root.tsx must call getBrowserShellSession() in the loader')
				}
				return pass()
			},
		},
		{
			id: 'architecture-no-db-in-routes',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Route files do not import repositories, MongoDB, or process.env',
			async run() {
				const routeFiles = await walkFiles(path.join(rootDir, 'src/routes'), { extensions: ['.ts', '.tsx'] })
				const forbidden = /getRepository|mongodb|process\.env|\/repository\//
				const violations = []
				for (const filePath of routeFiles) {
					const content = await readText(filePath)
					if (forbidden.test(content)) {
						violations.push(relative(rootDir, filePath))
					}
				}
				return violations.length === 0 ? pass() : fail('Route files import DB/repo/env directly', violations)
			},
		},
		{
			id: 'architecture-server-fn-centralized',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'createServerFn is defined only in serverFns.ts',
			async run() {
				const srcFiles = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx'] })
				const violations = []
				for (const filePath of srcFiles) {
					const rel = relative(rootDir, filePath)
					if (rel === 'src/services/api/serverFns.ts' || rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) {
						continue
					}
					const content = await readText(filePath)
					if (/createServerFn\s*\(/.test(content)) {
						violations.push(rel)
					}
				}
				return violations.length === 0 ? pass() : fail('createServerFn defined outside serverFns.ts', violations)
			},
		},
		{
			id: 'architecture-mongo-repo-parse',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'MongoRepository validates outbound documents with repo parsers (no casts)',
			async run() {
				const mongoRepo = await readText(path.join(rootDir, 'src/services/repository/mongoRepository.server.ts'))
				if (/as Promise<TaskRepo/.test(mongoRepo) || /as TaskRepo/.test(mongoRepo)) {
					return fail('mongoRepository.server.ts must not cast Mongo results to TaskRepo')
				}
				if (!/parseTaskRepo/.test(mongoRepo) || !/parseUserProfileRepoOrNull/.test(mongoRepo)) {
					return fail('mongoRepository.server.ts must use parseTaskRepo / parseUserProfileRepoOrNull')
				}
				return pass()
			},
		},
		{
			id: 'architecture-outbound-tool-mapping',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'serverFns maps repository rows through toToolTask / toToolUserProfile',
			async run() {
				const serverFns = await readText(path.join(rootDir, 'src/services/api/serverFns.ts'))
				if (!/toToolTask/.test(serverFns) || !/toToolUserProfile/.test(serverFns)) {
					return fail('serverFns.ts must map repository output through tools-layer parsers')
				}
				return pass()
			},
		},
		{
			id: 'architecture-no-context-casts',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Handlers do not cast middleware context',
			async run() {
				const files = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx'] })
				const violations = []
				const forbidden = /context\s+as\s+|getShellAuthContext|accessTicketFrom/
				for (const filePath of files) {
					const rel = relative(rootDir, filePath)
					if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue
					const content = await readText(filePath)
					if (forbidden.test(content)) {
						violations.push(rel)
					}
				}
				return violations.length === 0 ? pass() : fail('Context casts or runtime context guards found', violations)
			},
		},
		{
			id: 'architecture-ai-gating',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Chat UI is gated on getAIAvailability in root loader and AppLayout',
			async run() {
				const root = await readText(path.join(rootDir, 'src/routes/__root.tsx'))
				const layout = await readText(path.join(rootDir, 'src/components/AppLayout/AppLayout.tsx'))
				if (!/getAIAvailability\s*\(/.test(root)) {
					return fail('__root.tsx loader must call getAIAvailability()')
				}
				if (!/aiAvailable/.test(layout) || !/ChatDrawer/.test(layout)) {
					return fail('AppLayout must gate ChatDrawer on aiAvailable')
				}
				return pass()
			},
		},
		{
			id: 'architecture-traceability-context',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Writes pass TraceabilityContext; repos persist createdBy/lastModifiedBy',
			async run() {
				const serverFns = await readText(path.join(rootDir, 'src/services/api/serverFns.ts'))
				const seed = await readText(path.join(rootDir, 'src/services/repository/seedRepository.ts'))
				const mongo = await readText(path.join(rootDir, 'src/services/repository/mongoRepository.server.ts'))
				const repoSchema = await readText(path.join(rootDir, 'src/services/schemas/repository.ts'))
				const toolsSchema = await readText(path.join(rootDir, 'src/services/schemas/schemas.ts'))
				const mapper = await readText(path.join(rootDir, 'src/services/schemas/taskMappers.ts'))

				if (!/createWriteTrace|updateWriteTrace/.test(serverFns)) {
					return fail('serverFns.ts must build TraceabilityContext via createWriteTrace / updateWriteTrace')
				}
				if (/createTask\([^,]+,\s*context\.user\.email\)/.test(serverFns)) {
					return fail('serverFns.ts must not pass a bare email as the createTask trace argument')
				}
				if (!/lastModifiedBy/.test(repoSchema) || !/lastModifiedBy/.test(toolsSchema)) {
					return fail('repository and tools Task schemas must include lastModifiedBy')
				}
				if (!/lastModifiedBy:\s*row\.lastModifiedBy/.test(mapper)) {
					return fail('toToolTask must map lastModifiedBy')
				}
				if (/_trace\??:\s*TraceabilityContext/.test(seed) || /_trace\??:\s*TraceabilityContext/.test(mongo)) {
					return fail('repository updateTask must use (not ignore) TraceabilityContext')
				}
				if (!/trace\?\.lastModifiedBy/.test(seed)) {
					return fail('seedRepository must persist lastModifiedBy from TraceabilityContext')
				}
				if (!/trace\?\.lastModifiedBy/.test(mongo)) {
					return fail('mongoRepository must persist lastModifiedBy from TraceabilityContext')
				}
				return pass()
			},
		},
		{
			id: 'handbook-ai-gating-status',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'AGENTS.md does not claim chat UI always renders (Phase 3 is done)',
			async run() {
				const agents = await readText(path.join(rootDir, 'AGENTS.md'))
				if (/currently always render/.test(agents)) {
					return fail('AGENTS.md still claims chat UI always renders; Phase 3 gating is done')
				}
				return pass()
			},
		},
		{
			id: 'architecture-bounded-agent-loop',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'chat() sets agentLoopStrategy: maxIterations(N)',
			async run() {
				const chat = await readText(path.join(rootDir, 'src/routes/api/chat.ts'))
				if (!/agentLoopStrategy:\s*maxIterations\(/.test(chat)) {
					return fail('src/routes/api/chat.ts must set agentLoopStrategy: maxIterations(N)')
				}
				return pass()
			},
		},
		{
			id: 'architecture-import-protection',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'vite.config.ts configures tanstackStart importProtection',
			async run() {
				const viteConfig = await readText(path.join(rootDir, 'vite.config.ts'))
				if (!/importProtection/.test(viteConfig) || !/behavior:\s*['"]error['"]/.test(viteConfig)) {
					return fail('vite.config.ts must enable tanstackStart importProtection with behavior error')
				}
				return pass()
			},
		},
		{
			id: 'skills-companion-discovery',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'registry.json lists bidirectional companionSkills; generated SKILL.md includes install commands',
			async run() {
				const registryPath = path.join(rootDir, 'skills', 'registry.json')
				try {
					await fs.access(registryPath)
				} catch {
					return pass()
				}

				const registry = JSON.parse(await readText(registryPath))
				const skills = registry.skills ?? []
				const byId = new Map(skills.map((skill) => [skill.id, skill]))

				for (const skill of skills) {
					for (const companion of skill.companionSkills ?? []) {
						const other = byId.get(companion.id)
						if (!other) {
							return fail(`registry missing companion ${companion.id} for ${skill.id}`)
						}
						const reciprocal = (other.companionSkills ?? []).some((entry) => entry.id === skill.id)
						if (!reciprocal) {
							return fail(`${companion.id} does not reciprocate companion link to ${skill.id}`)
						}
					}
				}

				for (const skill of skills) {
					const skillMd = await readText(path.join(rootDir, '.agents', 'skills', skill.id, 'SKILL.md'))
					if (!/## Companion skills \(install if missing\)/.test(skillMd)) {
						return fail(`SKILL.md for ${skill.id} missing companion install section`)
					}
					for (const companion of skill.companionSkills ?? []) {
						if (!skillMd.includes(`npx skills add carlosvin/tanstack-fullstack-ai-template --skill ${companion.id}`)) {
							return fail(`SKILL.md for ${skill.id} missing install command for ${companion.id}`)
						}
					}
				}

				return pass()
			},
		},
		{
			id: 'skills-routing-tables',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Generated skills include Skill routing tables for agent load decisions',
			async run() {
				const registryPath = path.join(rootDir, 'skills', 'registry.json')
				try {
					await fs.access(registryPath)
				} catch {
					return fail('skills/registry.json missing')
				}
				const registry = JSON.parse(await readText(registryPath))
				const skillIds = (registry.skills ?? []).map((skill) => skill.id)
				if (skillIds.length === 0) {
					return fail('registry.json has no skills')
				}
				for (const skillId of skillIds) {
					const skillMdPath = path.join(rootDir, '.agents/skills', skillId, 'SKILL.md')
					try {
						await fs.access(skillMdPath)
					} catch {
						return fail(`Missing SKILL.md for ${skillId}`)
					}
					const skillMd = await readText(skillMdPath)
					if (!/## Skill routing/.test(skillMd)) {
						return fail(`SKILL.md for ${skillId} missing Skill routing section`)
					}
				}
				return pass()
			},
		},
		{
			id: 'template-skill-ui-observability-agnostic',
			skill: 'tanstack-promptable-fullstack-app-template',
			description:
				'Architecture skill stays vendor-agnostic (UI, observability, validation prose) and documents swappable stack',
			async run() {
				const templateSkill = await readText(
					path.join(rootDir, '.agents/skills/tanstack-promptable-fullstack-app-template/SKILL.md'),
				)
				const forbidden = [
					/\bMantine\b/i,
					/@mantine\//,
					/\bpino\b/i,
					/\bSentry\b/,
					/TextInput/,
					/useDebouncedCallback/,
					/react-markdown/,
					/remark-gfm/,
					/\bBiome\b/,
				]
				const violations = []
				for (const pattern of forbidden) {
					if (pattern.test(templateSkill)) {
						violations.push(`SKILL.md matches ${pattern}`)
					}
				}
				if (!/## Fixed vs swappable stack/.test(templateSkill)) {
					violations.push('SKILL.md missing "Fixed vs swappable stack" section')
				}
				return violations.length === 0
					? pass()
					: fail('Architecture skill must stay vendor-agnostic and document swappable stack', violations)
			},
		},
	]
}

export async function runSkillEvals({ rootDir = defaultRootDir, logger = console, filterSkill = null } = {}) {
	const evals = createSkillEvals(rootDir).filter((evalDef) => !filterSkill || evalDef.skill === filterSkill)
	const results = []

	for (const evalDef of evals) {
		const result = await evalDef.run()
		results.push({ ...evalDef, ...result })
	}

	const failed = results.filter((result) => !result.pass)
	for (const result of results) {
		const status = result.pass ? 'PASS' : 'FAIL'
		logger.log(`[${status}] ${result.id} (${result.skill})`)
		if (!result.pass) {
			logger.log(`       ${result.message}`)
			for (const file of result.files ?? []) {
				logger.log(`       - ${file}`)
			}
		}
	}

	if (failed.length > 0) {
		const error = new Error(`Skill evals failed: ${failed.length}/${results.length}`)
		error.results = results
		throw error
	}

	logger.log(`Skill evals passed: ${results.length}/${results.length}`)
	return results
}

async function main() {
	const args = process.argv.slice(2)
	const skillFlagIndex = args.indexOf('--skill')
	const filterSkill = skillFlagIndex >= 0 ? args[skillFlagIndex + 1] : null
	await runSkillEvals({ filterSkill })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	})
}
