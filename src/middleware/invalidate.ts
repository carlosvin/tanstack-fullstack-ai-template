/**
 * Function middleware that invalidates the TanStack Router cache on the client
 * after a mutation server function completes.
 *
 * Chain onto POST server functions via `.middleware([invalidateMiddleware])`
 * so route loaders re-fetch stale data after writes.
 *
 * Runs only on the client side — the `.client()` handler fires after the
 * server response is received.
 */
import { createMiddleware, getRouterInstance } from '@tanstack/react-start'

export const invalidateMiddleware = createMiddleware({ type: 'function' }).client(async ({ next }) => {
	const result = await next()
	const router = await getRouterInstance()
	router.invalidate()
	return result
})
