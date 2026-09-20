import type { DistinctValueField } from '../../constants/options'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput, UserAccessRepo, UserProfileRepo } from '../schemas/repository'

export type { DistinctValueField }

/** Audit fields attached to repository writes from the auth ticket. */
export interface TraceabilityContext {
	createdBy?: string
	lastModifiedBy?: string
}

/**
 * Data-access interface. Implementations are swappable (seed, Mongo, …).
 * Every method is exposed as an AI tool; mutations still require auth at the
 * server-function layer (`requireAuthMiddleware`), not via a separate write type.
 */
export interface Repository {
	/** Get all tasks, optionally filtered. */
	getTasks(filter?: TaskRepoFilter): Promise<TaskRepo[]>

	/** Get a single task by ID. Returns null if not found. */
	getTask(taskId: string): Promise<TaskRepo | null>

	/** Get distinct non-empty values for a filterable task field (matches real data). */
	getDistinctValues(field: DistinctValueField): Promise<string[]>

	/** Get a user profile by email. Returns null if not found. */
	getUserProfile(email: string): Promise<UserProfileRepo | null>

	/** Get repository-backed access data (roles) for building the auth ticket. */
	getUserAccess(email: string): Promise<UserAccessRepo | null>

	/** Create a new task. Returns the created task with generated ID and timestamps. */
	createTask(input: TaskRepoInput, trace?: TraceabilityContext): Promise<TaskRepo>

	/** Update an existing task. Returns the updated task or null if not found. */
	updateTask(taskId: string, input: Partial<TaskRepoInput>, trace?: TraceabilityContext): Promise<TaskRepo | null>

	/** Delete a task by ID. Returns true if deleted, false if not found. */
	deleteTask(taskId: string): Promise<boolean>
}
