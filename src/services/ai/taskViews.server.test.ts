import { describe, expect, it } from 'vitest'
import { taskListRequest, withoutDemoAssignee } from './taskViews.server'

describe('task view tools', () => {
	it('drops a demo visitor email from the task list filter', () => {
		expect(withoutDemoAssignee({ assignee: 'random3a8cba9a@example.com', status: 'pending' })).toEqual({
			status: 'pending',
		})
		expect(withoutDemoAssignee({ assignee: 'alice@example.com' })).toEqual({ assignee: 'alice@example.com' })
	})

	it('keeps a table request out of the repository filter', () => {
		expect(
			taskListRequest({ presentation: 'table', status: 'pending', assignee: 'random3a8cba9a@example.com' }),
		).toEqual({
			filter: { status: 'pending' },
			presentation: 'table',
		})
		expect(taskListRequest({ search: 'api' }).presentation).toBe('cards')
	})
})
