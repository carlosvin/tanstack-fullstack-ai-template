import type { UserIdentity } from '../types'
import { createUnsignedJwt, extractIdentityFromJwt } from './jwt.server'

/** Cookie storing the unsigned JWT for auto-generated demo users. */
export const TEST_AUTH_COOKIE_NAME = 'test-auth'

const TEST_USER_EMAIL_PATTERN = /^random[a-f0-9]{8}@example\.com$/i

/** Creates a random demo identity for visitors without an auth header. */
export function createRandomTestIdentity(): UserIdentity {
	const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
	return {
		email: `random${suffix}@example.com`,
		name: `Test User ${suffix.slice(0, 4)}`,
		groups: [],
	}
}

function parseTestUserFromCookie(cookieToken: string | null | undefined): UserIdentity | null {
	const identity = extractIdentityFromJwt(cookieToken ?? null)
	if (!TEST_USER_EMAIL_PATTERN.test(identity.email)) {
		return null
	}

	const suffix = identity.email.slice('random'.length, 'random'.length + 8)
	return {
		email: identity.email.toLowerCase(),
		name: identity.name || `Test User ${suffix.slice(0, 4)}`,
		groups: [],
	}
}

export interface ResolvedAccessTicket {
	user: UserIdentity
	isTestUser: boolean
	/** Present when middleware should persist a newly minted test user. */
	newTestAuthToken?: string
}

/**
 * Resolves the request access ticket from the auth header and optional test-auth cookie.
 * Header identity always wins; otherwise reuse or mint a demo test user.
 */
export function resolveAccessTicket(
	authHeader: string | null,
	cookieToken: string | null | undefined,
): ResolvedAccessTicket {
	const headerIdentity = extractIdentityFromJwt(authHeader)
	if (headerIdentity.email) {
		return { user: headerIdentity, isTestUser: false }
	}

	const cookieUser = parseTestUserFromCookie(cookieToken)
	if (cookieUser) {
		return { user: cookieUser, isTestUser: true }
	}

	const user = createRandomTestIdentity()
	return {
		user,
		isTestUser: true,
		newTestAuthToken: createUnsignedJwt(user),
	}
}
