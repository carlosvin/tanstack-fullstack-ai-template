import { describe, expect, it } from 'vitest'
import { isInternalPath, toInternalRouterLinkTarget } from './internalLinks'

describe('isInternalPath', () => {
	it('accepts root and task routes', () => {
		expect(isInternalPath('/')).toBe(true)
		expect(isInternalPath('/tasks')).toBe(true)
		expect(isInternalPath('/tasks/abc-123')).toBe(true)
	})

	it('rejects API and external URLs', () => {
		expect(isInternalPath('/api/chat')).toBe(false)
		expect(isInternalPath('https://example.com/tasks')).toBe(false)
	})

	it('accepts same-origin absolute URLs', () => {
		const origin = window.location.origin
		expect(isInternalPath(`${origin}/tasks/abc`)).toBe(true)
	})
})

describe('toInternalRouterLinkTarget', () => {
	it('maps task detail paths to typed route params', () => {
		expect(toInternalRouterLinkTarget('/tasks/task-42')).toEqual({
			to: '/tasks/$taskId',
			params: { taskId: 'task-42' },
		})
	})

	it('maps edit paths to typed route params', () => {
		expect(toInternalRouterLinkTarget('/tasks/task-42/edit')).toEqual({
			to: '/tasks/$taskId/edit',
			params: { taskId: 'task-42' },
		})
	})

	it('maps task list filters to search params', () => {
		expect(toInternalRouterLinkTarget('/tasks?status=in-progress')).toEqual({
			to: '/tasks',
			search: { status: 'in-progress' },
		})
	})

	it('returns null for invalid paths', () => {
		expect(toInternalRouterLinkTarget('/api/chat')).toBeNull()
		expect(toInternalRouterLinkTarget('https://example.com/tasks')).toBeNull()
		expect(toInternalRouterLinkTarget('/unknown')).toBeNull()
	})
})
