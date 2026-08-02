import { describe, expect, it } from 'vitest'
import { createUnsignedJwt, extractIdentityFromJwt } from './jwt.server'
import { createRandomTestIdentity, resolveAccessTicket } from './testAuth.server'

describe('createRandomTestIdentity', () => {
	it('creates an example.com email and display name', () => {
		const identity = createRandomTestIdentity()
		expect(identity.email).toMatch(/^random[a-f0-9]{8}@example\.com$/)
		expect(identity.name).toMatch(/^Test User [a-f0-9]{4}$/)
		expect(identity.groups).toEqual([])
	})
})

describe('resolveAccessTicket', () => {
	it('uses header identity when present and marks user as not a test user', () => {
		const token = createUnsignedJwt({
			email: 'alice@example.com',
			name: 'Alice',
			groups: [],
		})

		const ticket = resolveAccessTicket(`Bearer ${token}`, null)

		expect(ticket.user.email).toBe('alice@example.com')
		expect(ticket.isTestUser).toBe(false)
		expect(ticket.newTestAuthToken).toBeUndefined()
	})

	it('reuses cookie identity when header is absent', () => {
		const token = createUnsignedJwt({
			email: 'random1234@example.com',
			name: 'Test User 1234',
			groups: [],
		})

		const ticket = resolveAccessTicket(null, token)

		expect(ticket.user.email).toBe('random1234@example.com')
		expect(ticket.isTestUser).toBe(true)
		expect(ticket.newTestAuthToken).toBeUndefined()
	})

	it('mints a new test user when header and cookie are absent', () => {
		const ticket = resolveAccessTicket(null, null)

		expect(ticket.user.email).toMatch(/^random[a-f0-9]{8}@example\.com$/)
		expect(ticket.isTestUser).toBe(true)
		expect(ticket.newTestAuthToken).toBeTruthy()
		expect(extractIdentityFromJwt(ticket.newTestAuthToken ?? null)).toEqual(ticket.user)
	})

	it('prefers header identity over cookie', () => {
		const headerToken = createUnsignedJwt({
			email: 'alice@example.com',
			name: 'Alice',
			groups: ['admin'],
		})
		const cookieToken = createUnsignedJwt({
			email: 'random9999@example.com',
			name: 'Test User 9999',
			groups: [],
		})

		const ticket = resolveAccessTicket(`Bearer ${headerToken}`, cookieToken)

		expect(ticket.user.email).toBe('alice@example.com')
		expect(ticket.user.groups).toEqual(['admin'])
		expect(ticket.isTestUser).toBe(false)
	})
})
