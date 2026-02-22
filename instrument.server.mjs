/**
 * Server-side observability initialization.
 * Loaded via NODE_OPTIONS='--import ./instrument.server.mjs' before the app starts.
 *
 * Currently uses Sentry. To swap to another provider, replace the init call below
 * and update the ObservabilityService implementation in src/services/observability/.
 */

const sentryDsn = process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
	console.warn('[observability] No VITE_SENTRY_DSN set — server-side observability is disabled.')
} else {
	const Sentry = await import('@sentry/tanstackstart-react')

	Sentry.init({
		dsn: sentryDsn,
		sendDefaultPii: true,
		tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
		replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
		replaysOnErrorSampleRate: 1.0,
		environment: process.env.ENV ?? process.env.NODE_ENV ?? 'development',
	})
}
