import { webPublicEnv } from '../../env/webEnv'
import { NoopObservability } from './noop'
import { SentryObservability } from './sentry'
import type { ObservabilityService } from './types'

export type { ObservabilityService } from './types'

let instance: ObservabilityService | null = null

/**
 * Returns the singleton observability service.
 * Uses Sentry if SENTRY_DSN is set in the validated env, otherwise falls back to no-op.
 */
export function getObservability(): ObservabilityService {
	if (!instance) {
		instance = webPublicEnv.SENTRY_DSN ? new SentryObservability() : new NoopObservability()
	}
	return instance
}
