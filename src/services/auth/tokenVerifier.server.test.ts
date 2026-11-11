/** @vitest-environment node */

import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyAccessToken } from '@/services/auth/tokenVerifier.server'
import { createUnsignedJwt } from '@/utils/jwt.server'

const SECRET = 'test-secret-at-least-32-bytes!!'
const secretKey = new TextEncoder().encode(SECRET)

const alice = { email: 'alice@example.com', name: 'Alice', groups: ['editors'] }

function signHs256(claims: Record<string, unknown>, options?: { expiresIn?: string | number; key?: Uint8Array }) {
	const jwt = new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
	jwt.setExpirationTime(options?.expiresIn ?? '2h')
	return jwt.sign(options?.key ?? secretKey)
}

describe('verifyAccessToken', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns null when the header is off, even for a signed token', async () => {
		const token = await signHs256(alice)
		expect(await verifyAccessToken({ mode: 'header-off' }, token)).toBeNull()
	})

	it('returns null when the token is missing', async () => {
		expect(await verifyAccessToken({ mode: 'verified', strategy: 'secret', key: SECRET }, null)).toBeNull()
	})

	it('accepts an HS256 token signed with the configured secret', async () => {
		const token = await signHs256({ ...alice, iss: 'https://idp.example', aud: 'taskhub' })
		const identity = await verifyAccessToken(
			{
				mode: 'verified',
				strategy: 'secret',
				key: SECRET,
				issuer: 'https://idp.example',
				audience: 'taskhub',
			},
			token,
		)
		expect(identity).toEqual(alice)
	})

	it('rejects a token signed with a different secret', async () => {
		const token = await signHs256(alice, { key: new TextEncoder().encode('another-secret-at-least-32-bytes') })
		expect(await verifyAccessToken({ mode: 'verified', strategy: 'secret', key: SECRET }, token)).toBeNull()
	})

	it('rejects an expired token', async () => {
		const token = await signHs256(alice, { expiresIn: -10 })
		expect(await verifyAccessToken({ mode: 'verified', strategy: 'secret', key: SECRET }, token)).toBeNull()
	})

	it('rejects an issuer or audience mismatch', async () => {
		const token = await signHs256({ ...alice, iss: 'https://other.example', aud: 'taskhub' })
		expect(
			await verifyAccessToken(
				{ mode: 'verified', strategy: 'secret', key: SECRET, issuer: 'https://idp.example', audience: 'taskhub' },
				token,
			),
		).toBeNull()
	})

	it('rejects an unsigned token when verification is configured', async () => {
		const token = createUnsignedJwt(alice)
		expect(await verifyAccessToken({ mode: 'verified', strategy: 'secret', key: SECRET }, token)).toBeNull()
	})

	it('decodes an unsigned token only in unsigned-dev mode', async () => {
		const token = createUnsignedJwt(alice)
		expect(await verifyAccessToken({ mode: 'unsigned-dev' }, token)).toEqual(alice)
		expect(await verifyAccessToken({ mode: 'unsigned-dev' }, 'not-a-jwt')).toBeNull()
	})

	it('verifies an RS256 token against a JWKS document', async () => {
		const { publicKey, privateKey } = await generateKeyPair('RS256')
		const jwk = await exportJWK(publicKey)
		jwk.alg = 'RS256'
		jwk.kid = 'test-key'
		jwk.use = 'sig'
		const jwksUrl = 'https://idp.example/.well-known/jwks.json'
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				if (String(input) !== jwksUrl) return new Response('missing', { status: 404 })
				return new Response(JSON.stringify({ keys: [jwk] }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				})
			}),
		)

		const token = await new SignJWT(alice)
			.setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
			.setIssuedAt()
			.setExpirationTime('2h')
			.setIssuer('https://idp.example')
			.setAudience('taskhub')
			.sign(privateKey)

		const identity = await verifyAccessToken(
			{
				mode: 'verified',
				strategy: 'jwks',
				url: jwksUrl,
				issuer: 'https://idp.example',
				audience: 'taskhub',
			},
			token,
		)
		expect(identity).toEqual(alice)
	})
})
