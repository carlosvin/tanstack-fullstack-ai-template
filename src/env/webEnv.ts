import { config } from 'dotenv'
import { z } from 'zod'
import pkg from '../../package.json' with { type: 'json' }

import { OptionalDeploymentEnvSchema, OptionalLogLevelSchema, OptionalTrimmedStringSchema } from './runtimeEnvSchema'

/** Load local `.env` files before the one-time Zod parse (Vite also loads them during dev/build). */
function loadLocalEnvFiles(): void {
	config({ path: '.env', quiet: true })
	config({ path: '.env.local', quiet: true, override: true })
}

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
 * Parsed lazily on first access so Netlify runtime injection (AI Gateway, etc.)
 * is visible before the Zod parse runs.
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
	GEMINI_API_KEY: OptionalTrimmedStringSchema.describe('Google Gemini API key (or Netlify AI Gateway placeholder).'),
	GOOGLE_API_KEY: OptionalTrimmedStringSchema.describe('Alternative Google API key for Gemini.'),
	GEMINI_MODEL: z.string().optional().describe('Gemini model name. Default: gemini-2.5-flash.'),
	OPENAI_API_KEY: OptionalTrimmedStringSchema.describe('OpenAI API key (or Netlify AI Gateway placeholder).'),
	OPENAI_BASE_URL: OptionalTrimmedStringSchema.describe('OpenAI base URL (Netlify AI Gateway when set).'),
	OPENAI_MODEL: z.string().optional().describe('OpenAI model name. Default: gpt-4o.'),
	NETLIFY_AI_GATEWAY_KEY: OptionalTrimmedStringSchema.describe('Netlify AI Gateway key (auto-injected on Netlify).'),
	NETLIFY_AI_GATEWAY_BASE_URL: OptionalTrimmedStringSchema.describe(
		'Netlify AI Gateway base URL (auto-injected on Netlify).',
	),
})

export type WebServerEnv = z.infer<typeof WebServerEnvSchema>

let cachedWebServerEnv: WebServerEnv | undefined

/** Validated server env — parsed once per process on first access. */
export function getWebServerEnv(): WebServerEnv {
	if (!cachedWebServerEnv) {
		loadLocalEnvFiles()
		cachedWebServerEnv = WebServerEnvSchema.parse(process.env)
	}
	return cachedWebServerEnv
}

let cachedShellSession: ShellSession | undefined

/** Browser-safe shell session derived from validated server env + package.json. */
export function getShellSession(): ShellSession {
	if (!cachedShellSession) {
		const env = getWebServerEnv()
		cachedShellSession = ShellSessionSchema.parse({
			ENV: env.ENV,
			LOG_LEVEL: env.LOG_LEVEL,
			SENTRY_DSN: env.SENTRY_DSN,
			app: { name: pkg.name, version: pkg.version },
		})
	}
	return cachedShellSession
}

/** Lazy validated server env for existing imports. */
export const webServerEnv: WebServerEnv = new Proxy({} as WebServerEnv, {
	get(_target, prop) {
		return getWebServerEnv()[prop as keyof WebServerEnv]
	},
})

/** Lazy shell session for existing imports. */
export const shellSession: ShellSession = new Proxy({} as ShellSession, {
	get(_target, prop) {
		return getShellSession()[prop as keyof ShellSession]
	},
})
