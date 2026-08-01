import { z } from 'zod'
import pkg from '../../package.json' with { type: 'json' }

import { OptionalDeploymentEnvSchema, OptionalLogLevelSchema, OptionalTrimmedStringSchema } from './runtimeEnvSchema'

export const AppMetaSchema = z.object({
	name: z.string().min(1).describe('Application name from package.json'),
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

/**
 * Full validated `process.env` for the TanStack web server and SSR runtime.
 * Parsed once when this module is first imported.
 */
export const WebServerEnvSchema = WebPublicEnvSchema.extend({
	AUTH_HEADER_NAME: OptionalTrimmedStringSchema.describe(
		'HTTP header name for the JWT. Default: Authorization when unset or blank.',
	),
	MONGODB_URI: OptionalTrimmedStringSchema.describe('MongoDB connection string. Absent → in-memory seed repository.'),
	MONGODB_DB_NAME: z.string().optional().describe('MongoDB database name. Default: app-db.'),
	REPOSITORY_TYPE: z
		.enum(['seed', 'mongo'])
		.optional()
		.describe('Force repository implementation. Auto-detected from MONGODB_URI when omitted.'),
	AZURE_OPENAI_API_KEY: OptionalTrimmedStringSchema.describe('Azure OpenAI API key.'),
	AZURE_OPENAI_ENDPOINT: OptionalTrimmedStringSchema.describe('Azure OpenAI base URL.'),
	AZURE_OPENAI_DEPLOYMENT: z.string().optional().describe('Azure OpenAI deployment name. Default: gpt-4o.'),
	GEMINI_API_KEY: OptionalTrimmedStringSchema.describe('Google Gemini API key.'),
	GOOGLE_API_KEY: OptionalTrimmedStringSchema.describe('Alternative Google API key for Gemini.'),
	GEMINI_MODEL: z.string().optional().describe('Gemini model name. Default: gemini-2.5-flash.'),
})

export type WebServerEnv = z.infer<typeof WebServerEnvSchema>

export const webServerEnv: WebServerEnv = WebServerEnvSchema.parse(process.env)

/** Parsed once at startup — project to the client via `getBrowserShellSession` + root loader. */
export const shellSession: ShellSession = ShellSessionSchema.parse({
	ENV: webServerEnv.ENV,
	LOG_LEVEL: webServerEnv.LOG_LEVEL,
	SENTRY_DSN: webServerEnv.SENTRY_DSN,
	app: { name: pkg.name, version: pkg.version },
})
