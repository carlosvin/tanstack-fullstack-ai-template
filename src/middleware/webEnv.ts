import { createMiddleware } from '@tanstack/react-start'
import { getShellSession, getWebServerEnv } from '../env/webEnv.server'
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
				serverEnv: getWebServerEnv(),
				shellSession: getShellSession(),
			},
		}),
	)
