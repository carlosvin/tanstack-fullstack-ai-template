import { webServerEnv } from '../../env/webEnv.server'
import { createServerLogger } from '../../utils/serverLogger'
import { openMongoRepositoryScope } from '../db/mongoClient.server'
import { SeedRepository } from './seedRepository'
import type { Repository } from './types'

const log = createServerLogger('repository')

type RepositoryBundle = {
	repository: Repository
	dispose: (() => Promise<void>) | null
}

let bundlePromise: Promise<RepositoryBundle> | null = null

async function openRepository(): Promise<RepositoryBundle> {
	const type = webServerEnv.REPOSITORY_TYPE ?? (webServerEnv.MONGODB_URI ? 'mongo' : 'seed')
	log.info({ repo: type }, 'Using repository')
	if (type !== 'mongo') {
		return { repository: new SeedRepository(), dispose: null }
	}

	const uri = webServerEnv.MONGODB_URI
	if (!uri) {
		throw new Error('MONGODB_URI environment variable is required for MongoDB repository.')
	}

	const dbName = webServerEnv.MONGODB_DB_NAME ?? 'app-db'
	const opened = await openMongoRepositoryScope(uri, dbName)
	log.info({ dbName }, 'Connected MongoDB repository')
	return {
		repository: opened.repository,
		dispose: async () => opened[Symbol.asyncDispose](),
	}
}

/** Returns the singleton repository. Connects and initializes Mongo when selected. */
export async function getRepositorySingleton(): Promise<Repository> {
	if (!bundlePromise) {
		bundlePromise = openRepository().catch((error) => {
			bundlePromise = null
			throw error
		})
	}
	return bundlePromise.then((bundle) => bundle.repository)
}

/** Closes the owned Mongo client. Seed mode is a no-op. */
export async function closeRepositorySingleton(): Promise<void> {
	const pending = bundlePromise
	if (!pending) return

	const bundle = await pending.catch(() => null)
	if (!bundle?.dispose) return

	bundlePromise = null
	await bundle.dispose()
}

/** Test-only reset of module singleton state. */
export function resetRepositorySingletonForTests(): void {
	bundlePromise = null
}
