/**
 * Shared deployment/log-level enums and env preprocessors.
 *
 * Client-safe: no secrets and no Node env access — safe to import from
 * browser-shipped modules. Server-only env parsing lives in
 * `src/env/webEnv.server.ts`.
 */
import { z } from 'zod'
import { DEPLOYMENT_ENV_VALUES, type DeploymentEnv, DeploymentEnvSchema } from '../../../instrument.env.shared.mjs'

/** Empty / whitespace-only strings → undefined (Node env vars are always strings). */
export function envStringToUndefined(val: unknown): unknown {
	if (val === undefined || val === null) return undefined
	const s = String(val).trim()
	return s === '' ? undefined : s
}

export type { DeploymentEnv }
export { DEPLOYMENT_ENV_VALUES, DeploymentEnvSchema }

export const LOG_LEVEL_VALUES = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const
export const LogLevelSchema = z.enum(LOG_LEVEL_VALUES)
export type LogLevel = z.infer<typeof LogLevelSchema>

export const OptionalDeploymentEnvSchema = z.preprocess(envStringToUndefined, DeploymentEnvSchema.optional())

export const OptionalLogLevelSchema = z.preprocess(envStringToUndefined, LogLevelSchema.optional())

export const OptionalTrimmedStringSchema = z.preprocess(envStringToUndefined, z.string().optional())
