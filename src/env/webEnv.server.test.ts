import { describe, expect, it } from 'vitest'
import { getShellSession, getWebServerEnv, WebServerEnvSchema } from '@/env/webEnv.server'
import { ShellSessionSchema } from '@/services/schemas/shellSession'
import pkg from '../../package.json' with { type: 'json' }

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

	it('keeps header verification off unless a verifier or the dev flag is set', () => {
		expect(WebServerEnvSchema.parse({}).AUTH_ALLOW_UNSIGNED_TOKENS).toBe(false)
		expect(WebServerEnvSchema.parse({ AUTH_ALLOW_UNSIGNED_TOKENS: 'true' }).AUTH_ALLOW_UNSIGNED_TOKENS).toBe(true)
		expect(WebServerEnvSchema.parse({ AUTH_JWT_SECRET: '  secret  ' }).AUTH_JWT_SECRET).toBe('secret')
		expect(WebServerEnvSchema.parse({ AUTH_JWKS_URL: 'https://idp.example/jwks' }).AUTH_JWKS_URL).toBe(
			'https://idp.example/jwks',
		)
	})

	it('defaults PROMPT_CONCEPT to side and accepts prompt-first and agentic', () => {
		expect(WebServerEnvSchema.parse({}).PROMPT_CONCEPT).toBe('side')
		expect(WebServerEnvSchema.parse({ PROMPT_CONCEPT: 'prompt-first' }).PROMPT_CONCEPT).toBe('prompt-first')
		expect(WebServerEnvSchema.parse({ PROMPT_CONCEPT: 'agentic' }).PROMPT_CONCEPT).toBe('agentic')
	})

	it('only allowlists browser-safe fields', () => {
		const session = getShellSession()
		expect(Object.keys(session).sort()).toEqual(['ENV', 'LOG_LEVEL', 'SENTRY_DSN', 'app', 'promptConcept'])
		expect(session).not.toHaveProperty('serverEnv')
		expect(session).not.toHaveProperty('MONGODB_URI')
	})
})
