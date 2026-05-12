import { z } from 'zod'

/** Empty / whitespace-only strings → undefined (Node `process.env` values are strings). */
export function envStringToUndefined(val: unknown): unknown {
	if (val === undefined || val === null) return undefined
	const s = String(val).trim()
	return s === '' ? undefined : s
}

export const DEPLOYMENT_ENV_VALUES = ['development', 'staging', 'production'] as const
export const DeploymentEnvSchema = z.enum(DEPLOYMENT_ENV_VALUES)
export type DeploymentEnv = z.infer<typeof DeploymentEnvSchema>

export const LOG_LEVEL_VALUES = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const
export const LogLevelSchema = z.enum(LOG_LEVEL_VALUES)
export type LogLevel = z.infer<typeof LogLevelSchema>

export const OptionalDeploymentEnvSchema = z.preprocess(envStringToUndefined, DeploymentEnvSchema.optional())

export const OptionalLogLevelSchema = z.preprocess(envStringToUndefined, LogLevelSchema.optional())

export const OptionalTrimmedStringSchema = z.preprocess(envStringToUndefined, z.string().optional())
