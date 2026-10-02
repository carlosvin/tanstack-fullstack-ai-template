import type { Collection, Db, Filter } from 'mongodb'
import { parseDistinctValues, parseTaskRepo, parseTaskRepoList, parseTaskRepoOrNull } from '../schemas/repoParsers'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput } from '../schemas/repository'
import { resolveCreateLastModifiedBy } from './traceability'
import type { DistinctValueField, IndexableRepository, TraceabilityContext } from './types'

const TASKS_COLLECTION = 'tasks'

export interface TaskCollectionRepository extends IndexableRepository {
	getTasks(filter?: Readonly<TaskRepoFilter>): Promise<TaskRepo[]>
	getTask(taskId: string): Promise<TaskRepo | null>
	getDistinctValues(field: DistinctValueField): Promise<string[]>
	createTask(input: Readonly<TaskRepoInput>, trace?: Readonly<TraceabilityContext>): Promise<TaskRepo>
	updateTask(
		taskId: string,
		input: Readonly<Partial<TaskRepoInput>>,
		trace?: Readonly<TraceabilityContext>,
	): Promise<TaskRepo | null>
	deleteTask(taskId: string): Promise<boolean>
}

/** Owns the tasks collection: mapping, queries, writes, and indexes. */
export class MongoTaskRepository implements TaskCollectionRepository {
	private readonly collection: Collection<TaskRepo>

	constructor(db: Db) {
		this.collection = db.collection<TaskRepo>(TASKS_COLLECTION)
	}

	async createIndexes(): Promise<void> {
		await this.collection.createIndex({ id: 1 }, { unique: true })
	}

	async getTasks(filter?: Readonly<TaskRepoFilter>): Promise<TaskRepo[]> {
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

		const rows = await this.collection.find(query).sort({ updatedAt: -1 }).toArray()
		return parseTaskRepoList(rows)
	}

	async getTask(taskId: string): Promise<TaskRepo | null> {
		const row = await this.collection.findOne({ id: taskId })
		return parseTaskRepoOrNull(row)
	}

	async getDistinctValues(field: DistinctValueField): Promise<string[]> {
		const values = await this.collection.distinct(field, { [field]: { $exists: true, $nin: [null, ''] } })
		return parseDistinctValues(values)
	}

	async createTask(input: Readonly<TaskRepoInput>, trace?: Readonly<TraceabilityContext>): Promise<TaskRepo> {
		const now = new Date().toISOString()
		const task: TaskRepo = {
			...input,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
			createdBy: trace?.createdBy,
			lastModifiedBy: resolveCreateLastModifiedBy(trace),
		}
		await this.collection.insertOne(task)
		return parseTaskRepo(task)
	}

	async updateTask(
		taskId: string,
		input: Readonly<Partial<TaskRepoInput>>,
		trace?: Readonly<TraceabilityContext>,
	): Promise<TaskRepo | null> {
		const result = await this.collection.findOneAndUpdate(
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
		const result = await this.collection.deleteOne({ id: taskId })
		return result.deletedCount > 0
	}
}
