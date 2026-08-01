import { createMiddleware } from '@tanstack/react-start'
import { webPublicEnv } from '../env/webEnv'
import { authMiddleware } from './auth'

/**
 * Request middleware that runs {@link authMiddleware} first, then injects
 * `publicEnv` on the same request context (TanStack merges `next({ context })`
 * across chained middleware).
 *
 * Register as the sole global entry in `src/start.ts` — do not list
 * `authMiddleware` again beside this wrapper.
 *
 * When a client component needs the public env slice, fetch it from a GET
 * server function in a route loader — do not import `webEnv` in client bundles.
 */
export const webEnvMiddleware = createMiddleware()
	.middleware([authMiddleware])
	.server(({ next }) => next({ context: { publicEnv: webPublicEnv } }))
