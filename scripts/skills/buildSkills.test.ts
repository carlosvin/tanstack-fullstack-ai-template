import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildSkills } from './buildSkills.mjs'

const createdDirs: string[] = []

async function createWorkspace(skillContent: string) {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-build-'))
	createdDirs.push(rootDir)

	await mkdir(path.join(rootDir, 'skills', 'src'), { recursive: true })
	await mkdir(path.join(rootDir, 'skills', 'spec'), { recursive: true })

	const schema = await readFile(path.join(process.cwd(), 'skills', 'spec', 'skill.schema.json'), 'utf8')
	await writeFile(path.join(rootDir, 'skills', 'spec', 'skill.schema.json'), schema, 'utf8')
	await writeFile(path.join(rootDir, 'skills', 'src', 'example.skill.yaml'), skillContent, 'utf8')

	return rootDir
}

afterEach(async () => {
	await Promise.all(createdDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

const validSkill = `id: tanstack-fullstack-pattern
title: TanStack Fullstack Pattern
summary: Apply the TanStack Start fullstack architectural pattern with interface-first boundaries.
projectName: TanStack AI-Promptable Full-Stack Template
projectSummary: A production-ready TanStack Start template designed to make internal tools AI promptable by default.
version: 1.1.0
author:
  name: Carlos Martin-Sanchez
  url: https://github.com/carlosvin
license: MIT
homepage: https://github.com/carlosvin/tanstack-fullstack-ai-template
repository: https://github.com/carlosvin/tanstack-fullstack-ai-template
documentationUrl: https://github.com/carlosvin/tanstack-fullstack-ai-template/blob/main/skills/README.md
status: stable
supportedTools:
  - id: windsurf
    name: Windsurf
    installMode: native
    tested: false
tags:
  - tanstack-start
capabilities:
  - AI promptable application architecture
triggers:
  - TanStack Start project
inputs:
  - Existing or new TanStack Start codebase
outputs:
  - Interface-first architecture with swappable implementations
constraints:
  - External services are accessed through interfaces only
steps:
  - Define schemas as source of truth and infer types
examples:
  - input: Add a new domain entity to the template
    output: Update schema, repository interfaces, server functions, routes, and AI tools
content: |
  # TanStack Fullstack Pattern

  Example content.
`

describe('buildSkills', () => {
	it('generates skill outputs with publication metadata in the registry', async () => {
		const rootDir = await createWorkspace(validSkill)

		await buildSkills({ rootDir })

		const registry = await readFile(path.join(rootDir, 'skills', 'registry.json'), 'utf8')
		const parsedRegistry = JSON.parse(registry)
		expect(parsedRegistry.skills[0].author.name).toBe('Carlos Martin-Sanchez')
		expect(parsedRegistry.skills[0].supportedTools[0].id).toBe('windsurf')
		expect(parsedRegistry.skills[0].outputsByFormat.skill).toBe('.agents/skills/tanstack-fullstack-pattern/SKILL.md')

		const agentSkill = await readFile(
			path.join(rootDir, '.agents', 'skills', 'tanstack-fullstack-pattern', 'SKILL.md'),
			'utf8',
		)
		expect(agentSkill).toContain('name: tanstack-fullstack-pattern')
	})

	it('fails with a clear error when YAML is malformed', async () => {
		const rootDir = await createWorkspace('id: tanstack-fullstack-pattern\nsummary: [broken\n')

		await expect(buildSkills({ rootDir })).rejects.toThrow(/Failed to parse YAML/)
	})

	it('fails when duplicate skill IDs are present', async () => {
		const rootDir = await createWorkspace(validSkill)
		await writeFile(path.join(rootDir, 'skills', 'src', 'duplicate.skill.yaml'), validSkill, 'utf8')

		await expect(buildSkills({ rootDir })).rejects.toThrow(/Duplicate skill IDs found/)
	})

	it('detects drift in check mode', async () => {
		const rootDir = await createWorkspace(validSkill)
		await buildSkills({ rootDir })
		await writeFile(
			path.join(rootDir, '.agents', 'skills', 'tanstack-fullstack-pattern', 'SKILL.md'),
			'drift\n',
			'utf8',
		)

		await expect(buildSkills({ rootDir, checkOnly: true })).rejects.toThrow(/Generated file is out of date/)
	})
})
