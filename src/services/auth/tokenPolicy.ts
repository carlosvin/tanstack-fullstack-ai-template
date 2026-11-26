/**
 * How an Authorization header becomes an identity.
 *
 * Verification wins over the dev escape hatch. With no verifier and no
 * escape hatch, header identities are ignored and only the demo cookie remains.
 */

export interface TokenPolicyInput {
	jwtSecret?: string
	jwksUrl?: string
	issuer?: string
	audience?: string
	allowUnsignedTokens?: boolean
}

export type TokenPolicy =
	| {
			mode: 'verified'
			strategy: 'secret'
			key: string
			issuer?: string
			audience?: string
	  }
	| {
			mode: 'verified'
			strategy: 'jwks'
			url: string
			/** Required for JWKS so tokens from other apps at the same IdP are rejected. */
			issuer: string
			audience?: string
	  }
	| { mode: 'unsigned-dev' }
	| { mode: 'header-off' }

function optionalAudience(input: TokenPolicyInput): { audience?: string } {
	return input.audience ? { audience: input.audience } : {}
}

/**
 * Pick one token mode. A configured verifier always rejects unsigned header tokens.
 * JWKS requires an issuer — call sites should fail env parse before reaching here without one.
 */
export function resolveTokenPolicy(input: TokenPolicyInput): TokenPolicy {
	if (input.jwtSecret) {
		return {
			mode: 'verified',
			strategy: 'secret',
			key: input.jwtSecret,
			...(input.issuer ? { issuer: input.issuer } : {}),
			...optionalAudience(input),
		}
	}
	if (input.jwksUrl) {
		if (!input.issuer) {
			throw new Error('AUTH_JWT_ISSUER is required when AUTH_JWKS_URL is set')
		}
		return {
			mode: 'verified',
			strategy: 'jwks',
			url: input.jwksUrl,
			issuer: input.issuer,
			...optionalAudience(input),
		}
	}
	if (input.allowUnsignedTokens) return { mode: 'unsigned-dev' }
	return { mode: 'header-off' }
}
