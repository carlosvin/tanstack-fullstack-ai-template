import { z } from 'zod'

import { OptionalDeploymentEnvSchema, OptionalLogLevelSchema, OptionalTrimmedStringSchema } from './runtimeEnvSchema'

/**
 * Non-secret fields safe for the browser. Expose them to React only from a
 * route loader that calls a GET server function; request middleware can also
 * place the same slice on the server request context. Never read from `window`.
 */
export const WebPublicEnvSchema = z.object({
	ENV: OptionalDeploymentEnvSchema.describe('Deployment name: development, staging, or production.'),
	LOG_LEVEL: OptionalLogLevelSchema.describe('Minimum pino log level.'),
	SENTRY_DSN: OptionalTrimmedStringSchema.describe('Sentry DSN for both server and browser.'),
})

export type WebPublicEnv = z.infer<typeof WebPublicEnvSchema>

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

export const webPublicEnv: WebPublicEnv = WebPublicEnvSchema.parse({
	...webServerEnv,
})
