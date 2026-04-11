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
import {
	createTask,
	deleteTask,
	getAssignees,
	getCurrentUser,
	getTask,
	getTasks,
	getUserProfile,
	updateTask,
} from '../api/serverFns'
import {
	TaskFilterSchema,
	TaskIdInputSchema,
	TaskInputSchema,
	UpdateTaskInputSchema,
	UserProfileByEmailSchema,
} from '../schemas/schemas'
import { createSafeServerTool } from './serverTool'

// ---------------------------------------------------------------------------
// Tasks (queries)
// ---------------------------------------------------------------------------

const getTasksToolDef = toolDefinition({
	name: 'getTasks',
	description:
		'Get all tasks with optional filters. Supports filtering by status, priority, assignee, and full-text search.',
	inputSchema: TaskFilterSchema,
})

/** AI server tool: query tasks with optional filters. */
export const getTasksTool = createSafeServerTool(getTasksToolDef, async (args) =>
	getTasks({ data: TaskFilterSchema.parse(args) }),
)

const getTaskToolDef = toolDefinition({
	name: 'getTask',
	description: 'Get a single task by its unique ID. Returns full task details including timestamps.',
	inputSchema: TaskIdInputSchema,
})

/** AI server tool: fetch a single task by ID. */
export const getTaskTool = createSafeServerTool(getTaskToolDef, async (args) =>
	getTask({ data: TaskIdInputSchema.parse(args) }),
)

// ---------------------------------------------------------------------------
// Filters / Discovery
// ---------------------------------------------------------------------------

const getAssigneesToolDef = toolDefinition({
	name: 'getAssignees',
	description: 'Get all distinct assignee emails across all tasks. Useful for discovering who is working on tasks.',
	inputSchema: z.object({}),
})

/** AI server tool: list distinct assignee emails. */
export const getAssigneesTool = createSafeServerTool(getAssigneesToolDef, async () => getAssignees())

// ---------------------------------------------------------------------------
// User profile lookup
// ---------------------------------------------------------------------------

const getUserProfileToolDef = toolDefinition({
	name: 'getUserProfile',
	description:
		'Look up a user profile by email. Returns name, role, and avatar URL. Useful for resolving assignee display names from emails returned by getAssignees or task.assignee.',
	inputSchema: UserProfileByEmailSchema,
})

/** AI server tool: resolve a user profile from an email address. */
export const getUserProfileTool = createSafeServerTool(getUserProfileToolDef, async (args) =>
	getUserProfile({ data: UserProfileByEmailSchema.parse(args) }),
)

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

/** Input schema for the navigate client tool. */
export const NavigateInputSchema = z.object({
	to: z.string().describe('Path to navigate to (e.g. /, /tasks, /tasks/123)'),
	search: NavigateSearchSchema.describe('Optional query params for /tasks (status, priority, search)'),
})

/** AI client tool definition: trigger in-app navigation. Implementation in ChatDrawer.tsx. */
export const navigateToolDef = toolDefinition({
	name: 'navigate',
	description:
		'Navigate the user to an app page. Use after fetching data when the user wants to open a task or the tasks list. Path must be a user-facing route (e.g. /, /tasks, /tasks/<taskId>). Optional search object for query params on /tasks.',
	inputSchema: NavigateInputSchema,
	outputSchema: z.object({ success: z.boolean() }),
})

/** AI client tool definition: refresh page data after mutations. Implementation in ChatDrawer.tsx. */
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

/** AI server tool: returns identity, profile, and a permissions summary for the current user. */
export const getCurrentUserContextTool = createSafeServerTool(getCurrentUserContextToolDef, async () => {
	const { identity, profile } = await getCurrentUser()
	const permissions = identity.email
		? 'Anyone logged in can create tasks. Only the task creator can edit or delete a task (check task.createdBy).'
		: 'Log in to create, edit, or delete tasks.'
	return { identity, profile, permissions }
})

// ---------------------------------------------------------------------------
// Mutations — server functions throw on error; safeToolHandler catches.
// ---------------------------------------------------------------------------

const createTaskToolDef = toolDefinition({
	name: 'createTask',
	description:
		'Create a new task. Requires the user to be logged in. Returns the created task or 401 if not authenticated.',
	inputSchema: TaskInputSchema,
})

/** AI server tool: create a new task (requires auth). */
export const createTaskTool = createSafeServerTool(createTaskToolDef, async (args) => {
	const task = await createTask({ data: TaskInputSchema.parse(args) })
	return { task, message: 'Task created.' }
})

const updateTaskToolDef = toolDefinition({
	name: 'updateTask',
	description:
		'Update an existing task. Requires the user to be logged in and to be the task creator (task.createdBy). Returns 403 if not the creator, 404 if task not found.',
	inputSchema: UpdateTaskInputSchema,
})

/** AI server tool: update an existing task (creator-only). */
export const updateTaskTool = createSafeServerTool(updateTaskToolDef, async (args) => {
	const task = await updateTask({ data: UpdateTaskInputSchema.parse(args) })
	return { task, message: 'Task updated.' }
})

const deleteTaskToolDef = toolDefinition({
	name: 'deleteTask',
	description:
		'Delete a task. Requires the user to be logged in and to be the task creator (task.createdBy). Returns 403 if not the creator, 404 if task not found.',
	inputSchema: TaskIdInputSchema,
})

/** AI server tool: delete a task (creator-only). */
export const deleteTaskTool = createSafeServerTool(deleteTaskToolDef, async (args) => {
	await deleteTask({ data: TaskIdInputSchema.parse(args) })
	return { message: 'Task deleted.' }
})
