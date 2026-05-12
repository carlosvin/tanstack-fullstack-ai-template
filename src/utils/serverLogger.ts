/**
 * Bound logger factory for server-side modules.
 *
 * Wraps `createModuleLogger` with `ENV` and `LOG_LEVEL` already resolved from
 * `webServerEnv` so individual modules don't need to import or repeat those
 * values. Use `createModuleLogger` directly for tests or code that runs
 * outside the web-server runtime.
 */
import { webServerEnv } from '../env/webEnv'
import { createModuleLogger } from './logger'

export const createServerLogger = (name: string) =>
	createModuleLogger(name, { environment: webServerEnv.ENV, logLevel: webServerEnv.LOG_LEVEL })
