/**
 * Shared Sentry init for the web server entry (`instrument.server.mts`).
 * All values are pre-resolved by the caller — no `process.env` reads inside.
 */
import * as Sentry from '@sentry/tanstackstart-react'

import type { DeploymentEnv } from './instrument.env.shared.mts'

export interface InitSentryOptions {
	serverName: string
	dsn: string | undefined
	environment: DeploymentEnv
	release?: string
}

/**
 * Initialize Sentry for the server runtime. No-op when no DSN is set.
 */
export function initSentry({ serverName, dsn, environment, release }: InitSentryOptions): void {
	if (!dsn) {
		if (environment !== 'development') {
			console.warn(`[observability] SENTRY_DSN is not set — server-side Sentry is disabled (${environment}).`)
		}
		return
	}

	Sentry.init({
		dsn,
		environment,
		serverName,
		...(release ? { release } : {}),
		sendDefaultPii: true,
		tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
	})
}
