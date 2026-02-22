import { decodeJwt } from 'jose'
import type { UserIdentity } from '../types'

/**
 * Extracts identity claims from a JWT token in an authorization header.
 * Uses the `jose` library which works in any JS runtime (Node, Edge, browser).
 *
 * Handles both raw tokens and "Bearer <token>" format.
 * Returns an empty identity if the header is absent or the token is invalid.
 */
export function extractIdentityFromJwt(authorizationHeader: string | null): UserIdentity {
	if (!authorizationHeader) {
		return { email: '', name: '', groups: [] }
	}

	const token = authorizationHeader.replace(/^Bearer\s+/i, '')
	if (!token) {
		return { email: '', name: '', groups: [] }
	}

	try {
		const payload = decodeJwt(token)

		return {
			email: typeof payload.email === 'string' ? payload.email : '',
			name: typeof payload.name === 'string' ? payload.name : '',
			groups: Array.isArray(payload.groups) ? (payload.groups as string[]) : [],
		}
	} catch {
		return { email: '', name: '', groups: [] }
	}
}
