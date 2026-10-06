import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSkillPaths } from './validateSkills.mjs'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const PROCESS_ENV_ALLOWED = new Set(['src/env/webEnv.server.ts', 'instrument.env.mts'])

const PROCESS_ENV_ALLOWED_PREFIXES = ['e2e/', 'playwright.config.ts', 'instrument.env.test.ts']

const ARCHITECTURE_VENDOR_FORBIDDEN = [
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

/** Remove import/export statements that are type-only (erased at compile time). */
function stripTypeOnlyImports(content) {
	let result = content
	// import type Foo from '...' | import type { Foo } from '...'
	result = result.replace(/import\s+type\s[^;]+;?/g, '')
	// export type { Foo } from '...'
	result = result.replace(/export\s+type\s[^;]+;?/g, '')
	// import { type A, type B } from '...' — all bindings are type-only
	result = result.replace(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*['"];?/g, (match, inner) => {
		const bindings = inner
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
		if (bindings.length > 0 && bindings.every((b) => /^type\s/.test(b))) {
			return ''
		}
		return match
	})
	// export { type A, type B } from '...' — all bindings are type-only
	result = result.replace(/export\s*\{([^}]+)\}\s*from\s*['"][^'"]*['"];?/g, (match, inner) => {
		const bindings = inner
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
		if (bindings.length > 0 && bindings.every((b) => /^type\s/.test(b))) {
			return ''
		}
		return match
	})
	return result
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

const UX_SILENT_DEFAULTS = [
	[/If the user does not choose, use \*\*prompt-first\*\*/, 'defaults to prompt-first when the user does not choose'],
	[/prompt-first\*\* \(default\)/, 'marks prompt-first as the default answer'],
	[/When the preference is unclear, use/, 'picks an experience when the preference is unclear'],
	[/if they do not choose, use \*\*prompt-first\*\*/i, 'defaults to prompt-first when they do not choose'],
]

/**
 * Violations of the "ask which UX and wait" contract.
 * @param {{ architecture: string, promptable: string, agentic: string }} skills
 * @returns {string[]}
 */
export function uxChoiceViolations({ architecture, promptable, agentic }) {
	const violations = []
	const choose = architecture.split('## Choose a UX')[1]?.split('\n## ')[0] ?? ''
	if (!choose) {
		violations.push('Architecture skill must include Choose a UX')
	} else {
		const rows = choose.split('\n').filter((line) => line.startsWith('|'))
		const expectRow = (experience, skillId) => {
			const row = rows.find((line) => line.includes(`**${experience}**`))
			if (!row?.includes(`**\`${skillId}\`**`)) {
				violations.push(`Choose a UX must send ${experience} to ${skillId}`)
			}
		}
		expectRow('side', 'promptable-ux')
		expectRow('prompt-first', 'promptable-ux')
		expectRow('agentic', 'agentic-ux')
		if (!/keep that declaration/.test(choose)) {
			violations.push('Choose a UX must keep an already declared PROMPT_CONCEPT')
		}
		if (!/ask which of the three[\s\S]{0,160}wait/.test(choose) || !/Do not pick one/.test(choose)) {
			violations.push('Choose a UX must ask which of the three and wait, and must not pick one')
		}
	}

	const texts = [
		['Architecture skill', architecture],
		['promptable-ux', promptable],
		['agentic-ux', agentic],
	]
	for (const [name, text] of texts) {
		for (const [pattern, reason] of UX_SILENT_DEFAULTS) {
			if (pattern.test(text)) violations.push(`${name} ${reason}`)
		}
		if (!/not clear which user experience/.test(text) || !/ask which of the three[\s\S]{0,160}wait/.test(text)) {
			violations.push(`${name} must ask which of the three and wait when it is not clear`)
		}
	}
	if (!/Do not pick one/.test(promptable)) {
		violations.push('promptable-ux must not pick one when it is not clear')
	}
	if (!/Do not build this shell as a fallback/.test(agentic)) {
		violations.push('agentic-ux must not build the shell as a fallback')
	}
	return violations
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
			id: 'observability-no-client-env-imports',
			skill: 'observability-and-env',
			description:
				'Client-shared modules (components, routes, schemas, constants, types) do not statically import src/env/** server modules',
			async run() {
				const clientSharedZones = ['src/components', 'src/routes', 'src/services/schemas', 'src/constants', 'src/types']
				const violations = []
				for (const zone of clientSharedZones) {
					let files
					try {
						files = await walkFiles(path.join(rootDir, zone), { extensions: ['.ts', '.tsx'] })
					} catch {
						continue // zone does not exist in this workspace
					}
					for (const filePath of files) {
						const rel = relative(rootDir, filePath)
						if (rel.startsWith('src/routes/api/')) continue // API routes are server-only handlers
						if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx') || rel.endsWith('.spec.ts')) continue
						const content = await readText(filePath)
						// Type-only imports/exports are erased at compile time and cannot leak into the bundle.
						const valueCode = stripTypeOnlyImports(content)
						if (/(?:from|import)\s*\(?\s*['"][^'"]*\/env\//.test(valueCode)) {
							violations.push(rel)
						}
					}
				}
				return violations.length === 0
					? pass()
					: fail(
							'Client-shared modules must not import src/env/** (server-only). Browser-safe env schemas live in src/services/schemas/shellSession.ts',
							violations,
						)
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
				const repoDir = path.join(rootDir, 'src/services/repository')
				let files
				try {
					files = await walkFiles(repoDir, { extensions: ['.ts'] })
				} catch {
					return fail('Missing src/services/repository')
				}
				const sources = new Map()
				const castFiles = []
				for (const filePath of files) {
					const rel = relative(rootDir, filePath)
					if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue
					const content = await readText(filePath)
					sources.set(rel, content)
					if (/as Promise<TaskRepo/.test(content) || /as TaskRepo/.test(content)) {
						castFiles.push(rel)
					}
				}
				if (castFiles.length > 0) {
					return fail('Mongo repository modules must not cast Mongo results to TaskRepo', castFiles)
				}
				const task = sources.get('src/services/repository/mongoTaskRepository.server.ts')
				const user = sources.get('src/services/repository/mongoUserRepository.server.ts')
				const legacy = sources.get('src/services/repository/mongoRepository.server.ts')
				if (task && user) {
					if (!/parseTaskRepoList/.test(task) || !/parseDistinctValues/.test(task)) {
						return fail('mongoTaskRepository.server.ts must use parseTaskRepoList / parseDistinctValues')
					}
					if (!/parseUserProfileRepoOrNull/.test(user)) {
						return fail('mongoUserRepository.server.ts must use parseUserProfileRepoOrNull')
					}
					return pass()
				}
				if (!legacy || !/parseTaskRepoList/.test(legacy) || !/parseUserProfileRepoOrNull/.test(legacy)) {
					return fail('mongoRepository.server.ts must use parseTaskRepoList / parseUserProfileRepoOrNull')
				}
				if (!/parseDistinctValues/.test(legacy)) {
					return fail('mongoRepository.server.ts must parse distinct values with parseDistinctValues')
				}
				return pass()
			},
		},
		{
			id: 'architecture-trust-boundary-parse',
			skill: 'tanstack-promptable-fullstack-app-template',
			description:
				'Untrusted I/O uses Schema.parse / validateSearch; no hand-rolled tuple .find parsers for closed vocabularies',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				const skillMdPath = path.join(agentSkillsDir, 'tanstack-promptable-fullstack-app-template', 'SKILL.md')
				try {
					await fs.access(skillMdPath)
				} catch {
					return pass()
				}
				const skillMd = await readText(skillMdPath)
				if (!/Trust boundaries/.test(skillMd)) {
					return fail('Architecture skill must document Trust boundaries')
				}
				if (!/validateSearch/.test(skillMd) || !/Schema\.parse/.test(skillMd)) {
					return fail('Architecture skill must name validateSearch and Schema.parse at trust boundaries')
				}
				if (!/Array\.find/.test(skillMd) && !/hand-rolled/.test(skillMd)) {
					return fail('Architecture skill must reject hand-rolled Array.find parsers')
				}

				const optionsPath = path.join(rootDir, 'src/constants/options.ts')
				try {
					const options = await readText(optionsPath)
					if (/TASK_STATUSES\.find/.test(options) || /function parseTaskStatus/.test(options)) {
						return fail('options.ts must not hand-roll status parsers; use schema .parse()')
					}
				} catch {
					// App-only fixtures may omit constants.
				}

				const tasksPagePath = path.join(rootDir, 'src/components/TasksPage/TasksPage.tsx')
				try {
					const tasksPage = await readText(tasksPagePath)
					if (
						!/OptionalTaskStatusSchema\.parse/.test(tasksPage) ||
						!/OptionalTaskPrioritySchema\.parse/.test(tasksPage)
					) {
						return fail(
							'TasksPage must parse Select values with OptionalTaskStatusSchema.parse / OptionalTaskPrioritySchema.parse',
						)
					}
				} catch {
					// App-only fixtures may omit pages.
				}

				const seedPath = path.join(rootDir, 'src/services/repository/seedRepository.ts')
				try {
					const seed = await readText(seedPath)
					if (!/parseTaskRepoList/.test(seed) || !/UserProfileRepoSchema\.array\(\)\.parse/.test(seed)) {
						return fail('seedRepository must Schema.parse seed documents at the repository boundary')
					}
					if (!/parseDistinctValues/.test(seed)) {
						return fail('seedRepository must Schema.parse distinct values at the repository boundary')
					}
				} catch {
					// App-only fixtures may omit seed.
				}

				const jwtPath = path.join(rootDir, 'src/utils/jwt.server.ts')
				try {
					const jwt = await readText(jwtPath)
					if (!/JwtIdentityClaimsSchema\.parse/.test(jwt) || !/UserIdentitySchema\.parse/.test(jwt)) {
						return fail('jwt.server.ts must Schema.parse JWT claims into UserIdentity')
					}
					if (/as string\[\]/.test(jwt)) {
						return fail('jwt.server.ts must not cast JWT groups with as string[]')
					}
				} catch {
					// App-only fixtures may omit jwt helpers.
				}

				const taskFormPath = path.join(rootDir, 'src/components/TaskForm/TaskForm.tsx')
				try {
					const taskForm = await readText(taskFormPath)
					if (!/TaskInputSchema\.parse/.test(taskForm)) {
						return fail('TaskForm must Schema.parse submitted values with TaskInputSchema')
					}
				} catch {
					// App-only fixtures may omit forms.
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
				if (!/aiAvailable/.test(layout)) {
					return fail('AppLayout must gate prompt UI on aiAvailable')
				}
				if (!/PromptChatProvider/.test(layout) || !/ChatDrawer/.test(layout) || !/PromptBar/.test(layout)) {
					return fail(
						'AppLayout must mount PromptChatProvider and both side (ChatDrawer) and prompt-first (PromptBar) shells',
					)
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
				const taskRepoPath = path.join(rootDir, 'src/services/repository/mongoTaskRepository.server.ts')
				const legacyRepoPath = path.join(rootDir, 'src/services/repository/mongoRepository.server.ts')
				let mongo
				try {
					mongo = await readText(taskRepoPath)
				} catch {
					mongo = await readText(legacyRepoPath)
				}
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
			id: 'template-skill-vendor-agnostic',
			skill: 'tanstack-promptable-fullstack-app-template',
			description: 'Architecture skill stays vendor-agnostic and documents Fixed vs swappable stack',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				const templateSkill = await readText(
					path.join(agentSkillsDir, 'tanstack-promptable-fullstack-app-template', 'SKILL.md'),
				)
				const violations = []
				for (const pattern of ARCHITECTURE_VENDOR_FORBIDDEN) {
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
		{
			id: 'promptable-ux-concepts',
			skill: 'promptable-ux',
			description:
				'Shared UX skill defines both prompt concepts; mobile first stays out of the architecture core contract',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				let skillMd
				try {
					skillMd = await readText(path.join(agentSkillsDir, 'promptable-ux', 'SKILL.md'))
				} catch {
					return fail('Missing .agents/skills/promptable-ux/SKILL.md')
				}
				const agents = await readText(path.join(rootDir, 'AGENTS.md'))
				const templateSkill = await readText(
					path.join(agentSkillsDir, 'tanstack-promptable-fullstack-app-template', 'SKILL.md'),
				)
				const layout = await readText(path.join(rootDir, 'src/components/AppLayout/AppLayout.tsx'))
				const shared = skillMd.split('## Shared UX')[1]?.split('## Promptable UI (side)')[0] ?? ''
				if (!/## Promptable UI \(side\)/.test(skillMd) || !/## Prompt-first/.test(skillMd)) {
					return fail('promptable-ux must define Promptable UI (side) and Prompt-first')
				}
				if (!/Mobile first \(default\)/.test(shared)) {
					return fail('Shared UX must include mobile first as the default')
				}
				if (!/Ask the developer/.test(skillMd)) {
					return fail('promptable-ux must ask the developer before an undeclared concept or leaving mobile first')
				}
				if (!/developer\.mozilla\.org\/en-US\/docs\/Glossary\/Mobile_First/.test(shared)) {
					return fail('Mobile first must cite the MDN glossary definition')
				}
				if (!/Promptable UI \(side\)/.test(layout)) {
					return fail('AppLayout must declare Promptable UI (side)')
				}
				const specialMatch = templateSkill.split('## Special Patterns')[1] ?? ''
				const coreMatch = templateSkill.split('## Core Contract')[1]?.split('## Architecture Checklist')[0] ?? ''
				if (
					/Mobile first \(default\)/.test(specialMatch) ||
					/developer\.mozilla\.org\/en-US\/docs\/Glossary\/Mobile_First/.test(specialMatch)
				) {
					return fail('Architecture skill must point at promptable-ux instead of owning the mobile-first essay')
				}
				if (/AppShell/.test(specialMatch) || /burger/i.test(specialMatch)) {
					return fail('Architecture skill must not prescribe chrome widgets')
				}
				if (/mobile first/i.test(coreMatch) || /mobile-first/i.test(coreMatch)) {
					return fail('Mobile first must not be listed in Core Contract')
				}
				if (!/\*\*`promptable-ux`\*\*\s*\(companion\)/.test(templateSkill)) {
					return fail('Parent architecture skill must list promptable-ux as a companion')
				}
				if (!/Mobile first \(default\)/.test(agents) || !/Ask the developer/.test(agents)) {
					return fail('AGENTS.md must document mobile first as default and ask the developer')
				}
				if (!/Promptable UI \(side\)/.test(agents) || !/Prompt-first/.test(agents)) {
					return fail('AGENTS.md must name both prompt concepts')
				}
				return pass()
			},
		},
		{
			id: 'reference-tech-stack-map',
			skill: 'reference-tech-stack',
			description: 'Reference stack skill publishes a Stack map section',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				const skillMdPath = path.join(agentSkillsDir, 'reference-tech-stack', 'SKILL.md')
				try {
					await fs.access(skillMdPath)
				} catch {
					return fail('Missing .agents/skills/reference-tech-stack/SKILL.md')
				}
				const skillMd = await readText(skillMdPath)
				if (!/## Stack map/.test(skillMd)) {
					return fail('reference-tech-stack SKILL.md must include a Stack map section')
				}
				return pass()
			},
		},
		{
			id: 'repository-architecture-skill-contract',
			skill: 'repository-architecture',
			description: 'Repository architecture skill documents ownership, resource lifetime, and Java/Python equivalents',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				const skillMdPath = path.join(agentSkillsDir, 'repository-architecture', 'SKILL.md')
				let skillMd
				try {
					skillMd = await readText(skillMdPath)
				} catch {
					return pass()
				}
				const required = [
					['## Boundary and ownership', 'Boundary and ownership section'],
					['## Boundary validation', 'Boundary validation section'],
					['runtime validator', 'Runtime validators for erased or dynamic types'],
					['Pydantic', 'Python Pydantic example'],
					['strongly typed', 'Strongly typed languages decode into the domain type'],
					['## Resource lifetime is not data cleanup', 'Resource lifetime section'],
					['Symbol.asyncDispose', 'TypeScript AsyncDisposable ownership'],
					['AutoCloseable', 'Java AutoCloseable equivalent'],
					['__aexit__', 'Python async context-manager magic method'],
					['Never perform stale-data deletion in a disposer', 'Disposer must not sweep stale data'],
					['## Migration and verification workflow', 'Migration workflow'],
				]
				const missing = required.filter(([needle]) => !skillMd.includes(needle)).map(([, label]) => label)
				if (missing.length > 0) {
					return fail('repository-architecture skill is missing required contract text', missing)
				}

				const parentPath = path.join(agentSkillsDir, 'tanstack-promptable-fullstack-app-template', 'SKILL.md')
				try {
					const parent = await readText(parentPath)
					if (!/\*\*`repository-architecture`\*\*\s*\(companion\)/.test(parent)) {
						return fail('Parent architecture skill must list repository-architecture as a companion')
					}
				} catch {
					// Partial fixtures may omit the parent skill.
				}
				return pass()
			},
		},
		{
			id: 'repository-driver-confined',
			skill: 'repository-architecture',
			description: 'Database driver imports stay in the composition root and repository implementations',
			async run() {
				let srcFiles
				try {
					srcFiles = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx', '.mts'] })
				} catch {
					return pass()
				}
				const driverImport = /from\s+['"]mongodb['"]|new MongoClient\b|\.collection\s*(?:<[^>]+>)?\(/
				const violations = []
				for (const filePath of srcFiles) {
					const rel = relative(rootDir, filePath)
					if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue
					if (rel.startsWith('src/services/db/')) continue
					if (rel.startsWith('src/services/repository/') && rel.endsWith('.server.ts')) continue
					const content = await readText(filePath)
					if (driverImport.test(content)) {
						violations.push(rel)
					}
				}
				return violations.length === 0
					? pass()
					: fail('Database driver access must stay in src/services/db and src/services/repository', violations)
			},
		},
		{
			id: 'repository-collection-owners',
			skill: 'repository-architecture',
			description: 'Mongo collection owners bind collections, declare indexes, and the scope only closes the client',
			async run() {
				const taskPath = path.join(rootDir, 'src/services/repository/mongoTaskRepository.server.ts')
				const userPath = path.join(rootDir, 'src/services/repository/mongoUserRepository.server.ts')
				const facadePath = path.join(rootDir, 'src/services/repository/mongoRepository.server.ts')
				let _hasFacade = false
				try {
					await fs.access(facadePath)
					_hasFacade = true
				} catch {
					return pass()
				}
				const hasTask = await fs
					.access(taskPath)
					.then(() => true)
					.catch(() => false)
				const hasUser = await fs
					.access(userPath)
					.then(() => true)
					.catch(() => false)
				if (!hasTask || !hasUser) {
					const missing = []
					if (!hasTask) missing.push('mongoTaskRepository.server.ts')
					if (!hasUser) missing.push('mongoUserRepository.server.ts')
					return fail('Mongo facade requires task and user collection owner modules', missing)
				}
				const task = await readText(taskPath)
				const user = await readText(userPath)
				const facade = await readText(facadePath)
				const scope = await readText(path.join(rootDir, 'src/services/db/mongoClient.server.ts'))
				const missing = []
				if (!/private readonly collection/.test(task))
					missing.push('task collection is not a private constructor field')
				if (!/private readonly collection/.test(user))
					missing.push('user collection is not a private constructor field')
				if (!/createIndex\(\{ id: 1 \}/.test(task)) missing.push('task owner must declare the id index')
				if (!/createIndex\(\{ email: 1 \}/.test(user)) missing.push('user owner must declare the email index')
				if (!/this\.tasks\.createIndexes\(/.test(facade) || !/this\.users\.createIndexes\(/.test(facade)) {
					missing.push('facade must delegate createIndexes to collection owners')
				}
				if (!/Symbol\.asyncDispose/.test(scope)) missing.push('scope must dispose the client')
				if (/deleteMany|cleanupStale/.test(scope)) missing.push('scope dispose must not sweep persisted rows')
				if (missing.length > 0) {
					return fail('Mongo repositories must follow collection ownership and resource lifetime', missing)
				}

				const srcFiles = await walkFiles(path.join(rootDir, 'src'), { extensions: ['.ts', '.tsx'] })
				const clientOwners = []
				for (const filePath of srcFiles) {
					const rel = relative(rootDir, filePath)
					if (rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue
					const content = await readText(filePath)
					if (/new MongoClient\b/.test(content) && rel !== 'src/services/db/mongoClient.server.ts') {
						clientOwners.push(rel)
					}
				}
				return clientOwners.length === 0
					? pass()
					: fail('new MongoClient is owned by src/services/db/mongoClient.server.ts', clientOwners)
			},
		},
		{
			id: 'choose-ux-asks-when-unclear',
			skill: 'tanstack-promptable-fullstack-app-template',
			description:
				'When the user experience is not clear, the architecture skill and both UX companions ask which of side, prompt-first, or agentic to implement and wait',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				const readSkill = async (id) => readText(path.join(agentSkillsDir, id, 'SKILL.md'))
				let architecture
				let promptable
				let agentic
				try {
					architecture = await readSkill('tanstack-promptable-fullstack-app-template')
					promptable = await readSkill('promptable-ux')
					agentic = await readSkill('agentic-ux')
				} catch {
					return fail('Choose a UX eval requires the architecture, promptable-ux, and agentic-ux skills')
				}
				const violations = uxChoiceViolations({ architecture, promptable, agentic })
				return violations.length === 0
					? pass()
					: fail('UX skills must ask which experience to implement when it is not clear', violations)
			},
		},
		{
			id: 'agentic-ux-shell-contract',
			skill: 'agentic-ux',
			description:
				'Agentic skill recipe matches the example shell: metadata._meta.ui.resourceUri, AppRenderer, no route chrome',
			async run() {
				const { agentSkillsDir } = getSkillPaths(rootDir)
				let skillMd
				try {
					skillMd = await readText(path.join(agentSkillsDir, 'agentic-ux', 'SKILL.md'))
				} catch {
					return fail('Missing .agents/skills/agentic-ux/SKILL.md')
				}
				const missing = []
				if (!/## Shell/.test(skillMd)) missing.push('Shell section')
				if (!/## MCP UI rendering/.test(skillMd)) missing.push('MCP UI rendering section')
				if (!/## Security/.test(skillMd)) missing.push('Security section')
				if (!/metadata\._meta\.ui\.resourceUri/.test(skillMd)) missing.push('metadata._meta.ui.resourceUri recipe')
				if (!/createUIResource/.test(skillMd)) missing.push('createUIResource recipe')
				if (!/AppRenderer/.test(skillMd)) missing.push('AppRenderer recipe')
				if (!/resources\/read/.test(skillMd)) missing.push('resources/read recipe')
				if (!/createMCPServer/.test(skillMd) || !/createMCPClient/.test(skillMd)) {
					missing.push('TanStack MCP registration recipe')
				}
				if (!/toolResult/.test(skillMd)) missing.push('toolResult recipe')
				if (!/sandbox_proxy\.html/.test(skillMd)) missing.push('sandbox proxy recipe')
				if (!/only inside the MCP UI iframe/.test(skillMd)) missing.push('iframe-only render rule')
				if (!/No `ChatDrawer`, `PromptBar`, `AppNavbar`/.test(skillMd)) missing.push('no route-component reuse rule')
				if (!/docs\/help\.md/.test(skillMd) || !/sentence case/.test(skillMd)) {
					missing.push('hero and tool-status rules')
				}
				if (!/provider payload/.test(skillMd)) missing.push('short error alert rule')
				if (!/one short sentence/.test(skillMd) || !/demo visitor/.test(skillMd)) {
					missing.push('answer and demo-assignee rules')
				}
				if (!/without waiting|do not send another model turn/.test(skillMd)) {
					missing.push('direct detail-open rule')
				}
				if (!/bare colon/.test(skillMd)) missing.push('empty markdown-link label rule')
				if (!/No raw ids/.test(skillMd)) missing.push('guest card presentation rule')
				if (!/\*\*`agentic-ux`\*\*\s*\(companion\)/.test(skillMd) && !/agentic-ux/.test(skillMd)) {
					missing.push('companion wiring')
				}
				if (missing.length > 0) {
					return fail('agentic-ux skill is missing required contract text', missing)
				}
				const templateSkill = await readText(
					path.join(agentSkillsDir, 'tanstack-promptable-fullstack-app-template', 'SKILL.md'),
				)
				if (!/\*\*`agentic-ux`\*\*\s*\(companion\)/.test(templateSkill)) {
					return fail('Parent architecture skill must list agentic-ux as a companion')
				}
				const tools = await readText(path.join(rootDir, 'src/services/ai/tools.ts'))
				const mcpServer = await readText(path.join(rootDir, 'src/services/ai/taskViewsMcp.server.ts'))
				const chatRoute = await readText(path.join(rootDir, 'src/routes/api/chat.ts'))
				const renderer = await readText(path.join(rootDir, 'src/components/AgenticMcp/AgenticMcpRenderer.tsx'))
				const resources = await readText(path.join(rootDir, 'src/services/mcpUi/mcpUiResources.ts'))
				const shell = await readText(path.join(rootDir, 'src/components/AgenticShell/AgenticShell.tsx'))
				const thread = await readText(path.join(rootDir, 'src/components/AgenticShell/AgenticThread.tsx'))
				const composer = await readText(path.join(rootDir, 'src/components/AgenticShell/AgenticComposer.tsx'))
				const guest = await readText(path.join(rootDir, 'public/mcp-task-view.js'))
				const labels = await readText(path.join(rootDir, 'src/components/PromptChat/toolLabels.ts'))
				const drift = []
				if (!/_meta:\s*\{\s*ui:\s*\{\s*resourceUri:/.test(mcpServer)) {
					drift.push('view tools must set metadata._meta.ui.resourceUri')
				}
				if (
					!/createMCPServer/.test(mcpServer) ||
					!/resourceDefinition/.test(mcpServer) ||
					!/createMCPClient/.test(mcpServer)
				) {
					drift.push('task views must be registered with createMCPServer and createMCPClient')
				}
				if (!/connectTaskViewsMcp/.test(chatRoute) || !/mcp:\s*\{\s*clients:/.test(chatRoute)) {
					drift.push('agentic chat must pass the MCP client to chat({ mcp })')
				}
				if (/readResource:/.test(mcpServer) || /readResource:/.test(tools)) {
					drift.push('view tools must not bind readResource themselves')
				}
				if (!/AppRenderer/.test(renderer) || !/sandbox_proxy\.html/.test(renderer) || !/toolResult/.test(renderer)) {
					drift.push('AgenticMcpRenderer must render AppRenderer through sandbox_proxy.html with toolResult')
				}
				if (!/createUIResource/.test(resources) || !/readMcpUiResource/.test(resources)) {
					drift.push('mcpUiResources must register views with createUIResource and readMcpUiResource')
				}
				if (/emitMcpUiResource|showTasksViewTool/.test(tools)) {
					drift.push('tools.ts must not register the view tools outside the MCP server')
				}
				if (/ChatDrawer|PromptBar|AppNavbar/.test(shell)) {
					drift.push('AgenticShell must not mount route-based prompt chrome')
				}
				if (!/withoutDemoAssignee/.test(mcpServer) || !/isDemoTestEmail/.test(mcpServer)) {
					drift.push('showTasksView must drop a demo visitor email before querying')
				}
				if (!/one short sentence/.test(chatRoute) || !/Never pass this email as an assignee filter/.test(chatRoute)) {
					drift.push('agentic system prompt must keep answers short and must not filter my tasks by the demo email')
				}
				if (!/friendlyChatError/.test(composer)) {
					drift.push('the composer must show a short alert, not the provider payload')
				}
				if (!/Show my tasks/.test(thread) || /Summarize my task overview/.test(thread)) {
					drift.push('the empty hero must use view starters, not route help bullets')
				}
				if (!/Open the detail view for/.test(thread) || !/getTask\(/.test(thread)) {
					drift.push('a card that names a task id must open that detail view without another model turn')
				}
				if (!/showing tasks/.test(labels)) {
					drift.push('tool status labels must be sentence case')
				}
				if (!/textContent/.test(guest) || /Open'/.test(guest)) {
					drift.push('the guest must paint with textContent and must not use a separate Open button')
				}
				if (drift.length > 0) {
					return fail('Agentic example drifted from the agentic-ux recipe', drift)
				}
				return pass()
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
