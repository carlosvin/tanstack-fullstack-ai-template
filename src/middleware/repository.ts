import { createMiddleware } from '@tanstack/react-start'
import { ensureRepository } from '../services/repository/getRepository.server'

/**
 * Injects the process repository. The composition root constructs it with `new`
 * after connecting; handlers read `context.repository`.
 */
export const repositoryMiddleware = createMiddleware().server(async ({ next }) => {
	const repository = await ensureRepository()
	return next({ context: { repository } })
})
