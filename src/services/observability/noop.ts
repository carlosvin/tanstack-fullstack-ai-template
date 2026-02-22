import type { ObservabilityService } from './types'

/**
 * No-op observability implementation.
 * Used when no observability platform is configured (no VITE_SENTRY_DSN).
 * All methods are safe to call and simply pass through.
 */
export class NoopObservability implements ObservabilityService {
	async startSpan<T>(_name: string, fn: () => Promise<T>): Promise<T> {
		return fn()
	}

	setUser(_user: { email: string; name: string }): void {
		// No-op
	}

	captureError(_error: unknown): void {
		// No-op
	}
}
