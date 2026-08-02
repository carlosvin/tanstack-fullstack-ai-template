/**
 * Catalog of AI tools and their metadata.
 * Descriptions here are the source of truth for tool introspection endpoints.
 */
import type { z } from 'zod'
import { z as zod } from 'zod'
import { MetadataSectionSchema, NavigateInputSchema, type ToolCategory } from '../schemas/metadataSchemas'
import {
	TaskFilterSchema,
	TaskIdInputSchema,
	TaskInputSchema,
	UpdateTaskInputSchema,
	UserProfileByEmailSchema,
} from '../schemas/schemas'

export interface ToolCatalogEntry {
	name: string
	description: string
	category: ToolCategory
	/** Whether the tool runs on the server or in the browser. */
	execution: 'server' | 'client'
	/** Zod input schema — exported as JSON Schema in metadata responses. */
	inputSchema: z.ZodType
	/** Optional output description for documentation. */
	outputDescription?: string
}

/** All AI tools available in the chat assistant, with introspection metadata. */
export const TOOL_CATALOG: ToolCatalogEntry[] = [
	// Metadata
	{
		name: 'getAppMetadata',
		description:
			'Get comprehensive app metadata: schemas, navigation, vocabularies, tool catalog, capabilities, and runtime info. Optionally filter by section.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({
			sections: zod
				.array(MetadataSectionSchema)
				.optional()
				.describe('Optional subset of metadata sections to return. Omit for the full bundle.'),
		}),
		outputDescription: 'Bundled metadata object with requested sections.',
	},
	{
		name: 'getSchemaMetadata',
		description:
			'Get JSON Schema metadata for one or all domain schemas (Task, TaskInput, TaskFilter, etc.). Includes field descriptions and enum values.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({
			schemaName: zod
				.string()
				.optional()
				.describe('Specific schema name (e.g. "Task", "TaskInput"). Omit to return all schemas.'),
		}),
		outputDescription: 'Map of schema name to JSON Schema plus description.',
	},
	{
		name: 'getToolCatalog',
		description: 'List all AI tools with names, descriptions, categories, execution type, and input JSON Schemas.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({}),
		outputDescription: 'Array of tool metadata entries.',
	},
	{
		name: 'getNavigationMetadata',
		description: 'Get user-facing routes, path patterns, and search/query parameters for in-app navigation.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({}),
		outputDescription: 'Navigation routes with optional search param descriptions.',
	},
	{
		name: 'getVocabularies',
		description: 'Get closed vocabularies (task statuses, priorities) with allowed values and JSON Schema metadata.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({}),
		outputDescription: 'Map of vocabulary name to values and JSON Schema.',
	},
	{
		name: 'getCapabilities',
		description: 'Get what authenticated and anonymous users can do: create/edit/delete tasks, read data, use AI chat.',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({}),
		outputDescription: 'Capability and permission rules for the app.',
	},
	{
		name: 'explainField',
		description:
			'Explain a virtual or computed field that is not fully described by entity schemas (e.g. permission rules, derived summaries).',
		category: 'Metadata',
		execution: 'server',
		inputSchema: zod.object({
			entity: zod.string().describe('Entity name, e.g. "task" or "app".'),
			field: zod.string().describe('Field or concept name, e.g. "permissions" or "creatorOnly".'),
		}),
		outputDescription: 'Field explanation or null if unknown.',
	},
	// Tasks (queries)
	{
		name: 'getTasks',
		description:
			'Get all tasks with optional filters. Supports filtering by status, priority, assignee, and full-text search.',
		category: 'Tasks',
		execution: 'server',
		inputSchema: TaskFilterSchema,
	},
	{
		name: 'getTask',
		description: 'Get a single task by its unique ID. Returns full task details including timestamps.',
		category: 'Tasks',
		execution: 'server',
		inputSchema: TaskIdInputSchema,
	},
	{
		name: 'getAssignees',
		description: 'Get all distinct assignee emails across all tasks. Useful for discovering who is working on tasks.',
		category: 'Tasks',
		execution: 'server',
		inputSchema: zod.object({}),
	},
	// Users
	{
		name: 'getUserProfile',
		description:
			'Look up a user profile by email. Returns name, role, and avatar URL. Useful for resolving assignee display names.',
		category: 'Users',
		execution: 'server',
		inputSchema: UserProfileByEmailSchema,
	},
	{
		name: 'getCurrentUserContext',
		description:
			'Get the current user identity, profile, and a summary of what they can do. Use before mutation tools.',
		category: 'Users',
		execution: 'server',
		inputSchema: zod.object({}),
	},
	// Mutations
	{
		name: 'createTask',
		description: 'Create a new task. Requires the user to be logged in.',
		category: 'Mutations',
		execution: 'server',
		inputSchema: TaskInputSchema,
	},
	{
		name: 'updateTask',
		description: 'Update an existing task. Requires login and task creator (task.createdBy).',
		category: 'Mutations',
		execution: 'server',
		inputSchema: UpdateTaskInputSchema,
	},
	{
		name: 'deleteTask',
		description: 'Delete a task. Requires login and task creator (task.createdBy).',
		category: 'Mutations',
		execution: 'server',
		inputSchema: TaskIdInputSchema,
	},
	// Navigation (client)
	{
		name: 'navigate',
		description:
			'Navigate the user to an app page. Use after fetching data when the user wants to open a task or the tasks list.',
		category: 'Navigation',
		execution: 'client',
		inputSchema: NavigateInputSchema,
	},
	{
		name: 'invalidateRouter',
		description: 'Refresh the page data so the user sees up-to-date information. Call after mutations.',
		category: 'Navigation',
		execution: 'client',
		inputSchema: zod.object({}),
	},
]

const toolByName = new Map(TOOL_CATALOG.map((entry) => [entry.name, entry]))

/** Look up a tool catalog entry by name. */
export function getToolCatalogEntry(name: string): ToolCatalogEntry | undefined {
	return toolByName.get(name)
}
