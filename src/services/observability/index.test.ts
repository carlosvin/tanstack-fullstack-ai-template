import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShellSessionSchema } from '../schemas/shellSession'

function shellSessionSlice(sentryDsn: string | undefined) {
	return ShellSessionSchema.pick({ SENTRY_DSN: true }).parse({ SENTRY_DSN: sentryDsn })
}

async function _assertGetObservabilityRequiresOptionsObject() {
	const { getObservability } = await import('./index')

	// @ts-expect-error getObservability now requires an explicit options object.
	getObservability()

	getObservability({})
}

afterEach(() => {
	vi.resetModules()
	vi.doUnmock('../../env/webEnv.server')
	vi.unstubAllGlobals()
})

describe('getObservability', () => {
	it('uses the server shell session when callers pass an empty options object', async () => {
		vi.stubGlobal('window', undefined)

		vi.doMock('../../env/webEnv.server', async () => {
			const actual = await vi.importActual<typeof import('../../env/webEnv.server')>('../../env/webEnv.server')
			const shellSession = ShellSessionSchema.parse({
				...actual.getShellSession(),
				SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
			})

			return {
				...actual,
				getShellSession: () => shellSession,
				shellSession,
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

		const noop = getObservability({ shellSession: shellSessionSlice(undefined) })
		const sentry = getObservability({
			shellSession: shellSessionSlice('https://examplePublicKey@o0.ingest.sentry.io/0'),
		})

		expect(noop).toBeInstanceOf(NoopObservability)
		expect(sentry).toBeInstanceOf(SentryObservability)
		expect(noop).not.toBe(sentry)
	})

	it('rebuilds when DSN is cleared after being set', async () => {
		const { getObservability } = await import('./index')
		const { NoopObservability } = await import('./noop')
		const { SentryObservability } = await import('./sentry')

		const sentry = getObservability({
			shellSession: shellSessionSlice('https://examplePublicKey@o0.ingest.sentry.io/0'),
		})
		const noop = getObservability({ shellSession: shellSessionSlice(undefined) })

		expect(sentry).toBeInstanceOf(SentryObservability)
		expect(noop).toBeInstanceOf(NoopObservability)
	})
})
