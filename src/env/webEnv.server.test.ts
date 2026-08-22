import { describe, expect, it } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }
import { ShellSessionSchema } from '../services/schemas/shellSession'
import { getShellSession, getWebServerEnv, WebServerEnvSchema } from './webEnv.server'

describe('webEnv', () => {
	it('builds shellSession from webServerEnv and package.json once', () => {
		const env = getWebServerEnv()
		const session = getShellSession()
		expect(session.app).toEqual({ name: 'TaskHub', version: pkg.version })
		expect(session.ENV).toBe(env.ENV)
		expect(session.LOG_LEVEL).toBe(env.LOG_LEVEL)
		expect(session.SENTRY_DSN).toBe(env.SENTRY_DSN)
		expect(ShellSessionSchema.parse(session)).toEqual(session)
	})

	it('defaults DISPLAY_NAME to TaskHub when unset', () => {
		const parsed = WebServerEnvSchema.parse({})
		expect(parsed.DISPLAY_NAME).toBe('TaskHub')
	})

	it('reads DISPLAY_NAME from environment', () => {
		const parsed = WebServerEnvSchema.parse({ DISPLAY_NAME: 'My App' })
		expect(parsed.DISPLAY_NAME).toBe('My App')
	})

	it('only allowlists browser-safe fields', () => {
		const session = getShellSession()
		expect(Object.keys(session).sort()).toEqual(['ENV', 'LOG_LEVEL', 'SENTRY_DSN', 'app'])
		expect(session).not.toHaveProperty('serverEnv')
		expect(session).not.toHaveProperty('MONGODB_URI')
	})
})
