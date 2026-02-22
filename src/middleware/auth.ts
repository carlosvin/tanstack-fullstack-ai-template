import { createMiddleware } from '@tanstack/react-start'
import { getReadRepository } from '../services/repository/getRepository'
import type { UserIdentity, UserProfile } from '../types'
import { extractIdentityFromJwt } from '../utils/jwt'

/** Header name to read the JWT from. Configurable via AUTH_HEADER_NAME env var. */
const AUTH_HEADER_NAME = process.env.AUTH_HEADER_NAME ?? 'Authorization'

const ANONYMOUS_USER: UserIdentity = {
	email: '',
	name: 'Anonymous',
	groups: [],
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
	const authHeader = request.headers.get(AUTH_HEADER_NAME)
	const identity = extractIdentityFromJwt(authHeader)

	const user: UserIdentity = identity.email ? identity : ANONYMOUS_USER

	let userProfile: UserProfile | null = null
	if (user.email) {
		const repo = getReadRepository()
		userProfile = await repo.getUserProfile(user.email)
	}

	return next({ context: { user, userProfile } })
})
