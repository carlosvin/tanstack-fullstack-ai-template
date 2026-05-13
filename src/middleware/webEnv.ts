import { createMiddleware } from '@tanstack/react-start'
import { webPublicEnv } from '../env/webEnv'

/**
 * Request middleware that injects the public env slice into `ctx.context.publicEnv`.
 * Register in src/start.ts alongside authMiddleware.
 * When a client component needs the public env slice, fetch it from a GET
 * server function in a route loader — do not import `webEnv` in client bundles.
 */
export const webEnvMiddleware = createMiddleware().server(({ next }) => next({ context: { publicEnv: webPublicEnv } }))
