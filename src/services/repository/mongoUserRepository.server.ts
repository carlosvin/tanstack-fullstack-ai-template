import type { Collection, Db } from 'mongodb'
import { parseUserProfileRepoOrNull, toUserAccessRepo } from '../schemas/repoParsers'
import type { UserAccessRepo, UserProfileRepo } from '../schemas/repository'
import type { IndexableRepository } from './types'

const USERS_COLLECTION = 'users'

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
		await this.collection.createIndex({ email: 1 }, { unique: true })
	}

	async getUserProfile(email: string): Promise<UserProfileRepo | null> {
		const row = await this.collection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
		return parseUserProfileRepoOrNull(row)
	}

	async getUserAccess(email: string): Promise<UserAccessRepo | null> {
		const profile = await this.getUserProfile(email)
		return profile ? toUserAccessRepo(profile) : null
	}
}
