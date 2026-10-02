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

let opening: Promise<RepositoryBundle> | null = null
let ready: RepositoryBundle | null = null

/**
 * Composition root. Connects when Mongo is selected, then constructs the
 * repository with `new`. Callers receive the instance; they do not await a factory.
 */
export async function ensureRepository(): Promise<Repository> {
	if (ready) return ready.repository
	if (!opening) {
		opening = constructRepository()
			.then((bundle) => {
				ready = bundle
				opening = null
				return bundle
			})
			.catch((error) => {
				opening = null
				throw error
			})
	}
	const bundle = await opening
	return bundle.repository
}

async function constructRepository(): Promise<RepositoryBundle> {
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

/** Closes the owned Mongo client. Seed mode is a no-op. */
export async function closeRepositorySingleton(): Promise<void> {
	const pending = opening
	const current = pending ? await pending.catch(() => null) : ready
	if (!current?.dispose) return

	ready = null
	opening = null
	await current.dispose()
}

/** Test-only reset of module singleton state. */
export function resetRepositorySingletonForTests(): void {
	opening = null
	ready = null
}
