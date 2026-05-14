import { createStart } from '@tanstack/react-start'
import { webEnvMiddleware } from './middleware/webEnv'

/**
 * TanStack Start configuration with global middleware.
 *
 * {@link webEnvMiddleware} chains auth then public env so both land on the same
 * request context object for server functions and route handlers.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [webEnvMiddleware],
}))
