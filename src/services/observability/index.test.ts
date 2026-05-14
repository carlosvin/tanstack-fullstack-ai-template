import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebPublicEnvSchema } from '../../env/webEnv'

function publicEnvSlice(sentryDsn: string | undefined) {
	return WebPublicEnvSchema.parse({ SENTRY_DSN: sentryDsn })
}

async function _assertGetObservabilityRequiresOptionsObject() {
	const { getObservability } = await import('./index')

	// @ts-expect-error getObservability now requires an explicit options object.
	getObservability()

	getObservability({})
}

afterEach(() => {
	vi.resetModules()
	vi.doUnmock('../../env/webEnv')
	vi.unstubAllGlobals()
})

describe('getObservability', () => {
	it('uses the server public env when callers pass an empty options object', async () => {
		vi.stubGlobal('window', undefined)

		vi.doMock('../../env/webEnv', async () => {
			const actual = await vi.importActual<typeof import('../../env/webEnv')>('../../env/webEnv')

			return {
				...actual,
				webPublicEnv: publicEnvSlice('https://examplePublicKey@o0.ingest.sentry.io/0'),
			}
		})

		const { getObservability } = await import('./index')
		const { SentryObservability } = await import('./sentry')

		expect(getObservability({})).toBeInstanceOf(SentryObservability)
	})

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
