import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { getShellSession, getWebServerEnv, ShellSessionSchema } from './webEnv'

describe('webEnv', () => {
	it('builds shellSession from webServerEnv and package.json once', () => {
		const env = getWebServerEnv()
		const session = getShellSession()
		expect(session.app).toEqual({ name: pkg.name, version: pkg.version })
		expect(session.ENV).toBe(env.ENV)
		expect(session.LOG_LEVEL).toBe(env.LOG_LEVEL)
		expect(session.SENTRY_DSN).toBe(env.SENTRY_DSN)
		expect(ShellSessionSchema.parse(session)).toEqual(session)
	})

	it('only allowlists browser-safe fields', () => {
		const session = getShellSession()
		expect(Object.keys(session).sort()).toEqual(['ENV', 'LOG_LEVEL', 'SENTRY_DSN', 'app'])
		expect(session).not.toHaveProperty('serverEnv')
		expect(session).not.toHaveProperty('MONGODB_URI')
	})
})
