import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../../middleware/auth'
import { invalidateMiddleware } from '../../middleware/invalidate'
import { requireAuthMiddleware } from '../../middleware/requireAuth'
import { webEnvMiddleware } from '../../middleware/webEnv'
import { HttpError } from '../../utils/httpError'
import { getAIAdapterService } from '../ai/adapter'
import { getObservability } from '../observability'
import { getReadRepository, getWritableRepository } from '../repository/getRepository.server'
import { createWriteTrace, updateWriteTrace } from '../repository/traceability'
import { TaskRepoFilterSchema, TaskRepoInputSchema, UserAccessRepoSchema } from '../schemas/repository'
import {
	CurrentUserSchema,
	DistinctValuesInputSchema,
	TaskFilterSchema,
	TaskIdInputSchema,
	TaskInputSchema,
	UpdateTaskInputSchema,
	UserProfileByEmailSchema,
} from '../schemas/schemas'
import { toToolTask, toToolUserProfile } from '../schemas/taskMappers'

// ============================================================================
// Queries (GET) — accessed from route loaders and AI tools
// ============================================================================

/** Fetch tasks with optional filters. Maps tools-layer filter to repo-layer. */
export const getTasks = createServerFn({ method: 'GET' })
	.inputValidator(TaskFilterSchema.optional())
	.handler(async ({ data: filter }) => {
		const repoFilter = filter ? TaskRepoFilterSchema.parse(filter) : undefined
		const rows = await getObservability({}).startSpan('getTasks', () => getReadRepository().getTasks(repoFilter))
		return rows.map(toToolTask)
	})

/** Fetch a single task by ID. */
export const getTask = createServerFn({ method: 'GET' })
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data }) => {
		const row = await getObservability({}).startSpan('getTask', () => getReadRepository().getTask(data.taskId))
		return row ? toToolTask(row) : null
	})

/** Fetch distinct values for a filterable task field (assignee, status, priority). */
export const getDistinctValues = createServerFn({ method: 'GET' })
	.inputValidator(DistinctValuesInputSchema)
	.handler(async ({ data }) => {
		return getObservability({}).startSpan('getDistinctValues', () => getReadRepository().getDistinctValues(data.field))
	})

/** Fetch a user profile by email. */
export const getUserProfile = createServerFn({ method: 'GET' })
	.inputValidator(UserProfileByEmailSchema)
	.handler(async ({ data }) => {
		const row = await getObservability({}).startSpan('getUserProfile', () =>
			getReadRepository().getUserProfile(data.email),
		)
		return row ? toToolUserProfile(row) : null
	})

/** Fetch repository-backed access roles for a user email. */
export const getUserAccess = createServerFn({ method: 'GET' })
	.inputValidator(UserProfileByEmailSchema)
	.handler(async ({ data }) => {
		const row = await getObservability({}).startSpan('getUserAccess', () =>
			getReadRepository().getUserAccess(data.email),
		)
		return row ? UserAccessRepoSchema.parse(row) : null
	})

/** Browser-safe shell session for the root loader. */
export const getBrowserShellSession = createServerFn({ method: 'GET' })
	.middleware([webEnvMiddleware])
	.handler(async ({ context }) => context.shellSession)

/** Whether the AI chat adapter is configured (root loader gates chat UI). */
export const getAIAvailability = createServerFn({ method: 'GET' })
	.middleware([webEnvMiddleware])
	.handler(async () => ({
		available: getAIAdapterService().isConfigured(),
	}))

// ============================================================================
// Current user — identity + profile from middleware context
// ============================================================================

/** Return the authenticated user's identity and profile. */
export const getCurrentUser = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(async ({ context }) =>
		CurrentUserSchema.parse({
			identity: context.accessTicket.identity,
			profile: context.accessTicket.profile,
			isTestUser: context.accessTicket.isTestUser,
		}),
	)

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
		const trace = createWriteTrace(context.accessTicket.identity.email)
		const row = await getObservability({}).startSpan('createTask', () =>
			getWritableRepository().createTask(repoInput, trace),
		)
		return toToolTask(row)
	})

/** Update an existing task. Only the creator may edit. */
export const updateTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(UpdateTaskInputSchema)
	.handler(async ({ data, context }) => {
		const task = await getReadRepository().getTask(data.taskId)
		if (!task) throw new HttpError(404, 'Task not found')
		context.accessTicket.requireTaskCreator(task)
		const repoUpdates = TaskRepoInputSchema.partial().parse(data.updates)
		const trace = updateWriteTrace(context.accessTicket.identity.email)
		const row = await getObservability({}).startSpan('updateTask', () =>
			getWritableRepository().updateTask(data.taskId, repoUpdates, trace),
		)
		return row ? toToolTask(row) : null
	})

/** Delete a task. Only the creator may delete. */
export const deleteTask = createServerFn({ method: 'POST' })
	.middleware([requireAuthMiddleware, invalidateMiddleware])
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data, context }) => {
		const task = await getReadRepository().getTask(data.taskId)
		if (!task) throw new HttpError(404, 'Task not found')
		context.accessTicket.requireTaskCreator(task)
		return getObservability({}).startSpan('deleteTask', () => getWritableRepository().deleteTask(data.taskId))
	})
