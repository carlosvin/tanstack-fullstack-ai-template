/**
 * Assembles app metadata from schemas, navigation manifest, tool catalog, and runtime config.
 * All JSON Schema output is derived via z.toJSONSchema() at the boundary.
 */
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { getShellSession, getWebServerEnv } from '../../env/webEnv'
import { getAIAdapterService } from '../ai/adapter'
import { APP_NAVIGATION } from '../ai/navigationManifest'
import type { MetadataSection } from '../schemas/metadataSchemas'
import { TaskPrioritySchema, TaskStatusSchema } from '../schemas/schemas'
import { getSchemaRegistryEntry, getSchemaRegistryNames, SCHEMA_REGISTRY } from './schemaRegistry'
import { TOOL_CATALOG, type ToolCatalogEntry } from './toolCatalog'
import { explainVirtualField, VIRTUAL_FIELD_REGISTRY } from './virtualFields'

/** JSON-compatible value for server function serialization. */
type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type JsonSchemaDocument = { [key: string]: JsonValue }

/** Non-secret runtime environment info safe for metadata export. */
export interface EnvironmentMetadata {
	env: string | undefined
	repositoryType: 'seed' | 'mongo'
	authHeaderName: string
}

/** Application capability rules for AI and UI consumers. */
export interface CapabilitiesMetadata {
	anonymous: {
		canReadTasks: boolean
		canMutateTasks: boolean
		canUseAIChat: boolean
	}
	authenticated: {
		canCreateTasks: boolean
		canUpdateOwnTasks: boolean
		canDeleteOwnTasks: boolean
		canReadTasks: boolean
		canUseAIChat: boolean
	}
	rules: string[]
}

function toJsonSchema(schema: z.ZodType): JsonSchemaDocument {
	return z.toJSONSchema(schema) as JsonSchemaDocument
}

function buildAppSection() {
	const session = getShellSession()
	return {
		name: session.app.name,
		version: session.app.version,
	}
}

function buildEnvironmentSection(): EnvironmentMetadata {
	const env = getWebServerEnv()
	const repositoryType =
		env.REPOSITORY_TYPE === 'seed' || env.REPOSITORY_TYPE === 'mongo'
			? env.REPOSITORY_TYPE
			: env.MONGODB_URI
				? 'mongo'
				: 'seed'

	return {
		env: env.ENV,
		repositoryType,
		authHeaderName: env.AUTH_HEADER_NAME?.trim() || 'Authorization',
	}
}

function buildAiSection() {
	const ai = getAIAdapterService()
	return {
		available: ai.isConfigured(),
		missingConfigMessage: ai.getMissingConfigMessage(),
	}
}

function buildNavigationSection() {
	return {
		routes: APP_NAVIGATION,
	}
}

function buildVocabulariesSection() {
	return {
		taskStatus: {
			values: [...TASK_STATUSES],
			jsonSchema: toJsonSchema(TaskStatusSchema),
		},
		taskPriority: {
			values: [...TASK_PRIORITIES],
			jsonSchema: toJsonSchema(TaskPrioritySchema),
		},
	}
}

function buildSchemasSection(schemaName?: string) {
	const entries = schemaName ? SCHEMA_REGISTRY.filter((entry) => entry.name === schemaName) : SCHEMA_REGISTRY

	return Object.fromEntries(
		entries.map((entry) => [
			entry.name,
			{
				description: entry.description,
				jsonSchema: toJsonSchema(entry.schema),
			},
		]),
	)
}

function serializeToolEntry(entry: ToolCatalogEntry) {
	return {
		name: entry.name,
		description: entry.description,
		category: entry.category,
		execution: entry.execution,
		inputJsonSchema: toJsonSchema(entry.inputSchema),
		outputDescription: entry.outputDescription,
	}
}

function buildToolsSection() {
	return TOOL_CATALOG.map(serializeToolEntry)
}

function buildCapabilitiesSection(): CapabilitiesMetadata {
	const ai = getAIAdapterService()
	return {
		anonymous: {
			canReadTasks: true,
			canMutateTasks: false,
			canUseAIChat: ai.isConfigured(),
		},
		authenticated: {
			canCreateTasks: true,
			canUpdateOwnTasks: true,
			canDeleteOwnTasks: true,
			canReadTasks: true,
			canUseAIChat: ai.isConfigured(),
		},
		rules: [
			'Anyone can read tasks without logging in.',
			'Creating tasks requires authentication (JWT in Authorization header).',
			'Updating or deleting a task requires authentication and matching task.createdBy.',
			'Use getCurrentUserContext to check who is logged in before mutations.',
		],
	}
}

const sectionBuilders: Record<MetadataSection, (schemaName?: string) => unknown> = {
	app: () => buildAppSection(),
	environment: () => buildEnvironmentSection(),
	ai: () => buildAiSection(),
	navigation: () => buildNavigationSection(),
	vocabularies: () => buildVocabulariesSection(),
	schemas: (schemaName) => buildSchemasSection(schemaName),
	tools: () => buildToolsSection(),
	capabilities: () => buildCapabilitiesSection(),
}

/** Build a metadata bundle, optionally filtered to specific sections. */
export function buildAppMetadata(sections?: MetadataSection[]): Record<string, JsonValue> {
	const activeSections = sections?.length ? sections : (Object.keys(sectionBuilders) as MetadataSection[])
	const result: Record<string, JsonValue> = {}

	for (const section of activeSections) {
		result[section] = sectionBuilders[section]() as JsonValue
	}

	return result
}

/** JSON Schema metadata for one or all registered schemas. */
export function buildSchemaMetadata(schemaName?: string) {
	if (schemaName && !getSchemaRegistryEntry(schemaName)) {
		return { schemas: {}, availableSchemaNames: getSchemaRegistryNames(), unknownSchema: schemaName }
	}

	return {
		schemas: buildSchemasSection(schemaName),
		availableSchemaNames: getSchemaRegistryNames(),
	}
}

/** Tool catalog with JSON Schema input definitions. */
export function buildToolCatalogMetadata() {
	return {
		tools: buildToolsSection(),
		categories: [...new Set(TOOL_CATALOG.map((entry) => entry.category))],
	}
}

/** Navigation routes and search params. */
export function buildNavigationMetadata() {
	return buildNavigationSection()
}

/** Closed vocabularies with JSON Schema. */
export function buildVocabulariesMetadata() {
	return buildVocabulariesSection()
}

/** Capability and permission rules. */
export function buildCapabilitiesMetadata() {
	return buildCapabilitiesSection()
}

/** Explain a virtual/computed field. */
export function buildFieldExplanation(entity: string, field: string) {
	const match = explainVirtualField(entity, field)
	if (!match) {
		return {
			entity,
			field,
			explanation: null,
			availableVirtualFields: VIRTUAL_FIELD_REGISTRY.map((entry) => ({
				entity: entry.entity,
				field: entry.field,
			})),
		}
	}

	return {
		entity: match.entity,
		field: match.field,
		explanation: match.description,
		derivedFrom: match.derivedFrom,
	}
}
