/**
 * Zod schemas — single source of truth for all domain types and runtime validation.
 *
 * Every field uses .describe() so that generated JSON Schemas (AI tools, OpenAPI, etc.)
 * carry rich semantic metadata without separate documentation.
 *
 * TypeScript types are inferred via z.infer<> — never define standalone interfaces
 * for types that are validated at runtime.
 */
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TaskStatusSchema = z.enum(TASK_STATUSES).describe('Current status of the task')

export const TaskPrioritySchema = z.enum(TASK_PRIORITIES).describe('Priority level of the task')

// ---------------------------------------------------------------------------
// User Identity (extracted from JWT by auth middleware)
// ---------------------------------------------------------------------------

export const UserIdentitySchema = z.object({
	email: z.string().describe('Email address of the authenticated user'),
	name: z.string().describe('Display name of the user'),
	groups: z.array(z.string()).describe('Group memberships from the identity provider'),
})

export type UserIdentity = z.infer<typeof UserIdentitySchema>

// ---------------------------------------------------------------------------
// User Profile (stored in the repository)
// ---------------------------------------------------------------------------

export const UserProfileSchema = z.object({
	email: z.string().describe('Email address (primary key, matches JWT identity)'),
	name: z.string().describe('Display name'),
	role: z.string().optional().describe('User role in the application'),
	avatarUrl: z.string().optional().describe('URL to the user avatar image'),
	preferences: z
		.object({
			theme: z.enum(['light', 'dark', 'auto']).default('auto').describe('Preferred color scheme'),
		})
		.optional()
		.describe('User preferences'),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// ---------------------------------------------------------------------------
// Browser Context (sent by the client with each chat request)
// ---------------------------------------------------------------------------

export const BrowserContextSchema = z.object({
	timezone: z.string().describe('IANA timezone of the user browser, e.g. "America/New_York"'),
	locale: z.string().describe('Browser locale, e.g. "en-US"'),
	currentTime: z.string().describe('ISO 8601 timestamp of the current time in the user browser'),
	currentPathname: z.string().optional().describe('Current browser pathname, e.g. "/tasks/abc123"'),
	currentSearch: z.string().optional().describe('Current browser query string, e.g. "?status=done"'),
	currentHref: z
		.string()
		.optional()
		.describe('Current full browser URL, e.g. "https://app.local/tasks/abc123?status=done"'),
})

export type BrowserContext = z.infer<typeof BrowserContextSchema>

// ---------------------------------------------------------------------------
// Task — the sample domain entity
// ---------------------------------------------------------------------------

export const TaskInputSchema = z.object({
	title: z.string().min(1).describe('Short title summarizing the task'),
	description: z.string().optional().describe('Detailed description of what needs to be done'),
	status: TaskStatusSchema.default('pending').describe('Current status of the task'),
	priority: TaskPrioritySchema.default('medium').describe('Priority level of the task'),
	assignee: z.string().optional().describe('Email of the person assigned to this task'),
})

export type TaskInput = z.infer<typeof TaskInputSchema>

export const TaskSchema = TaskInputSchema.extend({
	id: z.string().describe('Unique identifier for the task'),
	createdAt: z.string().describe('ISO 8601 timestamp when the task was created'),
	updatedAt: z.string().describe('ISO 8601 timestamp when the task was last updated'),
	createdBy: z.string().optional().describe('Email of the user who created the task'),
})

export type Task = z.infer<typeof TaskSchema>

// ---------------------------------------------------------------------------
// Query / Filter schemas
// ---------------------------------------------------------------------------

export const TaskFilterSchema = z.object({
	status: TaskStatusSchema.optional().describe('Filter by task status'),
	priority: TaskPrioritySchema.optional().describe('Filter by task priority'),
	assignee: z.string().optional().describe('Filter by assignee email'),
	search: z.string().optional().describe('Full-text search across title and description'),
})

export type TaskFilter = z.infer<typeof TaskFilterSchema>

export const UserProfileByEmailSchema = z.object({
	email: z.string().describe('Email address of the user whose profile to look up'),
})

export const TaskIdInputSchema = z.object({
	taskId: z.string().describe('The unique ID of the task'),
})

export const UpdateTaskInputSchema = TaskIdInputSchema.extend({
	updates: TaskInputSchema.partial().describe('Fields to update (title, description, status, priority, assignee)'),
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>

// ---------------------------------------------------------------------------
// API response wrapper for mutations
// ---------------------------------------------------------------------------

export const AppErrorSchema = z.object({
	message: z.string().describe('Human-readable error message'),
	code: z.number().optional().describe('HTTP status code'),
})

export type AppError = z.infer<typeof AppErrorSchema>

/** Normalized mutation response. UI callers get this from `processResponse()`. */
export interface ProcessedResponse<T> {
	data?: T
	error?: AppError
}
