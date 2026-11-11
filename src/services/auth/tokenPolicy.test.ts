import { describe, expect, it } from 'vitest'
import { resolveTokenPolicy, type TokenPolicy } from '@/services/auth/tokenPolicy'

function modeName(policy: TokenPolicy): TokenPolicy['mode'] {
	switch (policy.mode) {
		case 'verified':
		case 'unsigned-dev':
		case 'header-off':
			return policy.mode
		default: {
			const unreachable: never = policy
			return unreachable
		}
	}
}

describe('resolveTokenPolicy', () => {
	it('ignores header identities when nothing is configured', () => {
		expect(resolveTokenPolicy({})).toEqual({ mode: 'header-off' })
	})

	it('accepts unsigned tokens only as an explicit dev opt-in', () => {
		expect(resolveTokenPolicy({ allowUnsignedTokens: true })).toEqual({ mode: 'unsigned-dev' })
	})

	it('verifies with the HMAC secret and keeps issuer and audience', () => {
		expect(
			resolveTokenPolicy({
				jwtSecret: 'secret-value',
				issuer: 'https://idp.example',
				audience: 'taskhub',
				allowUnsignedTokens: true,
			}),
		).toEqual({
			mode: 'verified',
			strategy: 'secret',
			key: 'secret-value',
			issuer: 'https://idp.example',
			audience: 'taskhub',
		})
	})

	it('prefers the HMAC secret when a JWKS URL is also set', () => {
		const policy = resolveTokenPolicy({
			jwtSecret: 'secret-value',
			jwksUrl: 'https://idp.example/jwks',
		})
		expect(policy).toMatchObject({ mode: 'verified', strategy: 'secret', key: 'secret-value' })
	})

	it('verifies with JWKS when no secret is set', () => {
		expect(resolveTokenPolicy({ jwksUrl: 'https://idp.example/jwks', allowUnsignedTokens: true })).toEqual({
			mode: 'verified',
			strategy: 'jwks',
			url: 'https://idp.example/jwks',
		})
	})

	it('covers every policy mode', () => {
		const policies = [
			resolveTokenPolicy({}),
			resolveTokenPolicy({ allowUnsignedTokens: true }),
			resolveTokenPolicy({ jwtSecret: 'secret-value' }),
		]
		expect(policies.map(modeName)).toEqual(['header-off', 'unsigned-dev', 'verified'])
	})
})
