/**
 * Observability service interface.
 *
 * Abstracts monitoring, tracing, and user feedback behind an interface
 * so the underlying provider (Sentry, Datadog, etc.) can be swapped
 * without touching application code.
 */
export interface ObservabilityService {
	/** Wraps an async operation in a performance span/trace. */
	startSpan<T>(name: string, fn: () => Promise<T>): Promise<T>

	/** Associates the current session/request with a user for error tracking. */
	setUser(user: { email: string; name: string }): void

	/** Captures an error and sends it to the observability platform. */
	captureError(error: unknown): void
}
