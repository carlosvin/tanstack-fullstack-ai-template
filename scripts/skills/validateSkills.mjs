import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import YAML from 'yaml'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export const SKILLS_REPO = 'carlosvin/tanstack-fullstack-ai-template'

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_FRONTMATTER_KEYS = new Set([
	'name',
	'description',
	'license',
	'compatibility',
	'metadata',
	'allowed-tools',
])
const COMPANION_PATTERN = /\*\*`([a-z0-9-]+)`\*\*\s*\((companion|parent|child)\)/g

export function getSkillPaths(rootDir = defaultRootDir) {
	return {
		rootDir,
		agentSkillsDir: path.join(rootDir, '.agents', 'skills'),
	}
}

export function formatCompanionInstallCommand(skillId, { global = false } = {}) {
	const globalFlag = global ? ' -g' : ''
	return `npx skills add ${SKILLS_REPO} --skill ${skillId}${globalFlag}`
}

function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim().length > 0
}

function flattenDescription(value) {
	return String(value).replace(/\s+/g, ' ').trim()
}

export function parseSkillMarkdown(raw, { directoryName, relativePath }) {
	if (!raw.startsWith('---')) {
		throw new Error(`${relativePath}: SKILL.md must start with YAML frontmatter delimited by ---`)
	}

	const end = raw.indexOf('\n---', 3)
	if (end < 0) {
		throw new Error(`${relativePath}: SKILL.md frontmatter is not closed with ---`)
	}

	const frontmatterSource = raw.slice(4, end).trimEnd()
	const body = raw.slice(end + 4).replace(/^\n/, '')
	let frontmatter
	try {
		frontmatter = YAML.parse(frontmatterSource) ?? {}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`${relativePath}: failed to parse frontmatter: ${message}`)
	}

	if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
		throw new Error(`${relativePath}: frontmatter must be a YAML mapping`)
	}

	const extras = Object.keys(frontmatter).filter((key) => !ALLOWED_FRONTMATTER_KEYS.has(key))
	if (extras.length > 0) {
		throw new Error(
			`${relativePath}: unknown frontmatter field(s) ${extras.join(', ')} — agentskills.io allows only name, description, license, compatibility, metadata, allowed-tools`,
		)
	}

	const name = frontmatter.name
	if (!isNonEmptyString(name)) {
		throw new Error(`${relativePath}: frontmatter.name is required`)
	}
	if (name.length > 64) {
		throw new Error(`${relativePath}: frontmatter.name exceeds 64 characters`)
	}
	if (!NAME_PATTERN.test(name)) {
		throw new Error(
			`${relativePath}: frontmatter.name must be lowercase alphanumeric with single hyphens (no leading, trailing, or consecutive hyphens)`,
		)
	}
	if (name !== directoryName) {
		throw new Error(`${relativePath}: frontmatter.name "${name}" must match the parent directory "${directoryName}"`)
	}

	const description = flattenDescription(frontmatter.description ?? '')
	if (!description) {
		throw new Error(`${relativePath}: frontmatter.description is required`)
	}
	if (description.length > 1024) {
		throw new Error(`${relativePath}: frontmatter.description exceeds 1024 characters (${description.length})`)
	}

	if (frontmatter.license !== undefined && !isNonEmptyString(frontmatter.license)) {
		throw new Error(`${relativePath}: frontmatter.license must be a non-empty string when present`)
	}

	if (frontmatter.compatibility !== undefined) {
		if (!isNonEmptyString(frontmatter.compatibility)) {
			throw new Error(`${relativePath}: frontmatter.compatibility must be a non-empty string when present`)
		}
		if (frontmatter.compatibility.length > 500) {
			throw new Error(`${relativePath}: frontmatter.compatibility exceeds 500 characters`)
		}
	}

	if (frontmatter.metadata !== undefined) {
		if (
			frontmatter.metadata === null ||
			typeof frontmatter.metadata !== 'object' ||
			Array.isArray(frontmatter.metadata)
		) {
			throw new Error(`${relativePath}: frontmatter.metadata must be a string-to-string map`)
		}
		for (const [key, value] of Object.entries(frontmatter.metadata)) {
			if (typeof value !== 'string') {
				throw new Error(`${relativePath}: frontmatter.metadata.${key} must be a string`)
			}
		}
	}

	if (frontmatter['allowed-tools'] !== undefined && !isNonEmptyString(frontmatter['allowed-tools'])) {
		throw new Error(`${relativePath}: frontmatter.allowed-tools must be a space-separated string when present`)
	}

	const companionSkills = []
	for (const match of body.matchAll(COMPANION_PATTERN)) {
		companionSkills.push({ id: match[1], relationship: match[2] })
	}

	return {
		id: name,
		name,
		description,
		license: frontmatter.license,
		compatibility: frontmatter.compatibility,
		metadata: frontmatter.metadata,
		allowedTools: frontmatter['allowed-tools'],
		companionSkills,
		body,
		relativePath,
	}
}

export async function readSkillDirectories(agentSkillsDir) {
	let entries
	try {
		entries = await fs.readdir(agentSkillsDir, { withFileTypes: true })
	} catch (error) {
		if (error && error.code === 'ENOENT') {
			throw new Error('No Agent Skills found in .agents/skills/.')
		}
		throw error
	}

	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort()
}

export async function loadSkills({ agentSkillsDir, rootDir = defaultRootDir } = {}) {
	const skillsDir = agentSkillsDir ?? getSkillPaths(rootDir).agentSkillsDir
	const directories = await readSkillDirectories(skillsDir)

	if (directories.length === 0) {
		throw new Error('No Agent Skills found in .agents/skills/.')
	}

	const skills = []
	for (const directoryName of directories) {
		const skillMdPath = path.join(skillsDir, directoryName, 'SKILL.md')
		const relativePath = path.relative(rootDir, skillMdPath).split(path.sep).join('/')
		let raw
		try {
			raw = await fs.readFile(skillMdPath, 'utf8')
		} catch (error) {
			if (error && error.code === 'ENOENT') {
				throw new Error(`${relativePath}: missing SKILL.md (agentskills.io requires SKILL.md in the skill directory)`)
			}
			throw error
		}

		if (raw.charCodeAt(0) === 0xfeff) {
			throw new Error(`${relativePath}: SKILL.md must not start with a BOM`)
		}

		skills.push(parseSkillMarkdown(raw, { directoryName, relativePath }))
	}

	const duplicateSkillIds = findDuplicateSkillIds(skills)
	if (duplicateSkillIds.length > 0) {
		throw new Error(`Duplicate skill IDs found: ${duplicateSkillIds.join(', ')}`)
	}

	const missingCompanions = findMissingCompanionReciprocity(skills)
	if (missingCompanions.length > 0) {
		const details = missingCompanions
			.map((entry) => `${entry.skillId} → ${entry.companionId}: ${entry.reason}`)
			.join('; ')
		throw new Error(`Companion skill reciprocity failed: ${details}`)
	}

	return skills
}

export function findMissingCompanionReciprocity(skills) {
	const byId = new Map(skills.map((skill) => [skill.id, skill]))
	const missing = []

	for (const skill of skills) {
		for (const companion of skill.companionSkills ?? []) {
			const other = byId.get(companion.id)
			if (!other) {
				missing.push({
					skillId: skill.id,
					companionId: companion.id,
					reason: 'companion skill not found in .agents/skills/',
				})
				continue
			}
			const reciprocal = (other.companionSkills ?? []).some((entry) => entry.id === skill.id)
			if (!reciprocal) {
				missing.push({
					skillId: skill.id,
					companionId: companion.id,
					reason: `${companion.id} does not list ${skill.id} as a companion`,
				})
			}
		}
	}

	return missing
}

export function findDuplicateSkillIds(skills) {
	const counts = new Map()
	for (const skill of skills) {
		counts.set(skill.id, (counts.get(skill.id) ?? 0) + 1)
	}
	return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
}

export function assertCompanionInstallCommands(skill) {
	const missing = []
	for (const companion of skill.companionSkills ?? []) {
		const command = formatCompanionInstallCommand(companion.id)
		if (!skill.body.includes(command)) {
			missing.push(companion.id)
		}
	}
	return missing
}

export async function validateSkills({ rootDir = defaultRootDir, logger = console } = {}) {
	const { agentSkillsDir } = getSkillPaths(rootDir)
	const skills = await loadSkills({ agentSkillsDir, rootDir })

	const installErrors = []
	for (const skill of skills) {
		const missingInstall = assertCompanionInstallCommands(skill)
		if (missingInstall.length > 0) {
			installErrors.push(`${skill.id} missing npx skills install command for: ${missingInstall.join(', ')}`)
		}
		if (!/## Companion skills \(install if missing\)/.test(skill.body)) {
			installErrors.push(`${skill.id} missing "## Companion skills (install if missing)" section`)
		}
	}

	if (installErrors.length > 0) {
		throw new Error(installErrors.join('\n'))
	}

	logger.log(`Validated ${skills.length} Agent Skill(s) against the agentskills.io spec.`)
	return skills
}

async function main() {
	await validateSkills()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	})
}
