/**
 * Server-only validated env: secret field schemas, `dotenv` loading, and the
 * lazy `process.env` parse.
 *
 * Never import this module (or anything under `src/env/`) from client-shared
 * modules — the `importProtection` client tripwire in `vite.config.ts`
 * (`**\ /env/**`) fails the build if an env module enters the client graph.
 * Browser-safe schemas live in `src/services/schemas/shellSession.ts` and
 * `src/services/schemas/runtimeEnv.ts`.
 */
import { config } from 'dotenv'
import { z } from 'zod'
import pkg from '../../package.json' with { type: 'json' }
import { envStringToUndefined, OptionalTrimmedStringSchema } from '../services/schemas/runtimeEnv'
import { type ShellSession, ShellSessionSchema, WebPublicEnvSchema } from '../services/schemas/shellSession'

/** Load local `.env` files before the one-time Zod parse (Vite also loads them during dev/build). */
function loadLocalEnvFiles(): void {
	config({ path: '.env', quiet: true })
	config({ path: '.env.local', quiet: true, override: true })
}

/**
 * Full validated `process.env` for the TanStack web server and SSR runtime.
 * Parsed lazily on first access so Netlify runtime injection (AI Gateway, etc.)
 * is visible before the Zod parse runs.
 */
export const WebServerEnvSchema = WebPublicEnvSchema.extend({
	DISPLAY_NAME: z
		.preprocess(envStringToUndefined, z.string().min(1).default('TaskHub'))
		.describe('Human-readable application name shown in the header and page title.'),
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
			app: { name: env.DISPLAY_NAME, version: pkg.version },
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
