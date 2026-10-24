import { describe, expect, it } from 'vitest'
import type { TaskRepo } from '../schemas/repository'
import { isTaskOverdue, matchesDueFilter, sortTasks } from './taskQuery'

const open: TaskRepo = {
	id: 'task-1',
	title: 'Ship it',
	status: 'pending',
	priority: 'high',
	dueDate: '2026-10-01',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
}

describe('task due filters', () => {
	it('treats an open task before asOf as overdue and ignores done tasks', () => {
		expect(isTaskOverdue(open, '2026-10-17')).toBe(true)
		expect(isTaskOverdue({ ...open, status: 'done' }, '2026-10-17')).toBe(false)
		expect(isTaskOverdue({ ...open, dueDate: '2026-10-17' }, '2026-10-17')).toBe(false)
		expect(isTaskOverdue({ ...open, dueDate: undefined }, '2026-10-17')).toBe(false)
	})

	it('matches overdue, unscheduled, and due-on-or-before', () => {
		const blank = { ...open, dueDate: undefined }
		expect(matchesDueFilter(open, { due: 'overdue', asOf: '2026-10-17' })).toBe(true)
		expect(matchesDueFilter(blank, { due: 'unscheduled' })).toBe(true)
		expect(matchesDueFilter(open, { due: 'unscheduled' })).toBe(false)
		expect(matchesDueFilter(open, { dueOnOrBefore: '2026-10-01' })).toBe(true)
		expect(matchesDueFilter(open, { dueOnOrBefore: '2026-09-30' })).toBe(false)
	})

	it('sorts the soonest due date first when asked', () => {
		const later = { ...open, id: 'task-2', dueDate: '2026-12-01', updatedAt: '2026-02-01T00:00:00.000Z' }
		const none = { ...open, id: 'task-3', dueDate: undefined }
		expect(sortTasks([later, none, open], { sort: 'due' }).map((task) => task.id)).toEqual([
			'task-1',
			'task-2',
			'task-3',
		])
		expect(sortTasks([later, open], { status: 'pending' }).map((task) => task.id)).toEqual(['task-2', 'task-1'])
	})
})
