import { describe, expect, it } from 'vitest'
import { parseTaskRepo, parseTaskRepoOrNull, parseUserProfileRepoOrNull } from './repoParsers'

describe('repoParsers', () => {
	it('parseTaskRepo validates persisted task documents', () => {
		const task = parseTaskRepo({
			id: 'task-1',
			title: 'Test',
			status: 'pending',
			priority: 'medium',
			createdAt: '2025-01-01T00:00:00Z',
			updatedAt: '2025-01-01T00:00:00Z',
		})
		expect(task.id).toBe('task-1')
	})

	it('parseTaskRepo rejects invalid documents', () => {
		expect(() => parseTaskRepo({ id: 'x', title: '' })).toThrow()
	})

	it('parseTaskRepoOrNull returns null for missing rows', () => {
		expect(parseTaskRepoOrNull(null)).toBeNull()
		expect(parseTaskRepoOrNull(undefined)).toBeNull()
	})

	it('parseUserProfileRepoOrNull validates profile documents', () => {
		const profile = parseUserProfileRepoOrNull({
			email: 'alice@example.com',
			name: 'Alice',
		})
		expect(profile?.email).toBe('alice@example.com')
	})
})
