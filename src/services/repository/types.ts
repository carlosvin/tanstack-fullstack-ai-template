import type { TaskRepo, TaskRepoFilter, TaskRepoInput, UserProfileRepo } from '../schemas/repository'

/**
 * Read-only repository interface.
 * All read methods are exposed as AI tools for the chat assistant.
 */
export interface ReadRepository {
	/** Get all tasks, optionally filtered. */
	getTasks(filter?: TaskRepoFilter): Promise<TaskRepo[]>

	/** Get a single task by ID. Returns null if not found. */
	getTask(taskId: string): Promise<TaskRepo | null>

	/** Get all distinct assignee emails. */
	getAssignees(): Promise<string[]>

	/** Get a user profile by email. Returns null if not found. */
	getUserProfile(email: string): Promise<UserProfileRepo | null>
}

/**
 * Write repository interface for mutations.
 * Mutations require authentication.
 */
export interface WritableRepository {
	/** Create a new task. Returns the created task with generated ID and timestamps. */
	createTask(input: TaskRepoInput, createdBy?: string): Promise<TaskRepo>

	/** Update an existing task. Returns the updated task or null if not found. */
	updateTask(taskId: string, input: Partial<TaskRepoInput>): Promise<TaskRepo | null>

	/** Delete a task by ID. Returns true if deleted, false if not found. */
	deleteTask(taskId: string): Promise<boolean>
}

/** Combined repository interface. */
export type Repository = ReadRepository & WritableRepository
