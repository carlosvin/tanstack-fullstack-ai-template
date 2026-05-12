import { createMiddleware } from '@tanstack/react-start'
import { webPublicEnv } from '../env/webEnv'

/**
 * Request middleware that injects the public env slice into `ctx.context.publicEnv`.
 * Register in src/start.ts alongside authMiddleware.
 * The root loader should also expose publicEnv to React via loader data so the
 * browser can read ENV / LOG_LEVEL / SENTRY_DSN without a window.__ENV__ global.
 */
export const webEnvMiddleware = createMiddleware().server(({ next }) => next({ context: { publicEnv: webPublicEnv } }))
