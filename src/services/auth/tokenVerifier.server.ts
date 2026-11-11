import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from 'jose'
import type { TokenPolicy } from '@/services/auth/tokenPolicy'
import { JwtIdentityClaimsSchema, type UserIdentity, UserIdentitySchema } from '@/services/schemas/schemas'
import { extractIdentityFromJwt } from '@/utils/jwt.server'
import { createServerLogger } from '@/utils/serverLogger'

const log = createServerLogger('tokenVerifier')

const jwksByUrl = new Map<string, JWTVerifyGetKey>()

function jwksFor(url: string): JWTVerifyGetKey {
	const cached = jwksByUrl.get(url)
	if (cached) return cached
	const jwks = createRemoteJWKSet(new URL(url))
	jwksByUrl.set(url, jwks)
	return jwks
}

function identityFromClaims(payload: unknown): UserIdentity | null {
	const claims = JwtIdentityClaimsSchema.parse(payload)
	if (!claims.email) return null
	return UserIdentitySchema.parse({
		email: claims.email,
		name: claims.name ?? '',
		groups: claims.groups ?? [],
	})
}

/**
 * Resolve a raw bearer token to an identity under the active policy.
 * Returns null when the header must be ignored or the token does not verify.
 * The caller passes the token only — no `Bearer` prefix.
 */
export async function verifyAccessToken(policy: TokenPolicy, rawToken: string | null): Promise<UserIdentity | null> {
	if (policy.mode === 'header-off' || !rawToken) return null

	if (policy.mode === 'unsigned-dev') {
		const decoded = extractIdentityFromJwt(rawToken)
		return decoded.email ? decoded : null
	}

	try {
		const options = {
			...(policy.issuer ? { issuer: policy.issuer } : {}),
			...(policy.audience ? { audience: policy.audience } : {}),
		}
		const { payload } =
			policy.strategy === 'secret'
				? await jwtVerify(rawToken, new TextEncoder().encode(policy.key), { ...options, algorithms: ['HS256'] })
				: await jwtVerify(rawToken, jwksFor(policy.url), options)
		return identityFromClaims(payload)
	} catch (err) {
		log.debug({ err: err instanceof Error ? err.name : 'unknown' }, 'rejected access token')
		return null
	}
}
