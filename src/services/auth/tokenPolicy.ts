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
			issuer?: string
			audience?: string
	  }
	| { mode: 'unsigned-dev' }
	| { mode: 'header-off' }

function verifiedClaims(input: TokenPolicyInput): { issuer?: string; audience?: string } {
	return {
		...(input.issuer ? { issuer: input.issuer } : {}),
		...(input.audience ? { audience: input.audience } : {}),
	}
}

/** Pick one token mode. A configured verifier always rejects unsigned header tokens. */
export function resolveTokenPolicy(input: TokenPolicyInput): TokenPolicy {
	if (input.jwtSecret) {
		return { mode: 'verified', strategy: 'secret', key: input.jwtSecret, ...verifiedClaims(input) }
	}
	if (input.jwksUrl) {
		return { mode: 'verified', strategy: 'jwks', url: input.jwksUrl, ...verifiedClaims(input) }
	}
	if (input.allowUnsignedTokens) return { mode: 'unsigned-dev' }
	return { mode: 'header-off' }
}
