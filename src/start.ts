import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'
import { webEnvMiddleware } from './middleware/webEnv'

/**
 * TanStack Start configuration with global middleware.
 *
 * The auth and web env middleware run on every incoming request (SSR, server
 * routes, server functions) and provide request-scoped context to downstream
 * handlers.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [authMiddleware, webEnvMiddleware],
}))
