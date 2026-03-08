/**
 * TanStack AI tool definitions.
 *
 * Server tools call the same exported server functions that the UI uses,
 * ensuring a single code path for validation, auth, observability, and data access.
 *
 * Client tools (navigate, invalidateRouter) are definition-only here;
 * their implementations live in ChatDrawer.tsx using the TanStack AI client tools API.
 */
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '../../constants/options'
import { HttpError } from '../../utils/httpError'
import { createTask, deleteTask, getAssignees, getCurrentUser, getTask, getTasks, updateTask } from '../api/serverFns'
import { TaskFilterSchema, TaskIdInputSchema, TaskInputSchema, UpdateTaskInputSchema } from '../schemas/schemas'

/**
 * Wraps an async thunk to catch errors and return them as a structured
 * message instead of crashing the AI agentic loop.
 */
async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | { error: string; code?: number }> {
	try {
		return await fn()
	} catch (err) {
		if (err instanceof HttpError) {
			return { error: err.message, code: err.statusCode }
		}
		const message = err instanceof Error ? err.message : 'An unexpected error occurred'
		return { error: message }
	}
}

// ---------------------------------------------------------------------------
// Tasks (queries)
// ---------------------------------------------------------------------------

const getTasksToolDef = toolDefinition({
	name: 'getTasks',
	description:
		'Get all tasks with optional filters. Supports filtering by status, priority, assignee, and full-text search.',
	inputSchema: TaskFilterSchema,
})

export const getTasksTool = getTasksToolDef.server((args) =>
	withErrorHandling(() => getTasks({ data: TaskFilterSchema.parse(args) })),
)

const getTaskToolDef = toolDefinition({
	name: 'getTask',
	description: 'Get a single task by its unique ID. Returns full task details including timestamps.',
	inputSchema: TaskIdInputSchema,
})

export const getTaskTool = getTaskToolDef.server((args) =>
	withErrorHandling(() => getTask({ data: TaskIdInputSchema.parse(args) })),
)

// ---------------------------------------------------------------------------
// Filters / Discovery
// ---------------------------------------------------------------------------

const getAssigneesToolDef = toolDefinition({
	name: 'getAssignees',
	description: 'Get all distinct assignee emails across all tasks. Useful for discovering who is working on tasks.',
	inputSchema: z.object({}),
})

export const getAssigneesTool = getAssigneesToolDef.server(() => withErrorHandling(() => getAssignees()))

// ---------------------------------------------------------------------------
// Client tools — definition-only (implementations in ChatDrawer.tsx)
// ---------------------------------------------------------------------------

const NavigateSearchSchema = z
	.object({
		status: z.enum(TASK_STATUSES).optional().describe('Filter by status'),
		priority: z.enum(TASK_PRIORITIES).optional().describe('Filter by priority'),
		search: z.string().optional().describe('Full-text search over tasks'),
	})
	.optional()

export const NavigateInputSchema = z.object({
	to: z.string().describe('Path to navigate to (e.g. /, /tasks, /tasks/123)'),
	search: NavigateSearchSchema.describe('Optional query params for /tasks (status, priority, search)'),
})

export const navigateToolDef = toolDefinition({
	name: 'navigate',
	description:
		'Navigate the user to an app page. Use after fetching data when the user wants to open a task or the tasks list. Path must be a user-facing route (e.g. /, /tasks, /tasks/<taskId>). Optional search object for query params on /tasks.',
	inputSchema: NavigateInputSchema,
	outputSchema: z.object({ success: z.boolean() }),
})

export const invalidateRouterToolDef = toolDefinition({
	name: 'invalidateRouter',
	description:
		'Refresh the page data so the user sees up-to-date information. Call after createTask, updateTask, or deleteTask.',
	inputSchema: z.object({}),
	outputSchema: z.object({ success: z.boolean() }),
})

// ---------------------------------------------------------------------------
// Current user context
// ---------------------------------------------------------------------------

const getCurrentUserContextToolDef = toolDefinition({
	name: 'getCurrentUserContext',
	description:
		'Get the current user identity, profile, and a summary of what they can do. Use this to check who is logged in and whether they can create, edit, or delete tasks before calling mutation tools.',
	inputSchema: z.object({}),
})

export const getCurrentUserContextTool = getCurrentUserContextToolDef.server(() =>
	withErrorHandling(async () => {
		const { identity, profile } = await getCurrentUser()
		const permissions = identity.email
			? 'Anyone logged in can create tasks. Only the task creator can edit or delete a task (check task.createdBy).'
			: 'Log in to create, edit, or delete tasks.'
		return { identity, profile, permissions }
	}),
)

// ---------------------------------------------------------------------------
// Mutations — server functions throw on error; safeToolHandler catches.
// ---------------------------------------------------------------------------

const createTaskToolDef = toolDefinition({
	name: 'createTask',
	description:
		'Create a new task. Requires the user to be logged in. Returns the created task or 401 if not authenticated.',
	inputSchema: TaskInputSchema,
})

export const createTaskTool = createTaskToolDef.server((args) =>
	withErrorHandling(async () => {
		const task = await createTask({ data: TaskInputSchema.parse(args) })
		return { task, message: 'Task created.' }
	}),
)

const updateTaskToolDef = toolDefinition({
	name: 'updateTask',
	description:
		'Update an existing task. Requires the user to be logged in and to be the task creator (task.createdBy). Returns 403 if not the creator, 404 if task not found.',
	inputSchema: UpdateTaskInputSchema,
})

export const updateTaskTool = updateTaskToolDef.server((args) =>
	withErrorHandling(async () => {
		const task = await updateTask({ data: UpdateTaskInputSchema.parse(args) })
		return { task, message: 'Task updated.' }
	}),
)

const deleteTaskToolDef = toolDefinition({
	name: 'deleteTask',
	description:
		'Delete a task. Requires the user to be logged in and to be the task creator (task.createdBy). Returns 403 if not the creator, 404 if task not found.',
	inputSchema: TaskIdInputSchema,
})

export const deleteTaskTool = deleteTaskToolDef.server((args) =>
	withErrorHandling(async () => {
		await deleteTask({ data: TaskIdInputSchema.parse(args) })
		return { message: 'Task deleted.' }
	}),
)
