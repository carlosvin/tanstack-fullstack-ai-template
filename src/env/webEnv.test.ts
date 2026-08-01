import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { ShellSessionSchema, shellSession, webServerEnv } from './webEnv'

describe('webEnv', () => {
	it('builds shellSession from webServerEnv and package.json once', () => {
		expect(shellSession.app).toEqual({ name: pkg.name, version: pkg.version })
		expect(shellSession.ENV).toBe(webServerEnv.ENV)
		expect(shellSession.LOG_LEVEL).toBe(webServerEnv.LOG_LEVEL)
		expect(shellSession.SENTRY_DSN).toBe(webServerEnv.SENTRY_DSN)
		expect(ShellSessionSchema.parse(shellSession)).toEqual(shellSession)
	})

	it('only allowlists browser-safe fields', () => {
		expect(Object.keys(shellSession).sort()).toEqual(['ENV', 'LOG_LEVEL', 'SENTRY_DSN', 'app'])
		expect(shellSession).not.toHaveProperty('serverEnv')
		expect(shellSession).not.toHaveProperty('MONGODB_URI')
	})
})
