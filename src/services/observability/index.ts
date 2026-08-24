import { getShellSession } from '../../env/webEnv.server'
import type { ShellSession } from '../schemas/shellSession'
import { NoopObservability } from './noop'
import { SentryObservability } from './sentry'
import type { ObservabilityService } from './types'

export type { ObservabilityService } from './types'

export type GetObservabilityOptions = {
	/** Optional shell session slice (e.g. from a route loader). Server defaults to startup `shellSession`. */
	shellSession?: Pick<ShellSession, 'SENTRY_DSN'>
}

let instance: ObservabilityService | null = null
/** Normalized DSN key the current `instance` was created for (undefined = no DSN). */
let instanceKey: string | undefined

function normalizeSentryDsn(value: string | undefined): string | undefined {
	if (value === undefined) return undefined
	const t = value.trim()
	return t === '' ? undefined : t
}

function resolveSentryDsn(options: GetObservabilityOptions): string | undefined {
	if (options.shellSession) return normalizeSentryDsn(options.shellSession.SENTRY_DSN)
	if (typeof window === 'undefined') return normalizeSentryDsn(getShellSession().SENTRY_DSN)
	return undefined
}

/**
 * Returns the singleton observability service for the effective DSN.
 * Server: uses validated `shellSession` when no override is passed.
 */
export function getObservability(options: GetObservabilityOptions): ObservabilityService {
	const dsn = resolveSentryDsn(options)
	if (!instance || instanceKey !== dsn) {
		instance = dsn ? new SentryObservability() : new NoopObservability()
		instanceKey = dsn
	}
	return instance
}
