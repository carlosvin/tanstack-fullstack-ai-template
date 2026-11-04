import type { Collection, Db, Filter, UpdateFilter } from 'mongodb'
import type { DistinctValueField } from '@/constants/options'
import { matchesDueFilter, sortTasks, taskUpdateFields, taskWriteFields } from '@/services/repository/taskQuery'
import { resolveCreateLastModifiedBy } from '@/services/repository/traceability'
import type { IndexableRepository, TraceabilityContext } from '@/services/repository/types'
import {
	parseDistinctValues,
	parseTaskRepo,
	parseTaskRepoList,
	parseTaskRepoOrNull,
} from '@/services/schemas/repoParsers'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput } from '@/services/schemas/repository'
import { calendarToday } from '@/utils/calendarDate'

const TASKS_COLLECTION = 'tasks'
const OPEN_TASK_STATUSES = ['pending', 'in-progress'] as const

/** Due-date clauses that Mongo can reject before the documents are read. */
function taskMongoFilter(filter?: Readonly<TaskRepoFilter>): Filter<TaskRepo> {
	const parts: Filter<TaskRepo>[] = []
	if (filter?.status) parts.push({ status: filter.status })
	if (filter?.priority) parts.push({ priority: filter.priority })
	if (filter?.assignee) parts.push({ assignee: filter.assignee })
	if (filter?.search) {
		parts.push({
			$or: [
				{ title: { $regex: filter.search, $options: 'i' } },
				{ description: { $regex: filter.search, $options: 'i' } },
			],
		})
	}
	if (filter?.due === 'overdue') {
		const asOf = filter.asOf ?? calendarToday('UTC')
		parts.push({ dueDate: { $lt: asOf, $type: 'string' }, status: { $in: [...OPEN_TASK_STATUSES] } })
	}
	if (filter?.due === 'unscheduled') {
		parts.push({ $or: [{ dueDate: { $exists: false } }, { dueDate: null }] })
	}
	if (filter?.due === 'scheduled') parts.push({ dueDate: { $type: 'string' } })
	if (filter?.dueOnOrBefore) parts.push({ dueDate: { $lte: filter.dueOnOrBefore, $type: 'string' } })
	if (parts.length === 0) return {}
	if (parts.length === 1) return parts[0] ?? {}
	return { $and: parts }
}

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
		await this.collection.createIndex({ updatedAt: -1 })
		await this.collection.createIndex({ status: 1, dueDate: 1 })
		await this.collection.createIndex({ dueDate: 1, updatedAt: -1 })
	}

	async getTasks(filter?: Readonly<TaskRepoFilter>): Promise<TaskRepo[]> {
		const query = taskMongoFilter(filter)
		const rows = await this.collection.find(query).sort({ updatedAt: -1 }).toArray()
		const matched = parseTaskRepoList(rows).filter((task) => matchesDueFilter(task, filter))
		return sortTasks(matched, filter)
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
			...taskWriteFields(input),
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
		const { set, unset } = taskUpdateFields(input)
		const update: UpdateFilter<TaskRepo> = {
			$set: {
				...set,
				updatedAt: new Date().toISOString(),
				...(trace?.lastModifiedBy ? { lastModifiedBy: trace.lastModifiedBy } : {}),
			},
		}
		if (unset.length > 0) {
			update.$unset = Object.fromEntries(unset.map((field) => [field, '']))
		}
		const result = await this.collection.findOneAndUpdate({ id: taskId }, update, { returnDocument: 'after' })
		return parseTaskRepoOrNull(result)
	}

	async deleteTask(taskId: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ id: taskId })
		return result.deletedCount > 0
	}
}
