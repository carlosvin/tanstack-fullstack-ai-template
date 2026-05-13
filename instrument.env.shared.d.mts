import type { z } from 'zod'

export declare const DEPLOYMENT_ENV_VALUES: readonly ['development', 'staging', 'production']
export type DeploymentEnv = (typeof DEPLOYMENT_ENV_VALUES)[number]
export declare const DeploymentEnvSchema: z.ZodType<DeploymentEnv>
