import type { Collection, Db, Filter } from 'mongodb'
import { getDb } from '../db/mongoClient.server'
import {
	parseTaskRepo,
	parseTaskRepoOrNull,
	parseUserProfileRepoOrNull,
	toUserAccessRepo,
} from '../schemas/repoParsers'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput, UserAccessRepo, UserProfileRepo } from '../schemas/repository'
import { resolveCreateLastModifiedBy } from './traceability'
import type { DistinctValueField, Repository, TraceabilityContext } from './types'

const TASKS_COLLECTION = 'tasks'
const USERS_COLLECTION = 'users'

/**
 * MongoDB-backed repository implementation.
 * Uses the singleton database connection from db/mongoClient.server.ts.
 */
export class MongoRepository implements Repository {
	private dbPromise: Promise<Db> | null = null

	private async db(): Promise<Db> {
		if (!this.dbPromise) {
			this.dbPromise = getDb()
		}
		return this.dbPromise
	}

	private async collection(): Promise<Collection<TaskRepo>> {
		const db = await this.db()
		return db.collection<TaskRepo>(TASKS_COLLECTION)
	}

	async getTasks(filter?: TaskRepoFilter): Promise<TaskRepo[]> {
		const col = await this.collection()
		const query: Filter<TaskRepo> = {}

		if (filter?.status) query.status = filter.status
		if (filter?.priority) query.priority = filter.priority
		if (filter?.assignee) query.assignee = filter.assignee
		if (filter?.search) {
			query.$or = [
				{ title: { $regex: filter.search, $options: 'i' } },
				{ description: { $regex: filter.search, $options: 'i' } },
			]
		}

		const rows = await col.find(query).sort({ updatedAt: -1 }).toArray()
		return rows.map((row) => parseTaskRepo(row))
	}

	async getTask(taskId: string): Promise<TaskRepo | null> {
		const col = await this.collection()
		const row = await col.findOne({ id: taskId })
		return parseTaskRepoOrNull(row)
	}

	async getDistinctValues(field: DistinctValueField): Promise<string[]> {
		const col = await this.collection()
		const values = await col.distinct(field, { [field]: { $exists: true, $nin: [null, ''] } })
		return values.filter((value): value is string => typeof value === 'string' && value.length > 0).sort()
	}

	async getUserProfile(email: string): Promise<UserProfileRepo | null> {
		const db = await this.db()
		const col = db.collection<UserProfileRepo>(USERS_COLLECTION)
		const row = await col.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
		return parseUserProfileRepoOrNull(row)
	}

	async getUserAccess(email: string): Promise<UserAccessRepo | null> {
		const profile = await this.getUserProfile(email)
		return profile ? toUserAccessRepo(profile) : null
	}

	async createTask(input: TaskRepoInput, trace?: TraceabilityContext): Promise<TaskRepo> {
		const col = await this.collection()
		const now = new Date().toISOString()
		const task: TaskRepo = {
			...input,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
			createdBy: trace?.createdBy,
			lastModifiedBy: resolveCreateLastModifiedBy(trace),
		}
		await col.insertOne(task)
		return parseTaskRepo(task)
	}

	async updateTask(
		taskId: string,
		input: Partial<TaskRepoInput>,
		trace?: TraceabilityContext,
	): Promise<TaskRepo | null> {
		const col = await this.collection()
		const result = await col.findOneAndUpdate(
			{ id: taskId },
			{
				$set: {
					...input,
					updatedAt: new Date().toISOString(),
					...(trace?.lastModifiedBy ? { lastModifiedBy: trace.lastModifiedBy } : {}),
				},
			},
			{ returnDocument: 'after' },
		)
		return parseTaskRepoOrNull(result)
	}

	async deleteTask(taskId: string): Promise<boolean> {
		const col = await this.collection()
		const result = await col.deleteOne({ id: taskId })
		return result.deletedCount > 0
	}
}
