import { decodeJwt } from 'jose'
import { JwtIdentityClaimsSchema, type UserIdentity, UserIdentitySchema } from '@/services/schemas/schemas'

const JWT_HEADER = { alg: 'none', typ: 'JWT' } as const

const EMPTY_IDENTITY = UserIdentitySchema.parse({ email: '', name: '', groups: [] })

function encodeJwtPart(value: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(value))
	let binary = ''
	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Creates an unsigned JWT (alg: none) that {@link decodeJwt} can parse.
 * Server-only helper for the demo cookie and local tests. Never use the result as proof of identity.
 */
export function createUnsignedJwt(identity: UserIdentity): string {
	const payload = { email: identity.email, name: identity.name, groups: identity.groups }
	return `${encodeJwtPart(JWT_HEADER)}.${encodeJwtPart(payload)}.`
}

/** Returns the raw token from a header value, stripping an optional Bearer prefix. */
export function extractBearerToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null
	const token = authorizationHeader.replace(/^Bearer\s+/i, '').trim()
	return token.length > 0 ? token : null
}

/**
 * Decodes identity claims from a JWT without checking the signature.
 * This is not authorization. Callers that trust the result must already be on the
 * unsigned-dev path, or must be reading the server-minted demo cookie.
 *
 * Handles both raw tokens and "Bearer <token>" format.
 * Returns an empty identity if the header is absent or the token is invalid.
 */
export function extractIdentityFromJwt(authorizationHeader: string | null): UserIdentity {
	if (!authorizationHeader) {
		return EMPTY_IDENTITY
	}

	const token = authorizationHeader.replace(/^Bearer\s+/i, '')
	if (!token) {
		return EMPTY_IDENTITY
	}

	try {
		const claims = JwtIdentityClaimsSchema.parse(decodeJwt(token))
		return UserIdentitySchema.parse({
			email: claims.email ?? '',
			name: claims.name ?? '',
			groups: claims.groups ?? [],
		})
	} catch {
		return EMPTY_IDENTITY
	}
}
