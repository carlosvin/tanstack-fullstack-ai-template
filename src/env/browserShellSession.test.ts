import { describe, expect, it } from 'vitest'
import { appMeta } from './appMeta'
import { BrowserShellSessionSchema, toBrowserShellSession } from './browserShellSession'
import { webPublicEnv } from './webEnv'

describe('toBrowserShellSession', () => {
	it('projects publicEnv and appMeta into a typed browser session', () => {
		const session = toBrowserShellSession({ publicEnv: webPublicEnv, appMeta })

		expect(session.publicEnv).toEqual(webPublicEnv)
		expect(session.app).toEqual(appMeta)
		expect(BrowserShellSessionSchema.parse(session)).toEqual(session)
	})

	it('only allowlists browser-safe fields', () => {
		const session = toBrowserShellSession({ publicEnv: webPublicEnv, appMeta })

		expect(Object.keys(session).sort()).toEqual(['app', 'publicEnv'])
		expect(Object.keys(session.app).sort()).toEqual(['name', 'version'])
		expect(session).not.toHaveProperty('serverEnv')
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
