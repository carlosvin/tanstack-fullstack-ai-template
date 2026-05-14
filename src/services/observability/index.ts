import type { WebPublicEnv } from '../../env/webEnv'
import { webPublicEnv } from '../../env/webEnv'
import { NoopObservability } from './noop'
import { SentryObservability } from './sentry'
import type { ObservabilityService } from './types'

export type { ObservabilityService } from './types'

export type GetObservabilityOptions = {
	/** Optional public env slice (e.g. from a route loader that called a GET server fn). Do not import `webEnv` in client bundles. */
	publicEnv?: WebPublicEnv
}

let instance: ObservabilityService | null = null
/** Normalized DSN key the current `instance` was created for (undefined = no DSN). */
let instanceKey: string | undefined

function normalizeSentryDsn(value: string | undefined): string | undefined {
	if (value === undefined) return undefined
	const t = value.trim()
	return t === '' ? undefined : t
}

function resolveSentryDsn(options?: GetObservabilityOptions): string | undefined {
	if (options?.publicEnv) return normalizeSentryDsn(options.publicEnv.SENTRY_DSN)
	if (typeof window === 'undefined') return normalizeSentryDsn(webPublicEnv.SENTRY_DSN)
	return undefined
}

/**
 * Returns the singleton observability service for the effective DSN.
 * Server: uses validated `webPublicEnv` when no `publicEnv` is passed.
 * Client: pass `{ publicEnv }` when you have loader-sourced data; otherwise Sentry stays disabled (no-op).
 *
 * If the resolved DSN changes (e.g. client first hydrates without loader data, then receives `publicEnv`),
 * the implementation is recreated to match.
 */
export function getObservability(options?: GetObservabilityOptions): ObservabilityService {
	const dsn = resolveSentryDsn(options)
	if (!instance || instanceKey !== dsn) {
		instance = dsn ? new SentryObservability() : new NoopObservability()
		instanceKey = dsn
	}
	return instance
}
