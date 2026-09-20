import { createServerOnlyFn } from '@tanstack/react-start'
import { webServerEnv } from '../../env/webEnv.server'
import { createServerLogger } from '../../utils/serverLogger'
import { MongoRepository } from './mongoRepository.server'
import { SeedRepository } from './seedRepository'
import type { Repository } from './types'

const log = createServerLogger('repository')

let instance: Repository | null = null

/** Returns the singleton repository. Never callable from the client. */
export const getRepository = createServerOnlyFn((): Repository => {
	if (instance) return instance

	const type = webServerEnv.REPOSITORY_TYPE ?? (webServerEnv.MONGODB_URI ? 'mongo' : 'seed')
	log.info({ repo: type }, 'Using repository')
	instance = type === 'mongo' ? new MongoRepository() : new SeedRepository()
	return instance
})
