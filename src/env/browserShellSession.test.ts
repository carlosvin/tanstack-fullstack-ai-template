import { describe, expect, it } from 'vitest'
import { appMeta } from './appMeta'
import { BrowserShellSessionSchema, browserShellSession, toBrowserShellSession } from './browserShellSession'
import { webPublicEnv } from './webEnv'

describe('browserShellSession', () => {
	it('is a once-parsed projection of publicEnv and appMeta', () => {
		expect(browserShellSession.publicEnv).toEqual(webPublicEnv)
		expect(browserShellSession.app).toEqual(appMeta)
		expect(BrowserShellSessionSchema.parse(browserShellSession)).toEqual(browserShellSession)
	})

	it('only allowlists browser-safe fields', () => {
		expect(Object.keys(browserShellSession).sort()).toEqual(['app', 'publicEnv'])
		expect(Object.keys(browserShellSession.app).sort()).toEqual(['name', 'version'])
		expect(browserShellSession).not.toHaveProperty('serverEnv')
	})

	it('rejects invalid app meta at the boundary', () => {
		expect(() =>
			toBrowserShellSession({
				publicEnv: webPublicEnv,
				appMeta: { name: '', version: '1.0.0' },
			}),
		).toThrow()
	})
})
