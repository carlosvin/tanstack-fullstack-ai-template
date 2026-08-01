import { createMiddleware } from '@tanstack/react-start'
import { appMeta } from '../env/appMeta'
import { webPublicEnv, webServerEnv } from '../env/webEnv'
import { authMiddleware } from './auth'

/**
 * Request middleware that runs {@link authMiddleware} first, then injects
 * startup-validated `serverEnv`, `publicEnv`, and `appMeta` on the same request
 * context (TanStack merges `next({ context })` across chained middleware).
 *
 * Register as the sole global entry in `src/start.ts` — do not list
 * `authMiddleware` again beside this wrapper.
 *
 * When a client component needs browser-safe config, fetch
 * `getBrowserShellSession` from a route loader — do not import `webEnv` in
 * client bundles.
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
