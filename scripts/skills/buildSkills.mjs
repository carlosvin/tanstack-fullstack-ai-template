import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Ajv2020 from 'ajv/dist/2020.js'
import YAML from 'yaml'

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const sourceDir = path.join(rootDir, 'skills', 'src')
const schemaPath = path.join(rootDir, 'skills', 'spec', 'skill.schema.json')
const distDir = path.join(rootDir, 'skills', 'dist')
const registryPath = path.join(rootDir, 'skills', 'registry.json')
const agentSkillsDir = path.join(rootDir, '.agents', 'skills')

const args = new Set(process.argv.slice(2))
const checkOnly = args.has('--check')

function normalizeLineEndings(value) {
	return value.replace(/\r\n/g, '\n')
}

async function readSkillFiles() {
	const entries = await fs.readdir(sourceDir, { withFileTypes: true })
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.skill.yaml'))
		.map((entry) => path.join(sourceDir, entry.name))
		.sort()
}

function toSkillDescription(skill) {
	const triggerText = skill.triggers.map((trigger) => `"${trigger}"`).join(', ')
	return `${skill.summary} Project: ${skill.projectName}. Triggers on ${triggerText}.`
}

// Produces the agentskills.io standard SKILL.md format for .agents/skills/.
function renderAgentSkill(skill) {
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

function renderDistMarkdown(skill) {
	const meta = [
		`# ${skill.title}`,
		'',
		`- Project: \`${skill.projectName}\``,
		`- Project summary: ${skill.projectSummary}`,
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

async function writeOrCheckFile(targetPath, nextContent) {
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

async function main() {
	const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'))
	const ajv = new Ajv2020({ allErrors: true, strict: false })
	const validate = ajv.compile(schema)
	const skillFiles = await readSkillFiles()

	if (skillFiles.length === 0) {
		throw new Error('No canonical skill files found in skills/src.')
	}

	const skills = []
	for (const file of skillFiles) {
		const raw = await fs.readFile(file, 'utf8')
		const parsed = YAML.parse(raw)
		const valid = validate(parsed)
		if (!valid) {
			const prettyErrors = (validate.errors ?? [])
				.map((error) => `- ${error.instancePath || '(root)'} ${error.message ?? ''}`)
				.join('\n')
			throw new Error(`Schema validation failed for ${path.relative(rootDir, file)}:\n${prettyErrors}`)
		}
		skills.push(parsed)
	}

	for (const skill of skills) {
		await writeOrCheckFile(path.join(agentSkillsDir, skill.id, 'SKILL.md'), renderAgentSkill(skill))
		await writeOrCheckFile(path.join(distDir, `${skill.id}.md`), renderDistMarkdown(skill))
	}

	const registry = {
		$schema: './spec/skill.schema.json',
		skills: skills.map((skill) => ({
			id: skill.id,
			title: skill.title,
			summary: skill.summary,
			projectName: skill.projectName,
			projectSummary: skill.projectSummary,
			version: skill.version,
			tags: skill.tags,
			capabilities: skill.capabilities,
			triggers: skill.triggers,
			source: `skills/src/${skill.id}.skill.yaml`,
			outputs: {
				skill: `.agents/skills/${skill.id}/SKILL.md`,
				markdown: `skills/dist/${skill.id}.md`,
			},
		})),
	}

	await writeOrCheckFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`)

	const mode = checkOnly ? 'checked' : 'generated'
	console.log(`Successfully ${mode} ${skills.length} skill(s).`)
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error))
	process.exit(1)
})
