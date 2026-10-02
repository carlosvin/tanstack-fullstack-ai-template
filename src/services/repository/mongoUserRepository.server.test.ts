import type { Db } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { MongoUserRepository } from './mongoUserRepository.server'

interface StoredUser {
	email: string
	name: string
	role: string
}

function emailsEqual(left: string, right: string, collation?: { locale: string; strength: number }): boolean {
	if (collation?.strength === 2) {
		return left.localeCompare(right, collation.locale, { sensitivity: 'accent' }) === 0
	}
	return left === right
}

function createUserDb() {
	const docs: StoredUser[] = []
	const indexes: Array<{ key: Record<string, number>; options?: Record<string, unknown> }> = []
	const collection = {
		createIndex: async (key: Record<string, number>, options?: Record<string, unknown>) => {
			indexes.push({ key, options })
			return 'users_email'
		},
		findOne: async (filter: { email?: string }, options?: { collation?: { locale: string; strength: number } }) => {
			const email = filter.email
			if (!email) return null
			return docs.find((doc) => emailsEqual(doc.email, email, options?.collation)) ?? null
		},
	}
	const db = {
		collection: (name: string) => {
			if (name !== 'users') throw new Error(`unexpected collection ${name}`)
			return collection
		},
	} as unknown as Db
	return { db, docs, indexes }
}

describe('MongoUserRepository', () => {
	it('declares a case-insensitive unique email index', async () => {
		const { db, indexes } = createUserDb()
		const repo = new MongoUserRepository(db)
		await repo.createIndexes()
		expect(indexes).toEqual([
			{
				key: { email: 1 },
				options: { unique: true, collation: { locale: 'en', strength: 2 } },
			},
		])
	})

	it('looks up profiles with literal equality and case-insensitive collation', async () => {
		const { db, docs } = createUserDb()
		docs.push({ email: 'alice@example.com', name: 'Alice', role: 'Engineering Lead' })
		const repo = new MongoUserRepository(db)
		const profile = await repo.getUserProfile('Alice@Example.COM')
		expect(profile?.email).toBe('alice@example.com')
	})

	it('treats email metacharacters as literal characters', async () => {
		const { db, docs } = createUserDb()
		docs.push({ email: 'user+tag@example.com', name: 'Tagged', role: 'Engineer' })
		const repo = new MongoUserRepository(db)
		const profile = await repo.getUserProfile('user+tag@example.com')
		expect(profile?.name).toBe('Tagged')
	})
})
