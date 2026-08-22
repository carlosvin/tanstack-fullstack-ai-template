/**
 * Browser-safe env schemas — the public projection of the deployment environment.
 *
 * Client-safe by contract: no secret fields, no Node env access, no `dotenv`,
 * so these schemas may ship in the browser bundle. Server-only env fields and
 * the lazy env parse live in `src/env/webEnv.server.ts`.
 */
import { z } from 'zod'
import { OptionalDeploymentEnvSchema, OptionalLogLevelSchema, OptionalTrimmedStringSchema } from './runtimeEnv'

export const AppMetaSchema = z.object({
	name: z.string().min(1).describe('Human-readable application name from DISPLAY_NAME env (default: TaskHub).'),
	version: z.string().min(1).describe('Application version from package.json'),
})

export type AppMeta = z.infer<typeof AppMetaSchema>

/** Non-secret deployment fields safe for the browser. */
export const WebPublicEnvSchema = z.object({
	ENV: OptionalDeploymentEnvSchema.describe('Deployment name: development, staging, or production.'),
	LOG_LEVEL: OptionalLogLevelSchema.describe('Minimum pino log level.'),
	SENTRY_DSN: OptionalTrimmedStringSchema.describe('Sentry DSN for both server and browser.'),
})

export type WebPublicEnv = z.infer<typeof WebPublicEnvSchema>

/** Browser-safe startup config: public env fields + app identity. */
export const ShellSessionSchema = WebPublicEnvSchema.extend({
	app: AppMetaSchema.describe('Application name and version from package.json.'),
})

export type ShellSession = z.infer<typeof ShellSessionSchema>
