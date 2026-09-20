import type { DistinctValueField } from '../../constants/options'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput, UserAccessRepo, UserProfileRepo } from '../schemas/repository'

export type { DistinctValueField }

/** Audit fields attached to repository writes from the auth ticket. */
export interface TraceabilityContext {
	createdBy?: string
	lastModifiedBy?: string
}

/**
 * Swappable data access (seed, Mongo, …). Mutations are authorized in POST
 * server functions (`requireAuthMiddleware`), not by a write-only type.
 */
export interface Repository {
	getTasks(filter?: TaskRepoFilter): Promise<TaskRepo[]>
	getTask(taskId: string): Promise<TaskRepo | null>
	getDistinctValues(field: DistinctValueField): Promise<string[]>
	getUserProfile(email: string): Promise<UserProfileRepo | null>
	getUserAccess(email: string): Promise<UserAccessRepo | null>
	createTask(input: TaskRepoInput, trace?: TraceabilityContext): Promise<TaskRepo>
	updateTask(taskId: string, input: Partial<TaskRepoInput>, trace?: TraceabilityContext): Promise<TaskRepo | null>
	deleteTask(taskId: string): Promise<boolean>
}
