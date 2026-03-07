import { createServerFn } from '@tanstack/react-start'
import type { AuthContext } from '../../middleware/auth'
import { invalidateMiddleware } from '../../middleware/invalidate'
import type { ProcessedResponse, Task, TaskInput, UserIdentity, UserProfile } from '../../types'
import { requireAuth } from '../../utils/auth'
import { getObservability } from '../observability'
import { getReadRepository, getWritableRepository } from '../repository/getRepository'
import { TaskFilterSchema, TaskIdInputSchema, TaskInputSchema } from '../schemas/schemas'
import { processResponse } from './processResponse'

// ============================================================================
// Queries (GET) — accessed from route loaders
// ============================================================================

const getTasksServerFn = createServerFn({ method: 'GET' })
	.inputValidator(TaskFilterSchema.optional())
	.handler(async ({ data: filter }) => {
		return getObservability().startSpan('getTasks', () => getReadRepository().getTasks(filter ?? undefined))
	})

/** Loads all tasks with optional filters. */
export async function getTasks(filter?: Parameters<typeof getTasksServerFn>[0]): Promise<Task[]> {
	return getTasksServerFn(filter)
}

const getTaskServerFn = createServerFn({ method: 'GET' })
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data }) => {
		return getObservability().startSpan('getTask', () => getReadRepository().getTask(data.taskId))
	})

/** Loads a single task by ID. */
export async function getTask(taskId: string): Promise<Task | null> {
	return getTaskServerFn({ data: { taskId } })
}

const getAssigneesServerFn = createServerFn({ method: 'GET' }).handler(async () => {
	return getObservability().startSpan('getAssignees', () => getReadRepository().getAssignees())
})

/** Loads all distinct assignee emails. */
export async function getAssignees(): Promise<string[]> {
	return getAssigneesServerFn()
}

// ============================================================================
// Current user — identity + profile from middleware context
// ============================================================================

const getCurrentUserServerFn = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
	const { user, userProfile } = context as AuthContext
	const identity: UserIdentity = user ?? { email: '', name: 'Anonymous', groups: [] }
	const profile: UserProfile | null = userProfile ?? null
	return { identity, profile }
})

/** Returns the current user identity and profile loaded by the auth middleware. */
export async function getCurrentUser(): Promise<{ identity: UserIdentity; profile: UserProfile | null }> {
	return getCurrentUserServerFn()
}

// ============================================================================
// Mutations (POST) — called from event handlers
// ============================================================================

const createTaskServerFn = createServerFn({ method: 'POST' })
	.middleware([invalidateMiddleware])
	.inputValidator(TaskInputSchema)
	.handler(async ({ data, context }) => {
		const { email } = requireAuth(context as AuthContext)
		return getObservability().startSpan('createTask', () => getWritableRepository().createTask(data, email))
	})

/** Creates a new task. Returns { data, error } instead of throwing. */
export async function createTask(input: TaskInput): Promise<ProcessedResponse<Task>> {
	return processResponse(() => createTaskServerFn({ data: input }))
}

const updateTaskServerFn = createServerFn({ method: 'POST' })
	.middleware([invalidateMiddleware])
	.inputValidator(TaskIdInputSchema.extend({ updates: TaskInputSchema.partial() }))
	.handler(async ({ data, context }) => {
		requireAuth(context as AuthContext)
		return getObservability().startSpan('updateTask', () =>
			getWritableRepository().updateTask(data.taskId, data.updates),
		)
	})

/** Updates an existing task. Returns { data, error } instead of throwing. */
export async function updateTask(taskId: string, updates: Partial<TaskInput>): Promise<ProcessedResponse<Task | null>> {
	return processResponse(() => updateTaskServerFn({ data: { taskId, updates } }))
}

const deleteTaskServerFn = createServerFn({ method: 'POST' })
	.middleware([invalidateMiddleware])
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data, context }) => {
		requireAuth(context as AuthContext)
		return getObservability().startSpan('deleteTask', () => getWritableRepository().deleteTask(data.taskId))
	})

/** Deletes a task by ID. Returns { data, error } instead of throwing. */
export async function deleteTask(taskId: string): Promise<ProcessedResponse<boolean>> {
	return processResponse(() => deleteTaskServerFn({ data: { taskId } }))
}
