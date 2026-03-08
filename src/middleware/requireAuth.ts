/**
 * Function middleware that requires an authenticated user for server functions.
 * Chain onto POST (mutation) server functions so auth is required only for writes.
 * On 401, throws before the handler runs; the handler can assume context.user has email.
 *
 * Chains authMiddleware so that context.user and context.userProfile are typed
 * downstream without casts.
 */
import { createMiddleware } from '@tanstack/react-start'
import { requireAuth } from '../utils/auth'
import { authMiddleware } from './auth'

export const requireAuthMiddleware = createMiddleware({ type: 'function' })
	.middleware([authMiddleware])
	.server(({ next, context }) => {
		requireAuth(context)
		return next()
	})
