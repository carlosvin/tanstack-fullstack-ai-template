import type { Collection, Db, Filter } from 'mongodb'
import type { Task, TaskFilter, TaskInput, UserProfile } from '../../types'
import { getDb } from '../db/mongoClient'
import type { Repository } from './types'

const TASKS_COLLECTION = 'tasks'
const USERS_COLLECTION = 'users'

/**
 * MongoDB-backed repository implementation.
 * Uses the singleton database connection from db/mongoClient.ts.
 */
export class MongoRepository implements Repository {
	private dbPromise: Promise<Db> | null = null

	private async db(): Promise<Db> {
		if (!this.dbPromise) {
			this.dbPromise = getDb()
		}
		return this.dbPromise
	}

	private async collection(): Promise<Collection<Task>> {
		const db = await this.db()
		return db.collection<Task>(TASKS_COLLECTION)
	}

	async getTasks(filter?: TaskFilter): Promise<Task[]> {
		const col = await this.collection()
		const query: Filter<Task> = {}

		if (filter?.status) query.status = filter.status
		if (filter?.priority) query.priority = filter.priority
		if (filter?.assignee) query.assignee = filter.assignee
		if (filter?.search) {
			query.$or = [
				{ title: { $regex: filter.search, $options: 'i' } },
				{ description: { $regex: filter.search, $options: 'i' } },
			]
		}

		return col.find(query).sort({ updatedAt: -1 }).toArray() as Promise<Task[]>
	}

	async getTask(taskId: string): Promise<Task | null> {
		const col = await this.collection()
		return col.findOne({ id: taskId }) as Promise<Task | null>
	}

	async getAssignees(): Promise<string[]> {
		const col = await this.collection()
		const assignees = await col.distinct('assignee', { assignee: { $exists: true } })
		return assignees.filter((a): a is string => typeof a === 'string').sort()
	}

	async getUserProfile(email: string): Promise<UserProfile | null> {
		const db = await this.db()
		const col = db.collection<UserProfile>(USERS_COLLECTION)
		return col.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } }) as Promise<UserProfile | null>
	}

	async createTask(input: TaskInput, createdBy?: string): Promise<Task> {
		const col = await this.collection()
		const now = new Date().toISOString()
		const task: Task = {
			...input,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
			createdBy,
		}
		await col.insertOne(task as any)
		return task
	}

	async updateTask(taskId: string, input: Partial<TaskInput>): Promise<Task | null> {
		const col = await this.collection()
		const result = await col.findOneAndUpdate(
			{ id: taskId },
			{ $set: { ...input, updatedAt: new Date().toISOString() } },
			{ returnDocument: 'after' },
		)
		return result as Task | null
	}

	async deleteTask(taskId: string): Promise<boolean> {
		const col = await this.collection()
		const result = await col.deleteOne({ id: taskId })
		return result.deletedCount > 0
	}
}
