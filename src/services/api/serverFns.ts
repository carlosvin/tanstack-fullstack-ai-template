import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { invalidateMiddleware } from '../../middleware/invalidate'
import { requireAuthMiddleware } from '../../middleware/requireAuth'
import { HttpError } from '../../utils/httpError'
import { getObservability } from '../observability'
import { getReadRepository, getWritableRepository } from '../repository/getRepository'
import { TaskRepoFilterSchema, TaskRepoInputSchema } from '../schemas/repository'
import {
	TaskFilterSchema,
	TaskIdInputSchema,
	TaskInputSchema,
	UpdateTaskInputSchema,
	UserProfileByEmailSchema,
} from '../schemas/schemas'

// ============================================================================
// Queries (GET) — accessed from route loaders and AI tools
// ============================================================================

/** Fetch tasks with optional filters. Maps tools-layer filter to repo-layer. */
export const getTasks = createServerFn({ method: 'GET' })
	.inputValidator(TaskFilterSchema.optional())
	.handler(async ({ data: filter }) => {
		const repoFilter = filter ? TaskRepoFilterSchema.parse(filter) : undefined
		return getObservability().startSpan('getTasks', () => getReadRepository().getTasks(repoFilter))
	})

/** Fetch a single task by ID. */
export const getTask = createServerFn({ method: 'GET' })
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data }) => {
		return getObservability().startSpan('getTask', () => getReadRepository().getTask(data.taskId))
	})

/** Fetch all distinct assignee emails. */
export const getAssignees = createServerFn({ method: 'GET' }).handler(async () => {
	return getObservability().startSpan('getAssignees', () => getReadRepository().getAssignees())
})

/** Fetch a user profile by email. */
export const getUserProfile = createServerFn({ method: 'GET' })
	.inputValidator(UserProfileByEmailSchema)
	.handler(async ({ data }) => {
		return getObservability().startSpan('getUserProfile', () => getReadRepository().getUserProfile(data.email))
	})

// ============================================================================
// Current user — identity + profile from middleware context
// ============================================================================

/** Return the authenticated user's identity and profile. */
export const getCurrentUser = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const identity = context.user ?? { email: '', name: 'Anonymous', groups: [] }
		const profile = context.userProfile ?? null
		return { identity, profile }
	})

// ============================================================================
// Mutations (POST) — called from event handlers and AI tools.
// Handlers throw HttpError on auth/not-found failures; callers normalize
// via processResponse (UI) or safeToolHandler (AI).
// ============================================================================

/** Create a new task. Maps tools-layer input to repo-layer. */
export const createTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(TaskInputSchema)
	.handler(async ({ data, context }) => {
		const repoInput = TaskRepoInputSchema.parse(data)
		return getObservability().startSpan('createTask', () =>
			getWritableRepository().createTask(repoInput, context.user.email),
		)
	})

/** Update an existing task. Only the creator may edit. */
export const updateTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(UpdateTaskInputSchema)
	.handler(async ({ data, context }) => {
		const task = await getReadRepository().getTask(data.taskId)
		if (!task) throw new HttpError(404, 'Task not found')
		if (task.createdBy && task.createdBy !== context.user.email) {
			throw new HttpError(403, 'Only the task creator can edit this task')
		}
		const repoUpdates = TaskRepoInputSchema.partial().parse(data.updates)
		return getObservability().startSpan('updateTask', () =>
			getWritableRepository().updateTask(data.taskId, repoUpdates),
		)
	})

/** Delete a task. Only the creator may delete. */
export const deleteTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data, context }) => {
		const task = await getReadRepository().getTask(data.taskId)
		if (!task) throw new HttpError(404, 'Task not found')
		if (task.createdBy && task.createdBy !== context.user.email) {
			throw new HttpError(403, 'Only the task creator can delete this task')
		}
		return getObservability().startSpan('deleteTask', () => getWritableRepository().deleteTask(data.taskId))
	})
