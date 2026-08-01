import { z } from 'zod'

import { type DeploymentEnv, DeploymentEnvSchema } from './instrument.env.shared.mts'

/**
 * Shared env resolver for Sentry bootstrap files.
 *
 * Loaded before the app (see `instrument.server.mts`). Validated with Zod so
 * `process.env` is read in one parse step. `NODE_ENV` uses the shared
 * deployment schema from `instrument.env.shared.mts`.
 */

const BootstrapEnvSchema = z.object({
	NODE_ENV: DeploymentEnvSchema.optional(),
	SENTRY_DSN: z.string().optional(),
})

type SentryBootstrapEnv = z.infer<typeof BootstrapEnvSchema>

export interface ResolveSentryBootstrapEnvResult {
	dsn: string | undefined
	environment: DeploymentEnv
}

/**
 * Resolves Sentry bootstrap configuration from `process.env`.
 * Called once per process entry point before `initSentry`.
 */
export function resolveSentryBootstrapEnv(): ResolveSentryBootstrapEnvResult {
	const env: SentryBootstrapEnv = BootstrapEnvSchema.parse(process.env)

	return {
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV ?? 'development',
	}
}
