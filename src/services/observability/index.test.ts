import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebPublicEnvSchema } from '../../env/webEnv'

function publicEnvSlice(sentryDsn: string | undefined) {
	return WebPublicEnvSchema.parse({ SENTRY_DSN: sentryDsn })
}

afterEach(() => {
	vi.resetModules()
})

describe('getObservability', () => {
	it('rebuilds the singleton when loader-sourced DSN changes from unset to set', async () => {
		const { getObservability } = await import('./index')
		const { NoopObservability } = await import('./noop')
		const { SentryObservability } = await import('./sentry')

		const noop = getObservability({ publicEnv: publicEnvSlice(undefined) })
		const sentry = getObservability({ publicEnv: publicEnvSlice('https://examplePublicKey@o0.ingest.sentry.io/0') })

		expect(noop).toBeInstanceOf(NoopObservability)
		expect(sentry).toBeInstanceOf(SentryObservability)
		expect(noop).not.toBe(sentry)
	})

	it('rebuilds when DSN is cleared after being set', async () => {
		const { getObservability } = await import('./index')
		const { NoopObservability } = await import('./noop')
		const { SentryObservability } = await import('./sentry')

		const sentry = getObservability({ publicEnv: publicEnvSlice('https://examplePublicKey@o0.ingest.sentry.io/0') })
		const noop = getObservability({ publicEnv: publicEnvSlice(undefined) })

		expect(sentry).toBeInstanceOf(SentryObservability)
		expect(noop).toBeInstanceOf(NoopObservability)
	})
})
