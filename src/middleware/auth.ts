import { createMiddleware } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { webServerEnv } from '../env/webEnv'
import { getReadRepository } from '../services/repository/getRepository.server'
import type { UserIdentity, UserProfile } from '../types'
import { createServerLogger } from '../utils/serverLogger'
import { createTestAuthToken, resolveAccessTicket, TEST_AUTH_COOKIE_NAME } from '../utils/testAuth.server'

const log = createServerLogger('auth')

/** Header name to read the JWT from. Configured via AUTH_HEADER_NAME env var. */
const AUTH_HEADER_NAME = webServerEnv.AUTH_HEADER_NAME ?? 'Authorization'

/** Paths that skip repository profile lookup (health, static, public config). */
const PUBLIC_ROUTE_PREFIXES = ['/api/health', '/.well-known', '/assets'] as const

const TEST_AUTH_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	maxAge: 60 * 60 * 24 * 30,
}

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Typed context provided by the auth middleware to all downstream handlers.
 * Access via `context` in server functions and route handlers.
 */
export interface AuthContext {
	user: UserIdentity
	userProfile: UserProfile | null
	isTestUser: boolean
}

/**
 * Global request middleware that extracts user identity from the JWT in the
 * configured authorization header, loads the user profile from the repository,
 * and provides both in `context.user` and `context.userProfile`.
 *
 * Runs on every request (SSR, server functions, API routes).
 * - If a valid JWT is present in the auth header, the decoded identity is used.
 * - Otherwise a persistent test user is minted (or restored from the test-auth cookie).
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const pathname = new URL(request.url).pathname
	const authHeader = request.headers.get(AUTH_HEADER_NAME)
	const ticket = resolveAccessTicket(authHeader, getCookie(TEST_AUTH_COOKIE_NAME))

	if (ticket.shouldSetTestAuthCookie) {
		setCookie(TEST_AUTH_COOKIE_NAME, createTestAuthToken(ticket.user), TEST_AUTH_COOKIE_OPTIONS)
	}

	const { user, isTestUser } = ticket

	let userProfile: UserProfile | null = null
	if (user.email && !isPublicRoute(pathname)) {
		const repo = getReadRepository()
		userProfile = await repo.getUserProfile(user.email)
	}

	if (isPublicRoute(pathname)) {
		log.debug({ pathname }, 'public route — skipped profile load')
	}

	return next({ context: { user, userProfile, isTestUser } })
})
