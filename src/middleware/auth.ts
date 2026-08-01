import { createMiddleware } from '@tanstack/react-start'
import { webServerEnv } from '../env/webEnv'
import { getReadRepository } from '../services/repository/getRepository.server'
import type { UserIdentity, UserProfile } from '../types'
import { extractIdentityFromJwt } from '../utils/jwt.server'
import { createServerLogger } from '../utils/serverLogger'

const log = createServerLogger('auth')

/** Header name to read the JWT from. Configured via AUTH_HEADER_NAME env var. */
const AUTH_HEADER_NAME = webServerEnv.AUTH_HEADER_NAME ?? 'Authorization'

/** Paths that skip repository profile lookup (health, static, public config). */
const PUBLIC_ROUTE_PREFIXES = ['/api/health', '/.well-known', '/assets'] as const

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

const ANONYMOUS_USER: UserIdentity = {
	email: '',
	name: 'Anonymous',
	groups: [],
}

/**
 * Typed context provided by the auth middleware to all downstream handlers.
 * Access via `context` in server functions and route handlers.
 */
export interface AuthContext {
	user: UserIdentity
	userProfile: UserProfile | null
}

/**
 * Global request middleware that extracts user identity from the JWT in the
 * configured authorization header, loads the user profile from the repository,
 * and provides both in `context.user` and `context.userProfile`.
 *
 * Runs on every request (SSR, server functions, API routes).
 * - If a valid JWT is present, the decoded identity is used and the profile is loaded.
 * - If no valid JWT is present, an anonymous user is returned with no profile.
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const pathname = new URL(request.url).pathname
	const authHeader = request.headers.get(AUTH_HEADER_NAME)
	const identity = extractIdentityFromJwt(authHeader)

	const user: UserIdentity = identity.email ? identity : ANONYMOUS_USER

	let userProfile: UserProfile | null = null
	if (user.email && !isPublicRoute(pathname)) {
		const repo = getReadRepository()
		userProfile = await repo.getUserProfile(user.email)
	}

	if (isPublicRoute(pathname)) {
		log.debug({ pathname }, 'public route — skipped profile load')
	}

	return next({ context: { user, userProfile } })
})
