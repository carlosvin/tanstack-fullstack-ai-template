import type { Task, TaskFilter, TaskInput, UserProfile } from '../../types'

/**
 * Read-only repository interface.
 * All read methods are exposed as AI tools for the chat assistant.
 */
export interface ReadRepository {
	/** Get all tasks, optionally filtered. */
	getTasks(filter?: TaskFilter): Promise<Task[]>

	/** Get a single task by ID. Returns null if not found. */
	getTask(taskId: string): Promise<Task | null>

	/** Get all distinct assignee emails. */
	getAssignees(): Promise<string[]>

	/** Get a user profile by email. Returns null if not found. */
	getUserProfile(email: string): Promise<UserProfile | null>
}

/**
 * Write repository interface for mutations.
 * Mutations require authentication.
 */
export interface WritableRepository {
	/** Create a new task. Returns the created task with generated ID and timestamps. */
	createTask(input: TaskInput, createdBy?: string): Promise<Task>

	/** Update an existing task. Returns the updated task or null if not found. */
	updateTask(taskId: string, input: Partial<TaskInput>): Promise<Task | null>

	/** Delete a task by ID. Returns true if deleted, false if not found. */
	deleteTask(taskId: string): Promise<boolean>
}

/** Combined repository interface. */
export type Repository = ReadRepository & WritableRepository
