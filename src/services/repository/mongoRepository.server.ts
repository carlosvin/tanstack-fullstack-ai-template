import type { Db } from 'mongodb'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput, UserAccessRepo, UserProfileRepo } from '../schemas/repository'
import { MongoTaskRepository } from './mongoTaskRepository.server'
import { MongoUserRepository } from './mongoUserRepository.server'
import type { DistinctValueField, IndexableRepository, Repository, TraceabilityContext } from './types'

/**
 * Domain facade over the task and user collection repositories.
 * Delegates queries and writes; it does not touch the driver itself.
 */
export class MongoRepository implements Repository, IndexableRepository {
	private readonly tasks: MongoTaskRepository
	private readonly users: MongoUserRepository

	constructor(db: Db) {
		this.tasks = new MongoTaskRepository(db)
		this.users = new MongoUserRepository(db)
	}

	async createIndexes(): Promise<void> {
		await this.tasks.createIndexes()
		await this.users.createIndexes()
	}

	getTasks(filter?: TaskRepoFilter): Promise<TaskRepo[]> {
		return this.tasks.getTasks(filter)
	}

	getTask(taskId: string): Promise<TaskRepo | null> {
		return this.tasks.getTask(taskId)
	}

	getDistinctValues(field: DistinctValueField): Promise<string[]> {
		return this.tasks.getDistinctValues(field)
	}

	getUserProfile(email: string): Promise<UserProfileRepo | null> {
		return this.users.getUserProfile(email)
	}

	getUserAccess(email: string): Promise<UserAccessRepo | null> {
		return this.users.getUserAccess(email)
	}

	createTask(input: TaskRepoInput, trace?: TraceabilityContext): Promise<TaskRepo> {
		return this.tasks.createTask(input, trace)
	}

	updateTask(taskId: string, input: Partial<TaskRepoInput>, trace?: TraceabilityContext): Promise<TaskRepo | null> {
		return this.tasks.updateTask(taskId, input, trace)
	}

	deleteTask(taskId: string): Promise<boolean> {
		return this.tasks.deleteTask(taskId)
	}
}
