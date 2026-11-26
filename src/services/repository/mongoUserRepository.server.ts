import type { Collection, Db } from 'mongodb'
import type { IndexableRepository } from '@/services/repository/types'
import { parseUserProfileRepoOrNull, toUserAccessRepo } from '@/services/schemas/repoParsers'
import {
	type UserAccessRepo,
	type UserPreferencesRepo,
	UserPreferencesRepoSchema,
	type UserProfileRepo,
	UserProfileRepoSchema,
} from '@/services/schemas/repository'

const USERS_COLLECTION = 'users'

/** Case-insensitive email uniqueness and lookup share the same collation. */
const EMAIL_COLLATION = { locale: 'en', strength: 2 } as const

export interface UserCollectionRepository extends IndexableRepository {
	getUserProfile(email: string): Promise<UserProfileRepo | null>
	getUserAccess(email: string): Promise<UserAccessRepo | null>
	updateUserPreferences(
		email: string,
		preferences: UserPreferencesRepo,
		identity?: { name: string },
	): Promise<UserProfileRepo>
}

/** Owns the users collection: profile reads and the email index. */
export class MongoUserRepository implements UserCollectionRepository {
	private readonly collection: Collection<UserProfileRepo>

	constructor(db: Db) {
		this.collection = db.collection<UserProfileRepo>(USERS_COLLECTION)
	}

	async createIndexes(): Promise<void> {
		await this.collection.createIndex({ email: 1 }, { unique: true, collation: EMAIL_COLLATION })
	}

	async getUserProfile(email: string): Promise<UserProfileRepo | null> {
		const row = await this.collection.findOne({ email }, { collation: EMAIL_COLLATION })
		return parseUserProfileRepoOrNull(row)
	}

	async getUserAccess(email: string): Promise<UserAccessRepo | null> {
		const profile = await this.getUserProfile(email)
		return profile ? toUserAccessRepo(profile) : null
	}

	async updateUserPreferences(
		email: string,
		preferences: UserPreferencesRepo,
		identity?: { name: string },
	): Promise<UserProfileRepo> {
		const prefs = UserPreferencesRepoSchema.parse(preferences)
		const existing = await this.getUserProfile(email)
		const next = UserProfileRepoSchema.parse({
			email: existing?.email ?? email,
			name: existing?.name ?? identity?.name ?? email,
			role: existing?.role,
			avatarUrl: existing?.avatarUrl,
			preferences: prefs,
		})
		// Omit undefined optional fields — Mongo's default serialize writes them as null,
		// which UserProfileRepoSchema then rejects on the next auth profile load.
		const $set: Record<string, unknown> = {
			email: next.email,
			name: next.name,
			preferences: next.preferences,
		}
		if (next.role !== undefined) $set.role = next.role
		if (next.avatarUrl !== undefined) $set.avatarUrl = next.avatarUrl
		await this.collection.updateOne({ email: next.email }, { $set }, { upsert: true, collation: EMAIL_COLLATION })
		return next
	}
}
