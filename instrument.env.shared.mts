import { z } from 'zod'

export const DEPLOYMENT_ENV_VALUES = ['development', 'staging', 'production'] as const
export const DeploymentEnvSchema = z.enum(DEPLOYMENT_ENV_VALUES)
export type DeploymentEnv = z.infer<typeof DeploymentEnvSchema>
