import type { UserIdentity } from '../types'
import { createUnsignedJwt, extractIdentityFromJwt } from './jwt.server'

/** Cookie storing the unsigned JWT for auto-generated demo users. */
export const TEST_AUTH_COOKIE_NAME = 'test-auth'

/** Creates a random demo identity for visitors without an auth header. */
export function createRandomTestIdentity(): UserIdentity {
	const suffix = Math.floor(1000 + Math.random() * 9000)
	return {
		email: `random${suffix}@example.com`,
		name: `Test User ${suffix}`,
		groups: [],
	}
}

/** Serializes identity as an unsigned JWT suitable for the test-auth cookie. */
export function createTestAuthToken(identity: UserIdentity): string {
	return createUnsignedJwt(identity)
}

export interface ResolvedAccessTicket {
	user: UserIdentity
	isTestUser: boolean
	/** When true, middleware should persist the new test user in the test-auth cookie. */
	shouldSetTestAuthCookie: boolean
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
		return { user: headerIdentity, isTestUser: false, shouldSetTestAuthCookie: false }
	}

	const cookieIdentity = extractIdentityFromJwt(cookieToken ?? null)
	if (cookieIdentity.email) {
		return { user: cookieIdentity, isTestUser: true, shouldSetTestAuthCookie: false }
	}

	return {
		user: createRandomTestIdentity(),
		isTestUser: true,
		shouldSetTestAuthCookie: true,
	}
}
