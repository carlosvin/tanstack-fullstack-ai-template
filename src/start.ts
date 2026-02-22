import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'

/**
 * TanStack Start configuration with global middleware.
 *
 * The auth middleware runs on every incoming request (SSR, server routes,
 * server functions) and provides context.user to all downstream handlers.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [authMiddleware],
}))
