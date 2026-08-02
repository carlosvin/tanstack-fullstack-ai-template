import { describe, expect, it } from 'vitest'
import { matchUserFacingRoute } from './navigationManifest'

describe('matchUserFacingRoute', () => {
	it('matches static routes', () => {
		expect(matchUserFacingRoute('/')).toEqual({ to: '/' })
		expect(matchUserFacingRoute('/tasks')).toEqual({ to: '/tasks' })
		expect(matchUserFacingRoute('/tasks/new')).toEqual({ to: '/tasks/new' })
	})

	it('matches dynamic task routes', () => {
		expect(matchUserFacingRoute('/tasks/task-42')).toEqual({
			to: '/tasks/$taskId',
			params: { taskId: 'task-42' },
		})
		expect(matchUserFacingRoute('/tasks/task-42/edit')).toEqual({
			to: '/tasks/$taskId/edit',
			params: { taskId: 'task-42' },
		})
	})

	it('rejects unknown paths', () => {
		expect(matchUserFacingRoute('/unknown')).toBeNull()
		expect(matchUserFacingRoute('/api/chat')).toBeNull()
	})
})
