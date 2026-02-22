import type { ProcessedResponse } from '../../types'
import { HttpError } from '../../utils/httpError'

/**
 * Wraps a mutation call and normalizes errors into a ProcessedResponse.
 * Server functions for mutations should NOT throw — they return { data, error } instead.
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
