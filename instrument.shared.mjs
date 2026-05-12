/**
 * Shared Sentry init for the web server entry (`instrument.server.mjs`).
 *
 * Plain ESM (no TS) so it loads identically from Node's `--import` hook.
 * All values are pre-resolved by the caller — no `process.env` reads inside.
 */
import * as Sentry from '@sentry/tanstackstart-react'

/**
 * @typedef {'development'|'staging'|'production'} DeploymentEnv
 */

/**
 * @typedef {object} InitSentryOptions
 * @property {string}           serverName  - Human-readable server name shown on every Sentry event.
 * @property {string|undefined} dsn         - Sentry DSN, already resolved from env. No-op when falsy.
 * @property {DeploymentEnv}    environment - Deployment environment, already resolved and validated.
 * @property {string}           [release]   - Optional release identifier (e.g. package version).
 */

/**
 * Initialize Sentry for the server runtime. No-op when no DSN is set.
 *
 * @param {InitSentryOptions} options
 * @returns {void}
 */
export function initSentry({ serverName, dsn, environment, release }) {
	if (!dsn) return

	Sentry.init({
		dsn,
		environment,
		serverName,
		...(release ? { release } : {}),
		sendDefaultPii: true,
		tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
		replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
		replaysOnErrorSampleRate: 1.0,
	})
}
