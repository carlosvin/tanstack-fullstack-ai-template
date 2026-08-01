import { z } from 'zod'
import { type AppMeta, AppMetaSchema, appMeta } from './appMeta'
import { type WebPublicEnv, WebPublicEnvSchema, webPublicEnv } from './webEnv'

/**
 * Allowlisted, browser-safe projection of server startup config.
 * Client code must receive this via a GET server fn + loader — never import `webEnv`.
 */
export const BrowserShellSessionSchema = z.object({
	publicEnv: WebPublicEnvSchema.describe('Non-secret deployment env safe for the browser.'),
	app: AppMetaSchema.describe('Application name and version from package.json.'),
})

export type BrowserShellSession = z.infer<typeof BrowserShellSessionSchema>

/** Build (and validate) a browser shell session from already-parsed server values. */
export function toBrowserShellSession(input: { publicEnv: WebPublicEnv; appMeta: AppMeta }): BrowserShellSession {
	return BrowserShellSessionSchema.parse({
		publicEnv: input.publicEnv,
		app: input.appMeta,
	})
}

/** Parsed once with the env/app meta singletons — immutable for the process lifetime. */
export const browserShellSession: BrowserShellSession = toBrowserShellSession({
	publicEnv: webPublicEnv,
	appMeta,
})
