/**
 * Shared module-scoped pino logger factory.
 *
 * Use this for files that need a long-lived logger bound to the module's
 * identity (e.g. repository factories, API clients, server functions).
 *
 * Level resolution:
 *   1. `options.logLevel` when provided (already validated by the caller's env schema)
 *   2. `info` otherwise
 *
 * Deployment context: bind `environment` on every log line by passing it in options.
 */

import pino, { type Logger } from 'pino'

import type { DeploymentEnv, LogLevel } from '../env/runtimeEnvSchema'

export type ModuleLoggerOptions = {
	/** Deployment label validated by the caller's env schema. */
	environment: DeploymentEnv
	/** Log level validated by the caller's env schema. */
	logLevel?: LogLevel
}

/**
 * Lazily-initialised root logger. All module loggers are `child()` instances
 * of this single root, so the pino-pretty transport (which spawns a worker
 * thread) is created at most once per process — not once per importer.
 */
let rootLogger: Logger | null = null

function getRootLogger(environment: DeploymentEnv): Logger {
	if (rootLogger) return rootLogger

	// `createModuleLogger` is also imported by client React components, so this
	// must stay safe in a browser bundle where `process.stdout` is undefined.
	// Pretty transport is only enabled in an interactive Node TTY outside of
	// production.
	const isNodeTty = typeof process !== 'undefined' && process.stdout != null && Boolean(process.stdout.isTTY)
	const useTtyPretty = isNodeTty && environment !== 'production'

	// Root is created at the most permissive level ('trace') so per-child level
	// overrides are never filtered out at the root.
	rootLogger = useTtyPretty
		? pino(
				{ level: 'trace' },
				pino.transport({
					target: 'pino-pretty',
					options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss.l' },
				}),
			)
		: pino({ level: 'trace' })

	return rootLogger
}

/** Create a pino logger tagged with the given module name and deployment `environment` binding. */
export function createModuleLogger(name: string, options: ModuleLoggerOptions): Logger {
	const { environment } = options
	return getRootLogger(environment).child({ name, environment }, { level: options.logLevel ?? 'info' })
}
