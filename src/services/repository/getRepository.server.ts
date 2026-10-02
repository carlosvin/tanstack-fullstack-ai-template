import { createServerOnlyFn } from '@tanstack/react-start'
import { webServerEnv } from '../../env/webEnv.server'
import { createServerLogger } from '../../utils/serverLogger'
import { type MongoRepositoryScope, openMongoRepositoryScope } from '../db/mongoClient.server'
import { SeedRepository } from './seedRepository'
import type { Repository } from './types'

const log = createServerLogger('repository')

let instance: Promise<Repository> | null = null
let scope: MongoRepositoryScope | null = null

async function openRepository(): Promise<Repository> {
	const type = webServerEnv.REPOSITORY_TYPE ?? (webServerEnv.MONGODB_URI ? 'mongo' : 'seed')
	log.info({ repo: type }, 'Using repository')
	if (type !== 'mongo') return new SeedRepository()

	const uri = webServerEnv.MONGODB_URI
	if (!uri) {
		throw new Error('MONGODB_URI environment variable is required for MongoDB repository.')
	}

	const dbName = webServerEnv.MONGODB_DB_NAME ?? 'app-db'
	const opened = await openMongoRepositoryScope(uri, dbName)
	scope = opened
	log.info({ dbName }, 'Connected MongoDB repository')
	return opened.repository
}

/** Returns the singleton repository. Connects and initializes Mongo when selected. */
export const getRepository = createServerOnlyFn((): Promise<Repository> => {
	if (!instance) {
		instance = openRepository().catch((error) => {
			instance = null
			scope = null
			throw error
		})
	}
	return instance
})

/** Closes the owned Mongo client. Seed mode is a no-op. */
export const closeRepository = createServerOnlyFn(async (): Promise<void> => {
	const current = scope
	scope = null
	instance = null
	await current?.[Symbol.asyncDispose]()
})
