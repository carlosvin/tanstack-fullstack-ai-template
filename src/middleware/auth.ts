import { createMiddleware } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { webServerEnv } from '../env/webEnv'
import { type AccessTicket, buildAccessTicket } from '../services/auth/accessTicket'
import { getReadRepository } from '../services/repository/getRepository.server'
import type { UserAccessRepo } from '../services/schemas/repository'
import type { UserIdentity, UserProfile } from '../types'
import { extractIdentityFromJwt } from '../utils/jwt.server'
import { createServerLogger } from '../utils/serverLogger'
import { resolveAccessTicket, TEST_AUTH_COOKIE_NAME } from '../utils/testAuth.server'

const log = createServerLogger('auth')

/** Header name to read the JWT from. Configured via AUTH_HEADER_NAME env var. */
const AUTH_HEADER_NAME = webServerEnv.AUTH_HEADER_NAME ?? 'Authorization'

/** Paths that skip repository profile lookup (health, static, public config). */
const PUBLIC_ROUTE_PREFIXES = ['/api/health', '/.well-known', '/assets'] as const

const ANONYMOUS_USER: UserIdentity = {
	email: '',
	name: 'Anonymous',
	groups: [],
}

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
	accessTicket: AccessTicket
}

function toAuthContext(ticket: AccessTicket): AuthContext {
	return {
		user: ticket.identity,
		userProfile: ticket.profile,
		isTestUser: ticket.isTestUser,
		accessTicket: ticket,
	}
}

/**
 * Global request middleware that extracts user identity from the JWT in the
 * configured authorization header, loads repository-backed access + profile,
 * and provides `context.accessTicket` (plus stock `user` / `userProfile`).
 *
 * Runs on every request (SSR, server functions, API routes).
 * - If a valid JWT is present in the auth header, the decoded identity is used.
 * - Otherwise a persistent test user is minted (or restored from the test-auth cookie).
 */
export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const pathname = new URL(request.url).pathname
	const authHeader = request.headers.get(AUTH_HEADER_NAME)

	if (isPublicRoute(pathname)) {
		const headerIdentity = extractIdentityFromJwt(authHeader)
		const user = headerIdentity.email ? headerIdentity : ANONYMOUS_USER
		log.debug({ pathname }, 'public route — skipped profile load')
		const accessTicket = buildAccessTicket({
			user,
			profile: null,
			isTestUser: false,
			access: null,
		})
		return next({ context: toAuthContext(accessTicket) })
	}

	const ticket = resolveAccessTicket(authHeader, getCookie(TEST_AUTH_COOKIE_NAME))

	if (ticket.newTestAuthToken) {
		setCookie(TEST_AUTH_COOKIE_NAME, ticket.newTestAuthToken, {
			...TEST_AUTH_COOKIE_OPTIONS,
			secure: new URL(request.url).protocol === 'https:',
		})
	}

	const { user, isTestUser } = ticket

	let userProfile: UserProfile | null = null
	let access: UserAccessRepo | null = null
	// Test users are ephemeral and never stored in the repository — skip the lookup.
	if (user.email && !isTestUser) {
		const repo = getReadRepository()
		;[access, userProfile] = await Promise.all([repo.getUserAccess(user.email), repo.getUserProfile(user.email)])
	}

	const accessTicket = buildAccessTicket({
		user,
		profile: userProfile,
		isTestUser,
		access,
	})

	return next({ context: toAuthContext(accessTicket) })
})
