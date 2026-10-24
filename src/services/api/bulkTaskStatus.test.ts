import { describe, expect, it } from 'vitest'
import { buildAccessTicket } from '../auth/accessTicket'
import { SeedRepository } from '../repository/seedRepository'
import { applyBulkStatus } from './bulkTaskStatus'

describe('applyBulkStatus', () => {
	it('updates rows the caller created and names the ones it refuses', async () => {
		const repository = new SeedRepository()
		const ticket = buildAccessTicket({
			user: { email: 'alice@example.com', name: 'Alice Johnson', groups: [] },
			profile: null,
			isTestUser: false,
		})

		const result = await applyBulkStatus(repository, ticket, {
			taskIds: ['task-1', 'task-3', 'missing', 'task-1'],
			status: 'cancelled',
		})

		expect(result.updated.map((task) => task.id)).toEqual(['task-1'])
		expect(result.updated[0]?.status).toBe('cancelled')
		expect(result.refused).toEqual([
			{
				taskId: 'task-3',
				title: 'Implement authentication',
				reason: 'Only the task creator can change this task',
			},
			{ taskId: 'missing', reason: 'Task not found' },
		])
		expect((await repository.getTask('task-1'))?.status).toBe('cancelled')
		expect((await repository.getTask('task-3'))?.status).toBe('pending')
	})
})
