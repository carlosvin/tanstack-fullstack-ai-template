import { describe, expect, it, vi } from 'vitest'
import { createUnsignedJwt, extractIdentityFromJwt } from './jwt.server'
import { createRandomTestIdentity, createTestAuthToken, resolveAccessTicket } from './testAuth.server'

describe('createRandomTestIdentity', () => {
	it('creates an example.com email and display name', () => {
		const identity = createRandomTestIdentity()
		expect(identity.email).toMatch(/^random\d{4}@example\.com$/)
		expect(identity.name).toMatch(/^Test User \d{4}$/)
		expect(identity.groups).toEqual([])
	})
})

describe('resolveAccessTicket', () => {
	it('uses header identity when present and marks user as not a test user', () => {
		const token = createTestAuthToken({
			email: 'alice@example.com',
			name: 'Alice',
			groups: [],
		})

		const ticket = resolveAccessTicket(`Bearer ${token}`, null)

		expect(ticket.user.email).toBe('alice@example.com')
		expect(ticket.isTestUser).toBe(false)
		expect(ticket.shouldSetTestAuthCookie).toBe(false)
	})

	it('reuses cookie identity when header is absent', () => {
		const token = createTestAuthToken({
			email: 'random1234@example.com',
			name: 'Test User 1234',
			groups: [],
		})

		const ticket = resolveAccessTicket(null, token)

		expect(ticket.user.email).toBe('random1234@example.com')
		expect(ticket.isTestUser).toBe(true)
		expect(ticket.shouldSetTestAuthCookie).toBe(false)
	})

	it('mints a new test user when header and cookie are absent', () => {
		const ticket = resolveAccessTicket(null, null)

		expect(ticket.user.email).toMatch(/^random\d{4}@example\.com$/)
		expect(ticket.isTestUser).toBe(true)
		expect(ticket.shouldSetTestAuthCookie).toBe(true)
	})

	it('prefers header identity over cookie', () => {
		const headerToken = createTestAuthToken({
			email: 'alice@example.com',
			name: 'Alice',
			groups: ['admin'],
		})
		const cookieToken = createTestAuthToken({
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

describe('createUnsignedJwt', () => {
	it('round-trips through extractIdentityFromJwt', () => {
		const identity = {
			email: 'random5678@example.com',
			name: 'Test User 5678',
			groups: ['demo'],
		}

		const token = createUnsignedJwt(identity)
		const parsed = extractIdentityFromJwt(token)

		expect(parsed).toEqual(identity)
	})
})

describe('createRandomTestIdentity uniqueness', () => {
	it('can generate different suffixes', () => {
		const randomSpy = vi.spyOn(Math, 'random')
		randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.999)

		const first = createRandomTestIdentity()
		const second = createRandomTestIdentity()

		expect(first.email).not.toBe(second.email)
		randomSpy.mockRestore()
	})
})
