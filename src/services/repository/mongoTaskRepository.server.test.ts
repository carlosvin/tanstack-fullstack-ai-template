import type { Db } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { MongoTaskRepository } from './mongoTaskRepository.server'

interface StoredTask {
	id: string
	title: string
	description?: string
	status: string
	priority: string
	assignee?: string
	createdAt: string
	updatedAt: string
	createdBy?: string
	lastModifiedBy?: string
}

function matches(doc: StoredTask, filter: Record<string, unknown>): boolean {
	for (const [key, expected] of Object.entries(filter)) {
		if (key === '$or' && Array.isArray(expected)) {
			if (!expected.some((clause) => matches(doc, clause as Record<string, unknown>))) return false
			continue
		}
		if (expected && typeof expected === 'object' && '$regex' in expected) {
			const pattern = expected as { $regex: string; $options?: string }
			if (!new RegExp(pattern.$regex, pattern.$options).test(String(doc[key as keyof StoredTask] ?? ''))) return false
			continue
		}
		if (doc[key as keyof StoredTask] !== expected) return false
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
		findOneAndUpdate: async (filter: Record<string, unknown>, update: { $set: Partial<StoredTask> }) => {
			const doc = docs.find((candidate) => matches(candidate, filter))
			if (!doc) return null
			Object.assign(doc, update.$set)
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
			{ key: { id: 1 }, options: { unique: true } },
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
