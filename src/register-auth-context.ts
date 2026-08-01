import type { AuthContext } from './middleware/auth'

declare module '@tanstack/react-start' {
	interface Register {
		server: {
			requestContext: AuthContext
		}
	}
}
