import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { invalidateMiddleware } from '../../middleware/invalidate'
import { requireAuthMiddleware } from '../../middleware/requireAuth'
import { HttpError } from '../../utils/httpError'
import { getObservability } from '../observability'
import { getReadRepository, getWritableRepository } from '../repository/getRepository'
import { TaskFilterSchema, TaskIdInputSchema, TaskInputSchema, UpdateTaskInputSchema } from '../schemas/schemas'

// ============================================================================
// Queries (GET) — accessed from route loaders and AI tools
// ============================================================================

export const getTasks = createServerFn({ method: 'GET' })
	.inputValidator(TaskFilterSchema.optional())
	.handler(async ({ data: filter }) => {
		return getObservability().startSpan('getTasks', () => getReadRepository().getTasks(filter ?? undefined))
	})

export const getTask = createServerFn({ method: 'GET' })
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data }) => {
		return getObservability().startSpan('getTask', () => getReadRepository().getTask(data.taskId))
	})

export const getAssignees = createServerFn({ method: 'GET' }).handler(async () => {
	return getObservability().startSpan('getAssignees', () => getReadRepository().getAssignees())
})

// ============================================================================
// Current user — identity + profile from middleware context
// ============================================================================

export const getCurrentUser = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const identity = context.user ?? { email: '', name: 'Anonymous', groups: [] }
		const profile = context.userProfile ?? null
		return { identity, profile }
	})

// ============================================================================
// Mutations (POST) — called from event handlers and AI tools
// ============================================================================

export const createTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(TaskInputSchema)
	.handler(async ({ data, context }) => {
		return getObservability().startSpan('createTask', () =>
			getWritableRepository().createTask(data, context.user.email),
		)
	})

export const updateTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(UpdateTaskInputSchema)
	.handler(async ({ data, context }) => {
		const task = await getReadRepository().getTask(data.taskId)
		if (!task) throw new HttpError(404, 'Task not found')
		if (task.createdBy && task.createdBy !== context.user.email) {
			throw new HttpError(403, 'Only the task creator can edit this task')
		}
		return getObservability().startSpan('updateTask', () =>
			getWritableRepository().updateTask(data.taskId, data.updates),
		)
	})

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
