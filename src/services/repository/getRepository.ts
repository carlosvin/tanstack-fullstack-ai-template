import { MongoRepository } from './mongoRepository'
import { SeedRepository } from './seedRepository'
import type { ReadRepository, WritableRepository } from './types'

type RepositoryType = 'seed' | 'mongo'

let readInstance: ReadRepository | null = null
let writableInstance: WritableRepository | null = null

/**
 * Determines which repository implementation to use.
 * Controlled via REPOSITORY_TYPE env var, or auto-detected from MONGODB_URI.
 */
function getRepositoryType(): RepositoryType {
	const envType = process.env.REPOSITORY_TYPE as RepositoryType | undefined
	if (envType === 'seed' || envType === 'mongo') return envType
	if (process.env.MONGODB_URI) return 'mongo'
	return 'seed'
}

function createRepositories(): { read: ReadRepository; writable: WritableRepository } {
	const type = getRepositoryType()
	console.info(`[repository] Using ${type} repository`)

	switch (type) {
		case 'mongo': {
			const repo = new MongoRepository()
			return { read: repo, writable: repo }
		}
		default: {
			const repo = new SeedRepository()
			return { read: repo, writable: repo }
		}
	}
}

/** Returns the singleton read repository instance. */
export function getReadRepository(): ReadRepository {
	if (!readInstance) {
		const repos = createRepositories()
		readInstance = repos.read
		writableInstance = repos.writable
	}
	return readInstance
}

/** Returns the singleton writable repository instance. */
export function getWritableRepository(): WritableRepository {
	if (!writableInstance) {
		const repos = createRepositories()
		readInstance = repos.read
		writableInstance = repos.writable
	}
	return writableInstance
}

/** Resets singletons. Useful for testing. */
export function resetRepository(): void {
	readInstance = null
	writableInstance = null
}
