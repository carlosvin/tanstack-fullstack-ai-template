import type { WebPublicEnv } from '../../env/webEnv'
import { webPublicEnv } from '../../env/webEnv'
import { NoopObservability } from './noop'
import { SentryObservability } from './sentry'
import type { ObservabilityService } from './types'

export type { ObservabilityService } from './types'

export type GetObservabilityOptions = {
	/** Browser: pass `publicEnv` from the root route loader (server-sourced). Do not import `webEnv` in client bundles. */
	publicEnv?: WebPublicEnv
}

let instance: ObservabilityService | null = null

function resolveSentryDsn(options?: GetObservabilityOptions): string | undefined {
	if (options?.publicEnv?.SENTRY_DSN) return options.publicEnv.SENTRY_DSN
	if (typeof window === 'undefined') return webPublicEnv.SENTRY_DSN
	return undefined
}

/**
 * Returns the singleton observability service.
 * Server: uses validated `webPublicEnv` when no `publicEnv` is passed.
 * Client: pass `{ publicEnv }` from the root loader; otherwise Sentry stays disabled (no-op).
 */
export function getObservability(options?: GetObservabilityOptions): ObservabilityService {
	const dsn = resolveSentryDsn(options)
	if (!instance) {
		instance = dsn ? new SentryObservability() : new NoopObservability()
		return instance
	}
	if (instance instanceof NoopObservability && dsn) {
		instance = new SentryObservability()
	}
	return instance
}
