import { createStart } from '@tanstack/react-start'
import { webEnvMiddleware } from './middleware/webEnv'
import './register-request-context'

/**
 * TanStack Start configuration with global middleware.
 *
 * {@link webEnvMiddleware} chains auth then startup-validated env / app meta so
 * both land on the same typed request context for server functions and routes.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [webEnvMiddleware],
}))
