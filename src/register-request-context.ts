import type { AppMeta } from './env/appMeta'
import type { WebPublicEnv, WebServerEnv } from './env/webEnv'
import type { AuthContext } from './middleware/auth'

/**
 * Full server request context assembled by global middleware
 * (`webEnvMiddleware` → auth + env + app meta).
 *
 * Handlers read these fields directly — no runtime context guards or casts.
 * Never return `serverEnv` to the browser; project via `toBrowserShellSession`.
 */
export interface RequestContext extends AuthContext {
	serverEnv: WebServerEnv
	publicEnv: WebPublicEnv
	appMeta: AppMeta
}

declare module '@tanstack/react-start' {
	interface Register {
		server: {
			requestContext: RequestContext
		}
	}
}
