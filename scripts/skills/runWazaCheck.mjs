import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function resolveWazaBin() {
	if (process.env.WAZA_BIN) return process.env.WAZA_BIN
	return 'waza'
}

export function assertWazaReady(report) {
	const skills = report?.skills
	if (!Array.isArray(skills) || skills.length === 0) {
		throw new Error('waza check returned no skills. Confirm .waza.yaml paths.skills points at .agents/skills.')
	}

	const notReady = skills.filter((skill) => !skill.ready)
	if (notReady.length > 0) {
		const details = notReady
			.map((skill) => {
				const issues = (skill.compliance?.issues ?? []).map((issue) => issue.message)
				const next = (skill.nextSteps ?? []).slice(0, 8)
				return `${skill.name}: ${[...issues, ...next].join('; ')}`
			})
			.join('\n')
		throw new Error(`Waza reported skills that are not ready:\n${details}`)
	}

	return skills
}

function listEvalSuites(rootDir) {
	const evalsDir = path.join(rootDir, 'evals')
	if (!existsSync(evalsDir)) return []
	return readdirSync(evalsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({
			skillId: entry.name,
			evalPath: path.join(evalsDir, entry.name, 'eval.yaml'),
			skillPath: path.join(rootDir, '.agents', 'skills', entry.name),
		}))
		.filter((entry) => existsSync(entry.evalPath) && existsSync(entry.skillPath))
}

function runWaza(wazaBin, args, { capture = false, cwd } = {}) {
	const result = spawnSync(wazaBin, args, {
		cwd,
		encoding: 'utf8',
		stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
	})
	return result
}

export function requireWazaSuccess(result, command) {
	if (result.status === 0) return
	const detail = result.stderr || result.stdout || result.error?.message || ''
	throw new Error(`${command} failed (exit ${result.status})${detail ? `: ${detail}` : ''}`)
}

export function runWazaValidation({ rootDir = defaultRootDir, wazaBin = resolveWazaBin() } = {}) {
	const version = runWaza(wazaBin, ['--version'], { capture: true, cwd: rootDir })
	if (version.status !== 0) {
		const hint = version.stderr || version.stdout || version.error?.message || 'waza not found'
		const required = process.env.CI === 'true' || process.env.WAZA_REQUIRED === '1'
		if (!required) {
			console.warn(`Skipping Waza validation (waza not installed): ${hint}`)
			console.warn('Install: curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash')
			return { skipped: true }
		}
		throw new Error(`waza is required in CI. Install failed: ${hint}`)
	}

	console.log(`Using ${String(version.stdout || version.stderr).trim()}`)

	const check = runWaza(wazaBin, ['check', '--format', 'json'], { capture: true, cwd: rootDir })
	requireWazaSuccess(check, 'waza check')

	let report
	try {
		report = JSON.parse(check.stdout)
	} catch (error) {
		throw new Error(
			`waza check did not return JSON: ${error instanceof Error ? error.message : String(error)}\n${check.stdout}`,
		)
	}

	const skills = assertWazaReady(report)
	console.log(`waza check: ${skills.length} skill(s) ready`)

	const suites = listEvalSuites(rootDir)
	if (suites.length === 0) {
		throw new Error('No Waza eval suites found under evals/<skill-id>/eval.yaml')
	}

	for (const suite of suites) {
		const verify = runWaza(
			wazaBin,
			['spec', 'verify', suite.skillPath, suite.evalPath, '--fail', '--threshold', '1', '--format', 'github-actions'],
			{ capture: false, cwd: rootDir },
		)
		if (verify.status !== 0) {
			throw new Error(`waza spec verify failed for ${suite.skillId} (exit ${verify.status})`)
		}
	}

	const resultsDir = path.join(rootDir, 'results')
	mkdirSync(resultsDir, { recursive: true })
	const run = runWaza(wazaBin, ['run', '--output', path.join(resultsDir, 'waza-ci.json')], {
		capture: false,
		cwd: rootDir,
	})
	if (run.status !== 0) {
		throw new Error(`waza run failed (exit ${run.status})`)
	}

	return { skipped: false, skills, suites }
}

async function main() {
	runWazaValidation()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	})
}
