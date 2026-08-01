import { z } from 'zod'
import { type AppMeta, AppMetaSchema } from './appMeta'
import { type WebPublicEnv, WebPublicEnvSchema } from './webEnv'

/**
 * Allowlisted, browser-safe projection of server startup config.
 * Anything the client may hydrate must pass through this schema — never hand-pick
 * fields from `serverEnv` in UI code.
 */
export const BrowserShellSessionSchema = z.object({
	publicEnv: WebPublicEnvSchema.describe('Non-secret deployment env safe for the browser.'),
	app: AppMetaSchema.describe('Application name and version from package.json.'),
})

export type BrowserShellSession = z.infer<typeof BrowserShellSessionSchema>

/** Project trusted server context into the browser shell session (parse at the boundary). */
export function toBrowserShellSession(input: { publicEnv: WebPublicEnv; appMeta: AppMeta }): BrowserShellSession {
	return BrowserShellSessionSchema.parse({
		publicEnv: input.publicEnv,
		app: input.appMeta,
	})
}
