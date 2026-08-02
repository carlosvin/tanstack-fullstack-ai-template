import { describe, expect, it } from 'vitest'
import {
	buildAppMetadata,
	buildCapabilitiesMetadata,
	buildFieldExplanation,
	buildSchemaMetadata,
	buildToolCatalogMetadata,
	buildVocabulariesMetadata,
	type JsonValue,
} from './buildAppMetadata'
import { getSchemaRegistryNames } from './schemaRegistry'

describe('buildAppMetadata', () => {
	it('returns all sections when no filter is provided', () => {
		const metadata = buildAppMetadata()

		expect(metadata).toHaveProperty('app')
		expect(metadata).toHaveProperty('environment')
		expect(metadata).toHaveProperty('ai')
		expect(metadata).toHaveProperty('navigation')
		expect(metadata).toHaveProperty('vocabularies')
		expect(metadata).toHaveProperty('schemas')
		expect(metadata).toHaveProperty('tools')
		expect(metadata).toHaveProperty('capabilities')
	})

	it('returns only requested sections when filtered', () => {
		const metadata = buildAppMetadata(['app', 'vocabularies'])

		expect(metadata).toHaveProperty('app')
		expect(metadata).toHaveProperty('vocabularies')
		expect(metadata).not.toHaveProperty('tools')
	})

	it('includes app name and version in app section', () => {
		const metadata = buildAppMetadata(['app']) as { app: { name: string; version: string } }

		expect(metadata.app.name).toBeTruthy()
		expect(metadata.app.version).toBeTruthy()
	})
})

describe('buildSchemaMetadata', () => {
	it('returns all schemas when schemaName is omitted', () => {
		const result = buildSchemaMetadata()

		expect(result.availableSchemaNames).toEqual(getSchemaRegistryNames())
		expect(Object.keys(result.schemas)).toContain('Task')
		expect(Object.keys(result.schemas)).toContain('TaskInput')
	})

	it('returns a single schema when schemaName is provided', () => {
		const result = buildSchemaMetadata('Task')

		expect(Object.keys(result.schemas)).toEqual(['Task'])
		const schemas = result.schemas as Record<string, { jsonSchema: { properties: Record<string, JsonValue> } }>
		expect(schemas.Task.jsonSchema.properties).toHaveProperty('title')
		expect(schemas.Task.jsonSchema.properties).toHaveProperty('status')
	})

	it('reports unknown schema names without throwing', () => {
		const result = buildSchemaMetadata('NotARealSchema')

		expect(result.unknownSchema).toBe('NotARealSchema')
		expect(result.schemas).toEqual({})
	})
})

describe('buildToolCatalogMetadata', () => {
	it('includes metadata introspection tools and task tools', () => {
		const result = buildToolCatalogMetadata()
		const names = result.tools.map((tool) => tool.name)

		expect(names).toContain('getAppMetadata')
		expect(names).toContain('getTasks')
		expect(names).toContain('navigate')
		expect(result.categories).toContain('Metadata')
	})
})

describe('buildVocabulariesMetadata', () => {
	it('includes task status and priority vocabularies with JSON Schema', () => {
		const result = buildVocabulariesMetadata()

		expect(result.taskStatus.values).toContain('pending')
		expect(result.taskPriority.values).toContain('high')
		expect(result.taskStatus.jsonSchema).toHaveProperty('enum')
	})
})

describe('buildCapabilitiesMetadata', () => {
	it('documents anonymous read-only and authenticated mutation rules', () => {
		const result = buildCapabilitiesMetadata()

		expect(result.anonymous.canReadTasks).toBe(true)
		expect(result.anonymous.canMutateTasks).toBe(false)
		expect(result.authenticated.canCreateTasks).toBe(true)
		expect(result.rules.length).toBeGreaterThan(0)
	})
})

describe('buildFieldExplanation', () => {
	it('returns explanation for known virtual fields', () => {
		const result = buildFieldExplanation('task', 'permissions')

		expect(result.explanation).toContain('creator')
	})

	it('returns available fields when unknown', () => {
		const result = buildFieldExplanation('task', 'nonexistent')

		expect(result.explanation).toBeNull()
		expect(result.availableVirtualFields?.length).toBeGreaterThan(0)
	})
})
