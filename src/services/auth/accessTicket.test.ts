import { describe, expect, it } from 'vitest'
import { buildAccessTicket } from './accessTicket'

describe('buildAccessTicket', () => {
	it('merges identity groups and profile role', () => {
		const ticket = buildAccessTicket({
			user: { email: 'alice@example.com', name: 'Alice', groups: ['editors'] },
			profile: { email: 'alice@example.com', name: 'Alice Johnson', role: 'Engineering Lead' },
			isTestUser: false,
		})

		expect(ticket.roles).toEqual(['editors', 'Engineering Lead'])
		expect(ticket.identity.email).toBe('alice@example.com')
		expect(ticket.profile?.name).toBe('Alice Johnson')
	})

	it('requireTaskCreator allows the creator and rejects others', () => {
		const ticket = buildAccessTicket({
			user: { email: 'alice@example.com', name: 'Alice', groups: [] },
			profile: null,
			isTestUser: false,
		})

		expect(() => ticket.requireTaskCreator({ createdBy: 'alice@example.com' })).not.toThrow()
		expect(() => ticket.requireTaskCreator({ createdBy: 'Alice@Example.COM' })).not.toThrow()
		expect(() => ticket.requireTaskCreator({ createdBy: 'bob@example.com' })).toThrow(/task creator/)
	})
})
