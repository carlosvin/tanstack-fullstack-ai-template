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
import {
	DISTINCT_VALUE_FIELDS,
	TASK_DUE_FILTERS,
	TASK_PRIORITIES,
	TASK_SORTS,
	TASK_STATUSES,
} from '../../constants/options'
import { OptionalDeploymentEnvSchema } from './runtimeEnv'
import { AppMetaSchema } from './shellSession'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TaskStatusSchema = z.enum(TASK_STATUSES).describe('Current status of the task')

export const TaskPrioritySchema = z.enum(TASK_PRIORITIES).describe('Priority level of the task')

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type TaskPriority = z.infer<typeof TaskPrioritySchema>

/** Widget empty values (`null`, `''`) become omitted optional enums. */
function clearedSelectValue(value: unknown): unknown {
	return value == null || value === '' ? undefined : value
}

/** Parse a status coming from an untyped widget (`string | null`). */
export const OptionalTaskStatusSchema = z.preprocess(clearedSelectValue, TaskStatusSchema.optional())

/** Parse a priority coming from an untyped widget (`string | null`). */
export const OptionalTaskPrioritySchema = z.preprocess(clearedSelectValue, TaskPrioritySchema.optional())

// ---------------------------------------------------------------------------
// User Identity (extracted from JWT by auth middleware)
// ---------------------------------------------------------------------------

export const UserIdentitySchema = z.object({
	email: z.string().describe('Email address of the authenticated user'),
	name: z.string().describe('Display name of the user'),
	groups: z.array(z.string()).describe('Group memberships from the identity provider'),
})

export type UserIdentity = z.infer<typeof UserIdentitySchema>

/** Untrusted JWT payload claims before defaults are applied. */
export const JwtIdentityClaimsSchema = z.object({
	email: z.string().optional(),
	name: z.string().optional(),
	groups: z.array(z.string()).optional(),
})

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

export const CurrentUserSchema = z.object({
	identity: UserIdentitySchema.describe('Authenticated user identity from the access ticket'),
	profile: UserProfileSchema.nullable().describe('Repository profile when available'),
	isTestUser: z.boolean().describe('True when the server auto-generated a demo test user'),
	roles: z.array(z.string()).describe('Combined identity groups and repository roles'),
})

export type CurrentUser = z.infer<typeof CurrentUserSchema>

export const UserAccessSchema = z.object({
	email: z.string().describe('Email address of the user whose access to look up'),
	name: z.string().describe('Display name'),
	roles: z.array(z.string()).describe('Repository-backed roles for this user'),
})

export type UserAccess = z.infer<typeof UserAccessSchema>

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
// App runtime info (AI tool + public deployment metadata)
// ---------------------------------------------------------------------------

export const AppRuntimeInfoSchema = z.object({
	app: AppMetaSchema.describe('Application name and version'),
	ENV: OptionalDeploymentEnvSchema.describe('Deployment name: development, staging, or production'),
})

export type AppRuntimeInfo = z.infer<typeof AppRuntimeInfoSchema>

// ---------------------------------------------------------------------------
// Task — the sample domain entity
// ---------------------------------------------------------------------------

/** Calendar date with no time and no timezone shift. `null` clears a stored due date. */
export const CalendarDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.describe('Calendar date in YYYY-MM-DD')

export const TaskDueFilterSchema = z
	.enum(TASK_DUE_FILTERS)
	.describe('overdue = open and due before asOf; unscheduled = no due date; scheduled = has a due date')

export const TaskSortSchema = z
	.enum(TASK_SORTS)
	.describe('Use due to list the soonest due date first. Omit to keep recently updated first.')

export const TaskInputSchema = z.object({
	title: z.string().min(1).describe('Short title summarizing the task'),
	description: z.string().optional().describe('Detailed description of what needs to be done'),
	status: TaskStatusSchema.default('pending').describe('Current status of the task'),
	priority: TaskPrioritySchema.default('medium').describe('Priority level of the task'),
	assignee: z.string().optional().describe('Email of the person assigned to this task'),
	dueDate: CalendarDateSchema.nullable()
		.optional()
		.describe('Optional calendar due date, YYYY-MM-DD. Null clears it. Done and cancelled tasks are never overdue.'),
})

export type TaskInput = z.infer<typeof TaskInputSchema>

export const TaskSchema = TaskInputSchema.extend({
	id: z.string().describe('Unique identifier for the task'),
	createdAt: z.string().describe('ISO 8601 timestamp when the task was created'),
	updatedAt: z.string().describe('ISO 8601 timestamp when the task was last updated'),
	createdBy: z.string().optional().describe('Email of the user who created the task'),
	lastModifiedBy: z.string().optional().describe('Email of the user who last modified the task'),
})

export type Task = z.infer<typeof TaskSchema>

// ---------------------------------------------------------------------------
// Query / Filter schemas
// ---------------------------------------------------------------------------

export const TaskFilterSchema = z.object({
	status: TaskStatusSchema.optional().describe('Filter by status: pending | in-progress | done | cancelled'),
	priority: TaskPrioritySchema.optional().describe('Filter by priority: low | medium | high | critical'),
	assignee: z
		.string()
		.optional()
		.describe(
			'Assignee email, only when the user names that person. Omit for "my tasks" and for an unauthenticated user.',
		),
	search: z.string().optional().describe('Full-text search over tasks'),
	due: TaskDueFilterSchema.optional(),
	asOf: CalendarDateSchema.optional().describe(
		'Local calendar date YYYY-MM-DD used to decide overdue. Take the date from the user timezone in browser context.',
	),
	dueOnOrBefore: CalendarDateSchema.optional().describe(
		'Keep tasks whose due date is on or before this YYYY-MM-DD date',
	),
	sort: TaskSortSchema.optional(),
})

export type TaskFilter = z.infer<typeof TaskFilterSchema>

/** How showTasksView draws the list. Cards are the default. */
export const TaskListPresentationSchema = z
	.enum(['cards', 'table', 'kanban', 'timeline'])
	.describe(
		'How to draw the list. "table" for a table. "kanban" for status lanes. "timeline" for due-date groups. "cards" or omit for the card grid.',
	)

export const ShowTasksViewInputSchema = TaskFilterSchema.extend({
	presentation: TaskListPresentationSchema.optional(),
})

export type ShowTasksViewInput = z.infer<typeof ShowTasksViewInputSchema>

/** URL search for the tasks list, including assignee, due filters, and bulk selection. */
export const TasksListSearchSchema = TaskFilterSchema.extend({
	selected: z
		.array(z.string().min(1))
		.max(50)
		.optional()
		.describe('Task ids selected for a bulk status change. Omitted from the task query.'),
})

export type TasksListSearch = z.infer<typeof TasksListSearchSchema>

export const AssigneeOptionSchema = z.object({
	email: z.string().describe('Assignee email present on at least one task'),
	name: z.string().optional().describe('Profile display name when the repository has one'),
})

export type AssigneeOption = z.infer<typeof AssigneeOptionSchema>

export const AssigneeOptionListSchema = z.array(AssigneeOptionSchema)

export const BulkTaskStatusInputSchema = z.object({
	taskIds: z.array(z.string().min(1)).min(1).max(50).describe('Task ids to update'),
	status: TaskStatusSchema.describe('Status to set on every task the caller created'),
})

export type BulkTaskStatusInput = z.infer<typeof BulkTaskStatusInputSchema>

export const BulkTaskStatusRefusalSchema = z.object({
	taskId: z.string().describe('Task id that was not changed'),
	title: z.string().optional().describe('Task title when the row exists'),
	reason: z.string().describe('Why this row was left unchanged'),
})

export const BulkTaskStatusResultSchema = z.object({
	updated: z.array(TaskSchema).describe('Tasks whose status changed'),
	refused: z.array(BulkTaskStatusRefusalSchema).describe('Tasks left unchanged'),
})

export type BulkTaskStatusResult = z.infer<typeof BulkTaskStatusResultSchema>

/** Filterable task fields that support distinct-value discovery against real data. */
export const DistinctValueFieldSchema = z
	.enum(DISTINCT_VALUE_FIELDS)
	.describe('Task field to collect distinct values from: assignee, status, or priority')

export const DistinctValuesInputSchema = z.object({
	field: DistinctValueFieldSchema,
})

export type DistinctValuesInput = z.infer<typeof DistinctValuesInputSchema>

export const DistinctValueListSchema = z
	.array(z.string().min(1))
	.describe('Distinct nonempty values currently present for a filterable task field')

export const UserProfileByEmailSchema = z.object({
	email: z.string().describe('Email address of the user whose profile to look up'),
})

export const TaskIdInputSchema = z.object({
	taskId: z.string().describe('The unique ID of the task'),
})

export const UpdateTaskInputSchema = TaskIdInputSchema.extend({
	updates: TaskInputSchema.partial().describe(
		'Fields to update (title, description, status, priority, assignee, dueDate). Null dueDate clears the date.',
	),
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
