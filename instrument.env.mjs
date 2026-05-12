/**
 * Shared env resolver for Sentry bootstrap files.
 *
 * Plain ESM (no TS, no Zod) so it can be imported from Node's `--import`
 * hook at process start, before any TypeScript transpilation. The allowed
 * values mirror `DEPLOYMENT_ENV_VALUES` in `src/env/runtimeEnvSchema.ts`;
 * keep them in sync if that enum ever changes.
 */

// Mirrors DEPLOYMENT_ENV_VALUES in src/env/runtimeEnvSchema.ts
const VALID_ENVS = ['development', 'staging', 'production']

/**
 * Resolves Sentry bootstrap configuration from `process.env`.
 * Called once per process entry point before `initSentry`.
 *
 * @returns {{ dsn: string|undefined, environment: 'development'|'staging'|'production' }}
 */
export function resolveSentryBootstrapEnv() {
	const rawEnv = process.env.ENV?.trim()
	return {
		dsn: process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN,
		environment: VALID_ENVS.includes(rawEnv) ? rawEnv : 'development',
	}
}
