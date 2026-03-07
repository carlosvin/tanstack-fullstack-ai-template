import type { ObservabilityService } from './types'

type SentryLike = {
	startSpan: <T>(options: { name: string }, fn: () => T) => T
	setUser: (user: { email: string; username: string }) => void
	captureException: (error: unknown) => void
}

let _sentry: SentryLike | null = null
let _loading: Promise<SentryLike | null> | null = null

/**
 * Sentry-backed observability implementation.
 * Loads the Sentry module once on first use. If the module is not installed,
 * all operations gracefully degrade to no-ops.
 *
 * To enable: `pnpm add @sentry/tanstackstart-react`
 */
export class SentryObservability implements ObservabilityService {
	private loadSentry(): Promise<SentryLike | null> {
		if (_sentry) return Promise.resolve(_sentry)
		if (_loading) return _loading
		_loading = (Function('return import("@sentry/tanstackstart-react")')() as Promise<SentryLike>)
			.then((mod) => {
				_sentry = mod
				return mod
			})
			.catch(() => {
				_sentry = null
				return null
			})
		return _loading
	}

	async startSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
		const s = await this.loadSentry()
		if (s) return s.startSpan({ name }, fn)
		return fn()
	}

	setUser(user: { email: string; name: string }): void {
		this.loadSentry().then((s) => s?.setUser({ email: user.email, username: user.name }))
	}

	captureError(error: unknown): void {
		this.loadSentry().then((s) => s?.captureException(error))
	}
}
