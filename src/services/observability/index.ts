import { NoopObservability } from './noop'
import { SentryObservability } from './sentry'
import type { ObservabilityService } from './types'

export type { ObservabilityService } from './types'

let instance: ObservabilityService | null = null

/**
 * Returns the singleton observability service.
 * Uses Sentry if VITE_SENTRY_DSN is set, otherwise falls back to no-op.
 */
export function getObservability(): ObservabilityService {
	if (!instance) {
		const dsn = process.env.VITE_SENTRY_DSN
		instance = dsn ? new SentryObservability() : new NoopObservability()
	}
	return instance
}
