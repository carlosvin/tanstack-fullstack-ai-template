import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import YAML from 'yaml'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export const SKILLS_REPO = 'carlosvin/tanstack-fullstack-ai-template'

const COMPANION_PATTERN = /\*\*`([a-z0-9-]+)`\*\*\s*\((companion|parent|child)\)/g
const COMPANION_HEADING = '## Companion skills (install if missing)'
const ROUTING_HEADING = '## Skill routing'

export function getSkillPaths(rootDir = defaultRootDir) {
	return {
		rootDir,
		agentSkillsDir: path.join(rootDir, '.agents', 'skills'),
	}
}

export function formatCompanionInstallCommand(skillId) {
	return `npx skills add ${SKILLS_REPO} --skill ${skillId}`
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

	const name = frontmatter.name
	if (typeof name !== 'string' || !name.trim()) {
		throw new Error(`${relativePath}: frontmatter.name is required`)
	}
	if (name !== directoryName) {
		throw new Error(`${relativePath}: frontmatter.name "${name}" must match the parent directory "${directoryName}"`)
	}

	const companionSkills = []
	for (const match of body.matchAll(COMPANION_PATTERN)) {
		companionSkills.push({ id: match[1], relationship: match[2] })
	}

	return { id: name, companionSkills, body, relativePath }
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

		skills.push(parseSkillMarkdown(raw, { directoryName, relativePath }))
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

function findMissingCompanionReciprocity(skills) {
	const byId = new Map(skills.map((skill) => [skill.id, skill]))
	const missing = []

	for (const skill of skills) {
		for (const companion of skill.companionSkills) {
			const other = byId.get(companion.id)
			if (!other) {
				missing.push({
					skillId: skill.id,
					companionId: companion.id,
					reason: 'companion skill not found in .agents/skills/',
				})
				continue
			}
			const reciprocal = other.companionSkills.some((entry) => entry.id === skill.id)
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

export async function validateSkills({ rootDir = defaultRootDir, logger = console } = {}) {
	const { agentSkillsDir } = getSkillPaths(rootDir)
	const skills = await loadSkills({ agentSkillsDir, rootDir })

	const bodyErrors = []
	for (const skill of skills) {
		if (!skill.body.includes(COMPANION_HEADING)) {
			bodyErrors.push(`${skill.id} missing "${COMPANION_HEADING}" section`)
		}
		if (!skill.body.includes(ROUTING_HEADING)) {
			bodyErrors.push(`${skill.id} missing "${ROUTING_HEADING}" section`)
		}
		for (const companion of skill.companionSkills) {
			const command = formatCompanionInstallCommand(companion.id)
			if (!skill.body.includes(command)) {
				bodyErrors.push(`${skill.id} missing npx skills install command for: ${companion.id}`)
			}
		}
	}

	if (bodyErrors.length > 0) {
		throw new Error(bodyErrors.join('\n'))
	}

	logger.log(
		`Validated ${skills.length} Agent Skill(s): companion reciprocity, routing, and npx skills install commands.`,
	)
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
