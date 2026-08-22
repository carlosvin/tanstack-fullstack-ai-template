import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveSentryBootstrapEnv } from './instrument.env.mjs'
import { DeploymentEnvSchema as SharedDeploymentEnvSchema } from './instrument.env.shared.mjs'
import { DeploymentEnvSchema as RuntimeDeploymentEnvSchema } from './src/services/schemas/runtimeEnv'

const ORIGINAL_ENV = { ...process.env }
const TESTED_KEYS = ['ENV', 'NODE_ENV', 'SENTRY_DSN'] as const

beforeEach(() => {
	for (const key of TESTED_KEYS) {
		delete process.env[key]
	}
})

afterEach(() => {
	for (const key of TESTED_KEYS) {
		const originalValue = ORIGINAL_ENV[key]
		if (originalValue === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = originalValue
		}
	}
})

describe('resolveSentryBootstrapEnv', () => {
	it('uses NODE_ENV for the bootstrap environment', () => {
		process.env.NODE_ENV = 'production'

		expect(resolveSentryBootstrapEnv()).toMatchObject({
			environment: 'production',
		})
	})

	it('ignores ENV in favor of NODE_ENV for bootstrap environment', () => {
		process.env.ENV = 'staging'
		process.env.NODE_ENV = 'production'

		expect(resolveSentryBootstrapEnv()).toMatchObject({
			environment: 'production',
		})
	})

	it('uses SENTRY_DSN for the bootstrap dsn', () => {
		process.env.SENTRY_DSN = 'server-dsn'

		expect(resolveSentryBootstrapEnv()).toMatchObject({
			dsn: 'server-dsn',
		})
	})

	it('fails fast when NODE_ENV contains an unsupported deployment value', () => {
		process.env.NODE_ENV = 'test'

		expect(() => resolveSentryBootstrapEnv()).toThrow()
	})

	it('re-exports the shared deployment env schema for TypeScript callers', () => {
		expect(RuntimeDeploymentEnvSchema).toBe(SharedDeploymentEnvSchema)
	})
})
