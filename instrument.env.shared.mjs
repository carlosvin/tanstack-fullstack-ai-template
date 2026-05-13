import { z } from 'zod'

export const DEPLOYMENT_ENV_VALUES = ['development', 'staging', 'production']
export const DeploymentEnvSchema = z.enum(DEPLOYMENT_ENV_VALUES)
