import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import YAML from 'yaml'

const defaultRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function normalizeLineEndings(value) {
	return value.replace(/\r\n/g, '\n')
}

export function getSkillPaths(rootDir = defaultRootDir) {
	return {
		rootDir,
		sourceDir: path.join(rootDir, 'skills', 'src'),
		schemaPath: path.join(rootDir, 'skills', 'spec', 'skill.schema.json'),
		distDir: path.join(rootDir, 'skills', 'dist'),
		registryPath: path.join(rootDir, 'skills', 'registry.json'),
		agentSkillsDir: path.join(rootDir, '.agents', 'skills'),
	}
}

export async function readSkillFiles(sourceDir) {
	const entries = await fs.readdir(sourceDir, { withFileTypes: true })
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.skill.yaml'))
		.map((entry) => path.join(sourceDir, entry.name))
		.sort()
}

export function toSkillDescription(skill) {
	const triggerText = skill.triggers.map((trigger) => `"${trigger}"`).join(', ')
	return `${skill.summary} Project: ${skill.projectName}. Triggers on ${triggerText}.`
}

// Produces the agentskills.io standard SKILL.md format for .agents/skills/.
export function renderAgentSkill(skill) {
	const frontmatter = [
		'---',
		`name: ${skill.id}`,
		`description: ${toSkillDescription(skill)}`,
		'---',
		'',
		'> This file is generated from `skills/src/*.skill.yaml`. Do not edit manually.',
		'',
	].join('\n')
	return `${frontmatter}${skill.content.trimEnd()}\n`
}

export function renderDistMarkdown(skill) {
	const meta = [
		`# ${skill.title}`,
		'',
		`- Project: \`${skill.projectName}\``,
		`- Project summary: ${skill.projectSummary}`,
		`- Author: ${skill.author.name}${skill.author.url ? ` (${skill.author.url})` : ''}`,
		`- License: ${skill.license}`,
		`- Homepage: ${skill.homepage}`,
		`- Repository: ${skill.repository}`,
		`- Documentation: ${skill.documentationUrl}`,
		`- Status: ${skill.status}`,
		`- Supported tools: ${skill.supportedTools.map((tool) => `${tool.name} [${tool.installMode}${tool.tested ? ', tested' : ', not yet verified'}]`).join(', ')}`,
		`- Capabilities: ${skill.capabilities.join(', ')}`,
		`- ID: \`${skill.id}\``,
		`- Version: \`${skill.version}\``,
		`- Tags: ${skill.tags.join(', ')}`,
		'',
		`## Summary`,
		'',
		skill.summary,
		'',
		`## Triggers`,
		'',
		...skill.triggers.map((trigger) => `- ${trigger}`),
		'',
		`## Canonical Content`,
		'',
	].join('\n')

	return `${meta}${skill.content.trimEnd()}\n`
}

export function createRegistry(skills) {
	return {
		$schema: './spec/skill.schema.json',
		skills: skills.map((skill) => ({
			id: skill.id,
			title: skill.title,
			summary: skill.summary,
			projectName: skill.projectName,
			projectSummary: skill.projectSummary,
			version: skill.version,
			author: skill.author,
			license: skill.license,
			homepage: skill.homepage,
			repository: skill.repository,
			documentationUrl: skill.documentationUrl,
			status: skill.status,
			supportedTools: skill.supportedTools,
			tags: skill.tags,
			capabilities: skill.capabilities,
			triggers: skill.triggers,
			inputs: skill.inputs,
			outputs: skill.outputs,
			constraints: skill.constraints,
			steps: skill.steps,
			examples: skill.examples,
			source: `skills/src/${skill.id}.skill.yaml`,
			outputsByFormat: {
				skill: `.agents/skills/${skill.id}/SKILL.md`,
				markdown: `skills/dist/${skill.id}.md`,
			},
		})),
	}
}

export function findDuplicateSkillIds(skills) {
	const counts = new Map()
	for (const skill of skills) {
		counts.set(skill.id, (counts.get(skill.id) ?? 0) + 1)
	}
	return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
}

export function findTriggerCollisions(skills) {
	const triggerMap = new Map()
	for (const skill of skills) {
		for (const trigger of skill.triggers) {
			const normalizedTrigger = trigger.trim().toLowerCase()
			const owners = triggerMap.get(normalizedTrigger) ?? []
			owners.push(skill.id)
			triggerMap.set(normalizedTrigger, owners)
		}
	}

	return [...triggerMap.entries()]
		.filter(([, owners]) => owners.length > 1)
		.map(([trigger, owners]) => ({ trigger, owners }))
}

function formatYamlParseError(filePath, rootDir, error) {
	const relativePath = path.relative(rootDir, filePath)
	const position = Array.isArray(error?.linePos) && error.linePos.length > 0 ? error.linePos[0] : null
	const suffix = position ? ` at ${position.line}:${position.col}` : ''
	const message = error instanceof Error ? error.message : String(error)
	return `Failed to parse YAML in ${relativePath}${suffix}: ${message}`
}

export async function loadSkills({ sourceDir, schemaPath, rootDir = defaultRootDir }) {
	const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'))
	const ajv = new Ajv2020({ allErrors: true, strict: true })
	const validate = ajv.compile(schema)
	const skillFiles = await readSkillFiles(sourceDir)

	if (skillFiles.length === 0) {
		throw new Error('No canonical skill files found in skills/src.')
	}

	const skills = []
	for (const file of skillFiles) {
		let parsed
		try {
			const raw = await fs.readFile(file, 'utf8')
			parsed = YAML.parse(raw)
		} catch (error) {
			throw new Error(formatYamlParseError(file, rootDir, error))
		}

		const valid = validate(parsed)
		if (!valid) {
			const prettyErrors = (validate.errors ?? [])
				.map((error) => `- ${error.instancePath || '(root)'} ${error.message ?? ''}`)
				.join('\n')
			throw new Error(`Schema validation failed for ${path.relative(rootDir, file)}:\n${prettyErrors}`)
		}

		skills.push(parsed)
	}

	const duplicateSkillIds = findDuplicateSkillIds(skills)
	if (duplicateSkillIds.length > 0) {
		throw new Error(`Duplicate skill IDs found: ${duplicateSkillIds.join(', ')}`)
	}

	return skills
}

export async function writeOrCheckFile(targetPath, nextContent, checkOnly = false, rootDir = defaultRootDir) {
	const normalized = normalizeLineEndings(nextContent)
	let current = null
	try {
		current = normalizeLineEndings(await fs.readFile(targetPath, 'utf8'))
	} catch (error) {
		if (error && error.code !== 'ENOENT') {
			throw error
		}
	}

	if (checkOnly) {
		if (current !== normalized) {
			throw new Error(`Generated file is out of date: ${path.relative(rootDir, targetPath)}`)
		}
		return
	}

	if (current !== normalized) {
		await fs.mkdir(path.dirname(targetPath), { recursive: true })
		await fs.writeFile(targetPath, normalized, 'utf8')
	}
}

export async function buildSkills({ rootDir = defaultRootDir, checkOnly = false, logger = console } = {}) {
	const { sourceDir, schemaPath, distDir, registryPath, agentSkillsDir } = getSkillPaths(rootDir)
	const skills = await loadSkills({ sourceDir, schemaPath, rootDir })

	let pluginDir = null
	const pluginConfigPath = path.join(rootDir, 'skills', 'plugin.local.json')
	try {
		const raw = await fs.readFile(pluginConfigPath, 'utf8')
		pluginDir = JSON.parse(raw).pluginDir ?? null
	} catch {
		// no local plugin config, that's fine
	}

	const triggerCollisions = findTriggerCollisions(skills)
	if (triggerCollisions.length > 0) {
		for (const collision of triggerCollisions) {
			logger.warn(`Trigger collision detected for "${collision.trigger}": ${collision.owners.join(', ')}`)
		}
	}

	for (const skill of skills) {
		await writeOrCheckFile(path.join(agentSkillsDir, skill.id, 'SKILL.md'), renderAgentSkill(skill), checkOnly, rootDir)
		await writeOrCheckFile(path.join(distDir, `${skill.id}.md`), renderDistMarkdown(skill), checkOnly, rootDir)
		if (pluginDir) {
			await writeOrCheckFile(
				path.join(pluginDir, 'skills', skill.id, 'SKILL.md'),
				renderAgentSkill(skill),
				checkOnly,
				rootDir,
			)
		}
	}

	const registry = createRegistry(skills)
	await writeOrCheckFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, checkOnly, rootDir)

	const mode = checkOnly ? 'checked' : 'generated'
	logger.log(`Successfully ${mode} ${skills.length} skill(s).`)
	return skills
}

async function main() {
	const args = new Set(process.argv.slice(2))
	const checkOnly = args.has('--check')
	await buildSkills({ checkOnly })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	})
}
