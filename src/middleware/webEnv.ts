import { createMiddleware } from '@tanstack/react-start'
import { shellSession, webServerEnv } from '../env/webEnv'
import { authMiddleware } from './auth'

/**
 * Chains auth, then attaches startup-validated `serverEnv` and `shellSession`.
 * Server fns that `.middleware([webEnvMiddleware])` infer those fields from the chain.
 */
export const webEnvMiddleware = createMiddleware()
	.middleware([authMiddleware])
	.server(({ next }) =>
		next({
			context: {
				serverEnv: webServerEnv,
				shellSession,
			},
		}),
	)
