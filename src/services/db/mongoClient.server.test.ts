import type { MongoClient } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { openMongoRepositoryScope } from './mongoClient.server'

function fakeClient(createIndex: (key: Record<string, number>, options?: { unique?: boolean }) => Promise<string>) {
	const deleteMany = vi.fn()
	const close = vi.fn(async () => {})
	const indexes: Array<{ name: string; key: Record<string, number>; options?: { unique?: boolean } }> = []
	const client = {
		db: () => ({
			collection: (name: string) => ({
				createIndex: async (key: Record<string, number>, options?: { unique?: boolean }) => {
					indexes.push({ name, key, options })
					return createIndex(key, options)
				},
				deleteMany,
			}),
		}),
		close,
	}
	return { client: client as unknown as MongoClient, close, deleteMany, indexes }
}

describe('openMongoRepositoryScope', () => {
	it('builds indexes and closes only the client on dispose', async () => {
		const createIndex = vi.fn(async () => 'ok')
		const { client, close, deleteMany, indexes } = fakeClient(createIndex)
		const scope = await openMongoRepositoryScope('mongodb://localhost/app', 'app', async () => client)

		expect(createIndex).toHaveBeenCalledTimes(2)
		expect(indexes).toEqual([
			{ name: 'tasks', key: { id: 1 }, options: { unique: true } },
			{
				name: 'users',
				key: { email: 1 },
				options: { unique: true, collation: { locale: 'en', strength: 2 } },
			},
		])
		await scope[Symbol.asyncDispose]()
		expect(close).toHaveBeenCalledOnce()
		expect(deleteMany).not.toHaveBeenCalled()
	})

	it('closes the client when index initialization fails', async () => {
		const { client, close, deleteMany } = fakeClient(async () => {
			throw new Error('index failed')
		})
		await expect(openMongoRepositoryScope('mongodb://localhost/app', 'app', async () => client)).rejects.toThrow(
			'index failed',
		)
		expect(close).toHaveBeenCalledOnce()
		expect(deleteMany).not.toHaveBeenCalled()
	})

	it('closes an acquired client when repository construction fails', async () => {
		const close = vi.fn(async () => {})
		const client = {
			db: () => {
				throw new Error('db failed')
			},
			close,
		} as unknown as MongoClient
		await expect(openMongoRepositoryScope('mongodb://localhost/app', 'app', async () => client)).rejects.toThrow(
			'db failed',
		)
		expect(close).toHaveBeenCalledOnce()
	})
})
