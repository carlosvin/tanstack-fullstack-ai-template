/**
 * Schemas for metadata introspection endpoints and tool catalog typing.
 */
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'

/** Sections available in getAppMetadata responses. */
export const METADATA_SECTION_VALUES = [
	'app',
	'environment',
	'ai',
	'navigation',
	'vocabularies',
	'schemas',
	'tools',
	'capabilities',
] as const

export const MetadataSectionSchema = z
	.enum(METADATA_SECTION_VALUES)
	.describe('A subsection of app metadata to include in the response.')

export type MetadataSection = z.infer<typeof MetadataSectionSchema>

export const MetadataSectionsInputSchema = z.object({
	sections: z
		.array(MetadataSectionSchema)
		.optional()
		.describe('Optional subset of metadata sections. Omit to return the full bundle.'),
})

export const SchemaMetadataInputSchema = z.object({
	schemaName: z
		.string()
		.optional()
		.describe('Specific schema name (e.g. "Task", "TaskInput"). Omit to return all registered schemas.'),
})

export const ExplainFieldInputSchema = z.object({
	entity: z.string().describe('Entity name, e.g. "task" or "app".'),
	field: z.string().describe('Field or concept name, e.g. "permissions" or "creatorOnly".'),
})

export const TOOL_CATEGORY_VALUES = ['Metadata', 'Tasks', 'Users', 'Mutations', 'Navigation'] as const

export const ToolCategorySchema = z
	.enum(TOOL_CATEGORY_VALUES)
	.describe('Groups AI tools by domain for introspection and documentation.')
	.meta({ title: 'Tool category' })

export type ToolCategory = z.infer<typeof ToolCategorySchema>

const NavigateSearchSchema = z
	.object({
		status: z.enum(TASK_STATUSES).optional().describe('Filter by status'),
		priority: z.enum(TASK_PRIORITIES).optional().describe('Filter by priority'),
		search: z.string().optional().describe('Full-text search over tasks'),
	})
	.optional()

/** Input schema for the navigate client tool — shared between tools and metadata catalog. */
export const NavigateInputSchema = z.object({
	to: z.string().describe('Path to navigate to (e.g. /, /tasks, /tasks/123)'),
	search: NavigateSearchSchema.describe('Optional query params for /tasks (status, priority, search)'),
})
