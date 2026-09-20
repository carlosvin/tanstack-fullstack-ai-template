import { createServerOnlyFn } from '@tanstack/react-start'
import { webServerEnv } from '../../env/webEnv.server'
import { createServerLogger } from '../../utils/serverLogger'
import { MongoRepository } from './mongoRepository.server'
import { SeedRepository } from './seedRepository'
import type { Repository } from './types'

const log = createServerLogger('repository')

type RepositoryType = 'seed' | 'mongo'

let instance: Repository | null = null

function getRepositoryType(): RepositoryType {
	const envType = webServerEnv.REPOSITORY_TYPE
	if (envType === 'seed' || envType === 'mongo') return envType
	if (webServerEnv.MONGODB_URI) return 'mongo'
	return 'seed'
}

function createRepository(): Repository {
	const type = getRepositoryType()
	log.info({ repo: type }, 'Using repository')

	switch (type) {
		case 'mongo':
			return new MongoRepository()
		default:
			return new SeedRepository()
	}
}

/** Returns the singleton repository instance. Never callable from the client. */
export const getRepository = createServerOnlyFn((): Repository => {
	if (!instance) {
		instance = createRepository()
	}
	return instance
})

/** Resets the singleton. Useful for testing. */
export function resetRepository(): void {
	instance = null
}
