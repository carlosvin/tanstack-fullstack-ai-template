import { z } from 'zod'
import pkg from '../../package.json' with { type: 'json' }

/**
 * Application identity from `package.json`, validated once at module load
 * (server startup). Safe to project into the browser shell session.
 */
export const AppMetaSchema = z.object({
	name: z.string().min(1).describe('Application name from package.json'),
	version: z.string().min(1).describe('Application version from package.json'),
})

export type AppMeta = z.infer<typeof AppMetaSchema>

/** Parsed once when this module is first imported — do not re-read package.json elsewhere. */
export const appMeta: AppMeta = AppMetaSchema.parse({
	name: pkg.name,
	version: pkg.version,
})
