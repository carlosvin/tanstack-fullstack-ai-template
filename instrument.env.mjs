import { z } from 'zod'
import { DeploymentEnvSchema } from './instrument.env.shared.mjs'

/**
 * Shared env resolver for Sentry bootstrap files.
 *
 * Plain ESM (no TS) so it can be imported from Node's `--import` hook at
 * process start, before any TypeScript transpilation. Bootstrap-only env is
 * still schema-validated here with Zod so raw `process.env` reads stay confined
 * to one parse step. NODE_ENV is validated with the shared plain-ESM deployment
 * schema so bootstrap and TypeScript callers use the same allowed values.
 */

const BootstrapEnvSchema = z.object({
	NODE_ENV: DeploymentEnvSchema.optional(),
	SENTRY_DSN: z.string().optional(),
})

/**
 * Resolves Sentry bootstrap configuration from `process.env`.
 * Called once per process entry point before `initSentry`.
 *
 * @returns {{ dsn: string|undefined, environment: 'development'|'staging'|'production' }}
 */
export function resolveSentryBootstrapEnv() {
	const env = BootstrapEnvSchema.parse(process.env)

	return {
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV ?? 'development',
	}
}
