import type { ObservabilityService } from './types'

type SentryLike = {
	startSpan: <T>(options: { name: string }, fn: () => T) => T
	setUser: (user: { email: string; username: string }) => void
	captureException: (error: unknown) => void
}

let _sentry: SentryLike | null = null

/**
 * Sentry-backed observability implementation.
 * Loads the Sentry module once on first use. If the module is not installed,
 * all operations gracefully degrade to no-ops.
 *
 * To enable: `pnpm add @sentry/tanstackstart-react`
 */
export class SentryObservability implements ObservabilityService {
	private async sentry(): Promise<SentryLike | null> {
		if (_sentry) return _sentry
		try {
			_sentry = await (Function('return import("@sentry/tanstackstart-react")')() as Promise<SentryLike>)
		} catch {
			_sentry = null
		}
		return _sentry
	}

	async startSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
		const s = await this.sentry()
		if (s) return s.startSpan({ name }, fn)
		return fn()
	}

	async setUser(user: { email: string; name: string }): Promise<void> {
		const s = await this.sentry()
		s?.setUser({ email: user.email, username: user.name })
	}

	async captureError(error: unknown): Promise<void> {
		const s = await this.sentry()
		s?.captureException(error)
	}
}
