import { createMiddleware } from '@tanstack/react-start'
import { appMeta } from '../env/appMeta'
import { webPublicEnv, webServerEnv } from '../env/webEnv'
import { authMiddleware } from './auth'

/**
 * Chains auth, then attaches startup-validated env/app meta via `next({ context })`.
 * Downstream server fns that `.middleware([webEnvMiddleware])` infer those fields —
 * no Register augmentation needed.
 *
 * Sole global entry in `src/start.ts`. Client config: `getBrowserShellSession` + loader.
 */
export const webEnvMiddleware = createMiddleware()
	.middleware([authMiddleware])
	.server(({ next }) =>
		next({
			context: {
				serverEnv: webServerEnv,
				publicEnv: webPublicEnv,
				appMeta,
			},
		}),
	)
