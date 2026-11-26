import { decodeJwt, SignJWT } from 'jose'
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

/** Creates an HS256 JWT for local/e2e fixtures. Requires a secret of at least 32 characters. */
export async function createHs256Jwt(
	identity: UserIdentity,
	secret: string,
	options?: { expiresIn?: string | number; issuer?: string; audience?: string },
): Promise<string> {
	if (secret.length < 32) {
		throw new Error('HS256 secret must be at least 32 characters')
	}
	const jwt = new SignJWT({
		email: identity.email,
		name: identity.name,
		groups: identity.groups,
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(options?.expiresIn ?? '2h')
	if (options?.issuer) jwt.setIssuer(options.issuer)
	if (options?.audience) jwt.setAudience(options.audience)
	return jwt.sign(new TextEncoder().encode(secret))
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
