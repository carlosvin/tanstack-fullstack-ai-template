import { describe, expect, it } from 'vitest'
import { resolveRequestAccess } from '@/services/auth/resolveRequestAccess'
import { createUnsignedJwt } from '@/utils/jwt.server'

const alice = { email: 'alice@example.com', name: 'Alice', groups: ['editors'] }
const demoCookie = createUnsignedJwt({
	email: 'random1234abcd@example.com',
	name: 'Test User 1234',
	groups: [],
})

describe('resolveRequestAccess', () => {
	it('prefers a verified header identity over the demo cookie', () => {
		const ticket = resolveRequestAccess({ mode: 'verified', strategy: 'secret', key: 'secret' }, alice, demoCookie)
		expect(ticket.user).toEqual(alice)
		expect(ticket.isTestUser).toBe(false)
	})

	it('in verified mode, ignores the demo cookie when the header identity is null', () => {
		const ticket = resolveRequestAccess({ mode: 'verified', strategy: 'secret', key: 'secret' }, null, demoCookie)
		expect(ticket.user.email).toBe('')
		expect(ticket.isTestUser).toBe(false)
		expect(ticket.newTestAuthToken).toBeUndefined()
	})

	it('in verified mode, treats an empty email identity as anonymous (no demo fallback)', () => {
		const ticket = resolveRequestAccess(
			{ mode: 'verified', strategy: 'jwks', url: 'https://idp.example/jwks', issuer: 'https://idp.example' },
			{ email: '', name: 'No Email', groups: [] },
			demoCookie,
		)
		expect(ticket.user.email).toBe('')
		expect(ticket.isTestUser).toBe(false)
	})

	it('in header-off mode, reuses the demo cookie when the header is ignored', () => {
		const ticket = resolveRequestAccess({ mode: 'header-off' }, null, demoCookie)
		expect(ticket.user.email).toBe('random1234abcd@example.com')
		expect(ticket.isTestUser).toBe(true)
	})

	it('in unsigned-dev mode, still uses the demo cookie when the header is empty', () => {
		const ticket = resolveRequestAccess({ mode: 'unsigned-dev' }, null, null)
		expect(ticket.isTestUser).toBe(true)
		expect(ticket.user.email).toMatch(/^random[a-f0-9]{8}@example\.com$/i)
		expect(ticket.newTestAuthToken).toBeTruthy()
	})
})
