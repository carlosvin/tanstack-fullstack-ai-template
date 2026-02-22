import { createServerFn } from '@tanstack/react-start'
import type { ProcessedResponse, Task, TaskInput, UserIdentity, UserProfile } from '../../types'
import { HttpError } from '../../utils/httpError'
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
	const ctx = context as { user?: UserIdentity; userProfile?: UserProfile | null }
	const identity: UserIdentity = ctx.user ?? { email: '', name: 'Anonymous', groups: [] }
	const profile: UserProfile | null = ctx.userProfile ?? null
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
	.inputValidator(TaskInputSchema)
	.handler(async ({ data, context }) => {
		const user = (context as any).user
		if (!user?.email) throw new HttpError(401, 'Authentication required to create tasks')

		return getObservability().startSpan('createTask', () => getWritableRepository().createTask(data, user.email))
	})

/** Creates a new task. Returns { data, error } instead of throwing. */
export async function createTask(input: TaskInput): Promise<ProcessedResponse<Task>> {
	return processResponse(() => createTaskServerFn({ data: input }))
}

const updateTaskServerFn = createServerFn({ method: 'POST' })
	.inputValidator(TaskIdInputSchema.extend({ updates: TaskInputSchema.partial() }))
	.handler(async ({ data, context }) => {
		const user = (context as any).user
		if (!user?.email) throw new HttpError(401, 'Authentication required to update tasks')

		return getObservability().startSpan('updateTask', () =>
			getWritableRepository().updateTask(data.taskId, data.updates),
		)
	})

/** Updates an existing task. Returns { data, error } instead of throwing. */
export async function updateTask(taskId: string, updates: Partial<TaskInput>): Promise<ProcessedResponse<Task | null>> {
	return processResponse(() => updateTaskServerFn({ data: { taskId, updates } }))
}

const deleteTaskServerFn = createServerFn({ method: 'POST' })
	.inputValidator(TaskIdInputSchema)
	.handler(async ({ data, context }) => {
		const user = (context as any).user
		if (!user?.email) throw new HttpError(401, 'Authentication required to delete tasks')

		return getObservability().startSpan('deleteTask', () => getWritableRepository().deleteTask(data.taskId))
	})

/** Deletes a task by ID. Returns { data, error } instead of throwing. */
export async function deleteTask(taskId: string): Promise<ProcessedResponse<boolean>> {
	return processResponse(() => deleteTaskServerFn({ data: { taskId } }))
}
