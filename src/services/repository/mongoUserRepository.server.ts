import type { Collection, Db } from 'mongodb'
import type { IndexableRepository } from '@/services/repository/types'
import { parseUserProfileRepoOrNull, toUserAccessRepo } from '@/services/schemas/repoParsers'
import type { UserAccessRepo, UserProfileRepo } from '@/services/schemas/repository'

const USERS_COLLECTION = 'users'

/** Case-insensitive email uniqueness and lookup share the same collation. */
const EMAIL_COLLATION = { locale: 'en', strength: 2 } as const

export interface UserCollectionRepository extends IndexableRepository {
	getUserProfile(email: string): Promise<UserProfileRepo | null>
	getUserAccess(email: string): Promise<UserAccessRepo | null>
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
}
