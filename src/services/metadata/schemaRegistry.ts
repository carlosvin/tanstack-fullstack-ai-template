/**
 * Registry of tools-layer Zod schemas exposed as JSON Schema metadata.
 * Single source of truth for schema introspection — used by server functions and AI tools.
 */
import type { z } from 'zod'
import {
	AppErrorSchema,
	BrowserContextSchema,
	TaskFilterSchema,
	TaskIdInputSchema,
	TaskInputSchema,
	TaskPrioritySchema,
	TaskSchema,
	TaskStatusSchema,
	UpdateTaskInputSchema,
	UserIdentitySchema,
	UserProfileByEmailSchema,
	UserProfileSchema,
} from '../schemas/schemas'

export interface SchemaRegistryEntry {
	/** Stable identifier used in API queries (e.g. "Task", "TaskInput"). */
	name: string
	/** Human-readable summary for AI and UI consumers. */
	description: string
	/** Tools-layer Zod schema — converted to JSON Schema at the boundary. */
	schema: z.ZodType
}

/** All public tools-layer schemas available for metadata export. */
export const SCHEMA_REGISTRY: SchemaRegistryEntry[] = [
	{
		name: 'Task',
		description: 'Full task entity returned by queries and mutations.',
		schema: TaskSchema,
	},
	{
		name: 'TaskInput',
		description: 'Input shape for creating or updating a task.',
		schema: TaskInputSchema,
	},
	{
		name: 'TaskFilter',
		description: 'Optional filters for listing tasks (status, priority, assignee, search).',
		schema: TaskFilterSchema,
	},
	{
		name: 'TaskIdInput',
		description: 'Single task identifier wrapper.',
		schema: TaskIdInputSchema,
	},
	{
		name: 'UpdateTaskInput',
		description: 'Task ID plus partial updates for updateTask.',
		schema: UpdateTaskInputSchema,
	},
	{
		name: 'TaskStatus',
		description: 'Closed vocabulary of task status values.',
		schema: TaskStatusSchema,
	},
	{
		name: 'TaskPriority',
		description: 'Closed vocabulary of task priority values.',
		schema: TaskPrioritySchema,
	},
	{
		name: 'UserIdentity',
		description: 'Authenticated user identity extracted from the JWT.',
		schema: UserIdentitySchema,
	},
	{
		name: 'UserProfile',
		description: 'Persisted user profile (name, role, avatar, preferences).',
		schema: UserProfileSchema,
	},
	{
		name: 'UserProfileByEmail',
		description: 'Lookup input for fetching a user profile by email.',
		schema: UserProfileByEmailSchema,
	},
	{
		name: 'BrowserContext',
		description: 'Client browser context sent with chat requests (timezone, locale, location).',
		schema: BrowserContextSchema,
	},
	{
		name: 'AppError',
		description: 'Normalized error shape returned from mutations.',
		schema: AppErrorSchema,
	},
]

const schemaByName = new Map(SCHEMA_REGISTRY.map((entry) => [entry.name, entry]))

/** Look up a registry entry by name. Returns undefined when not found. */
export function getSchemaRegistryEntry(name: string): SchemaRegistryEntry | undefined {
	return schemaByName.get(name)
}

/** All registered schema names. */
export function getSchemaRegistryNames(): string[] {
	return SCHEMA_REGISTRY.map((entry) => entry.name)
}
