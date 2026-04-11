import type { ProcessedResponse } from '../../types'
import { HttpError } from '../../utils/httpError'

/**
 * Wraps a mutation server function call and normalizes thrown errors into a
 * `ProcessedResponse`. Mutation handlers throw `HttpError` on auth/not-found
 * failures; this helper catches those (and unexpected errors) so callers get
 * `{ data }` or `{ error }` without try/catch boilerplate.
 *
 * AI tools use `safeToolHandler` for the same purpose.
 */
export async function processResponse<T>(fn: () => Promise<T>): Promise<ProcessedResponse<T>> {
	try {
		const data = await fn()
		return { data }
	} catch (err) {
		if (err instanceof HttpError) {
			return { error: { message: err.message, code: err.statusCode } }
		}
		const message = err instanceof Error ? err.message : 'An unexpected error occurred'
		return { error: { message, code: 500 } }
	}
}
