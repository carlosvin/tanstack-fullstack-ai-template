import { afterEach, describe, expect, it, vi } from 'vitest'
import { getShellSession, getWebServerEnv, WebServerEnvSchema } from '@/env/webEnv.server'
import { ShellSessionSchema } from '@/services/schemas/shellSession'
import pkg from '../../package.json' with { type: 'json' }

const LONG_SECRET = 'test-secret-at-least-32-bytes!!!'

describe('webEnv', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
	})

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
		expect(WebServerEnvSchema.parse({ AUTH_ALLOW_UNSIGNED_TOKENS: 'false' }).AUTH_ALLOW_UNSIGNED_TOKENS).toBe(false)
		expect(WebServerEnvSchema.parse({ AUTH_ALLOW_UNSIGNED_TOKENS: '0' }).AUTH_ALLOW_UNSIGNED_TOKENS).toBe(false)
		expect(WebServerEnvSchema.parse({ AUTH_ALLOW_UNSIGNED_TOKENS: 'yes' }).AUTH_ALLOW_UNSIGNED_TOKENS).toBe(false)
		expect(WebServerEnvSchema.parse({ AUTH_JWT_SECRET: `  ${LONG_SECRET}  ` }).AUTH_JWT_SECRET).toBe(LONG_SECRET)
		expect(() => WebServerEnvSchema.parse({ AUTH_JWT_SECRET: 'too-short' })).toThrow()
	})

	it('requires AUTH_JWT_ISSUER when AUTH_JWKS_URL is set without a secret', () => {
		expect(() => WebServerEnvSchema.parse({ AUTH_JWKS_URL: 'https://idp.example/jwks' })).toThrow(/AUTH_JWT_ISSUER/)
		expect(
			WebServerEnvSchema.parse({
				AUTH_JWKS_URL: 'https://idp.example/jwks',
				AUTH_JWT_ISSUER: 'https://idp.example',
			}).AUTH_JWT_ISSUER,
		).toBe('https://idp.example')
	})

	it('rejects AUTH_ALLOW_UNSIGNED_TOKENS when ENV or NODE_ENV is production', () => {
		expect(() => WebServerEnvSchema.parse({ ENV: 'production', AUTH_ALLOW_UNSIGNED_TOKENS: 'true' })).toThrow(
			/AUTH_ALLOW_UNSIGNED_TOKENS/,
		)
		vi.stubEnv('NODE_ENV', 'production')
		expect(() => WebServerEnvSchema.parse({ AUTH_ALLOW_UNSIGNED_TOKENS: 'true' })).toThrow(/AUTH_ALLOW_UNSIGNED_TOKENS/)
		vi.stubEnv('NODE_ENV', 'development')
		expect(
			WebServerEnvSchema.parse({ ENV: 'staging', AUTH_ALLOW_UNSIGNED_TOKENS: 'true' }).AUTH_ALLOW_UNSIGNED_TOKENS,
		).toBe(true)
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
