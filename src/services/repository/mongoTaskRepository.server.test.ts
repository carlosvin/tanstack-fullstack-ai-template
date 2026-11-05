import type { Db } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { MongoTaskRepository } from '@/services/repository/mongoTaskRepository.server'

interface StoredTask {
	id: string
	title: string
	description?: string
	status: string
	priority: string
	assignee?: string
	dueDate?: string
	createdAt: string
	updatedAt: string
	createdBy?: string
	lastModifiedBy?: string
}

function matchesField(value: unknown, expected: unknown): boolean {
	if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return value === expected
	const ops = expected as Record<string, unknown>
	if ('$regex' in ops) {
		const pattern = ops as { $regex: string; $options?: string }
		return new RegExp(pattern.$regex, pattern.$options).test(String(value ?? ''))
	}
	if ('$in' in ops && Array.isArray(ops.$in) && !ops.$in.includes(value)) return false
	if ('$lt' in ops && !(typeof value === 'string' && typeof ops.$lt === 'string' && value < ops.$lt)) return false
	if ('$lte' in ops && !(typeof value === 'string' && typeof ops.$lte === 'string' && value <= ops.$lte)) return false
	if ('$type' in ops && ops.$type === 'string' && typeof value !== 'string') return false
	if ('$exists' in ops && (value !== undefined) !== ops.$exists) return false
	if ('$nin' in ops && Array.isArray(ops.$nin) && ops.$nin.includes(value)) return false
	return '$in' in ops || '$lt' in ops || '$lte' in ops || '$type' in ops || '$exists' in ops || '$nin' in ops
}

function matches(doc: StoredTask, filter: Record<string, unknown>): boolean {
	for (const [key, expected] of Object.entries(filter)) {
		if (key === '$or' && Array.isArray(expected)) {
			if (!expected.some((clause) => matches(doc, clause as Record<string, unknown>))) return false
			continue
		}
		if (key === '$and' && Array.isArray(expected)) {
			if (!expected.every((clause) => matches(doc, clause as Record<string, unknown>))) return false
			continue
		}
		if (!matchesField(doc[key as keyof StoredTask], expected)) return false
	}
	return true
}

function createTaskDb() {
	const docs: StoredTask[] = []
	const indexes: Array<{ key: Record<string, number>; options?: { unique?: boolean } }> = []
	const collection = {
		createIndex: async (key: Record<string, number>, options?: { unique?: boolean }) => {
			indexes.push({ key, options })
			return 'tasks_id'
		},
		insertOne: async (doc: StoredTask) => {
			docs.push({ ...doc })
		},
		find: (filter: Record<string, unknown> = {}) => {
			const matched = docs.filter((doc) => matches(doc, filter))
			return {
				sort: (spec: Record<string, 1 | -1>) => ({
					toArray: async () => {
						const [field, direction] = Object.entries(spec)[0] ?? ['updatedAt', -1]
						return [...matched].sort((left, right) => {
							const leftValue = String(left[field as keyof StoredTask] ?? '')
							const rightValue = String(right[field as keyof StoredTask] ?? '')
							return direction * leftValue.localeCompare(rightValue)
						})
					},
				}),
			}
		},
		findOne: async (filter: Record<string, unknown>) => docs.find((doc) => matches(doc, filter)) ?? null,
		findOneAndUpdate: async (
			filter: Record<string, unknown>,
			update: { $set?: Partial<StoredTask>; $unset?: Record<string, string> },
		) => {
			const doc = docs.find((candidate) => matches(candidate, filter))
			if (!doc) return null
			if (update.$set) Object.assign(doc, update.$set)
			if (update.$unset) {
				for (const key of Object.keys(update.$unset)) {
					delete doc[key as keyof StoredTask]
				}
			}
			return { ...doc }
		},
		deleteOne: async (filter: Record<string, unknown>) => {
			const index = docs.findIndex((doc) => matches(doc, filter))
			if (index === -1) return { deletedCount: 0 }
			docs.splice(index, 1)
			return { deletedCount: 1 }
		},
		distinct: async (field: keyof StoredTask) => {
			const values = new Set<string>()
			for (const doc of docs) {
				const value = doc[field]
				if (typeof value === 'string' && value.length > 0) values.add(value)
			}
			return [...values]
		},
	}
	const db = { collection: () => collection } as unknown as Db
	return { db, docs, indexes, repository: new MongoTaskRepository(db) }
}

describe('MongoTaskRepository', () => {
	it('declares a unique id index and can repeat initialization', async () => {
		const { repository, indexes } = createTaskDb()
		await repository.createIndexes()
		await repository.createIndexes()
		expect(indexes).toEqual([
			{ key: { id: 1 }, options: { unique: true } },
			{ key: { updatedAt: -1 }, options: undefined },
			{ key: { status: 1, dueDate: 1 }, options: undefined },
			{ key: { dueDate: 1, updatedAt: -1 }, options: undefined },
			{ key: { id: 1 }, options: { unique: true } },
			{ key: { updatedAt: -1 }, options: undefined },
			{ key: { status: 1, dueDate: 1 }, options: undefined },
			{ key: { dueDate: 1, updatedAt: -1 }, options: undefined },
		])
	})

	it('writes, filters, and attributes updates', async () => {
		const { repository } = createTaskDb()
		const created = await repository.createTask(
			{ title: 'Ship indexes', description: 'Unique id', status: 'pending', priority: 'high' },
			{ createdBy: 'ada@example.com' },
		)
		expect(created.lastModifiedBy).toBe('ada@example.com')

		const found = await repository.getTasks({ status: 'pending', search: 'indexes' })
		expect(found.map((task) => task.id)).toEqual([created.id])

		const updated = await repository.updateTask(created.id, { status: 'done' }, { lastModifiedBy: 'grace@example.com' })
		expect(updated?.status).toBe('done')
		expect(updated?.lastModifiedBy).toBe('grace@example.com')
		const past = await repository.createTask({
			title: 'Past',
			status: 'in-progress',
			priority: 'low',
			dueDate: '2026-10-01',
		})
		await repository.createTask({ title: 'Later', status: 'pending', priority: 'low', dueDate: '2026-12-01' })
		const overdue = await repository.getTasks({ due: 'overdue', asOf: '2026-11-01' })
		expect(overdue.map((task) => task.id)).toEqual([past.id])

		expect(await repository.deleteTask(created.id)).toBe(true)
		expect(await repository.getTask(created.id)).toBeNull()
	})

	it('propagates a failed read', async () => {
		const db = {
			collection: () => ({
				find: () => {
					throw new Error('read failed')
				},
			}),
		} as unknown as Db
		await expect(new MongoTaskRepository(db).getTasks()).rejects.toThrow('read failed')
	})
})
