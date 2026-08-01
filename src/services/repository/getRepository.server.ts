import { webServerEnv } from '../../env/webEnv'
import { createServerLogger } from '../../utils/serverLogger'
import { MongoRepository } from './mongoRepository.server'
import { SeedRepository } from './seedRepository'
import type { ReadRepository, WritableRepository } from './types'

const log = createServerLogger('repository')

type RepositoryType = 'seed' | 'mongo'

let readInstance: ReadRepository | null = null
let writableInstance: WritableRepository | null = null

function getRepositoryType(): RepositoryType {
	const envType = webServerEnv.REPOSITORY_TYPE
	if (envType === 'seed' || envType === 'mongo') return envType
	if (webServerEnv.MONGODB_URI) return 'mongo'
	return 'seed'
}

function createRepositories(): { read: ReadRepository; writable: WritableRepository } {
	const type = getRepositoryType()
	log.info({ repo: type }, 'Using repository')

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
