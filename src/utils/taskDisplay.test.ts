import { describe, expect, it } from 'vitest'
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/options'
import { priorityColor, statusColor } from './taskDisplay'

describe('taskDisplay', () => {
	it('maps every closed-vocabulary status to a color', () => {
		for (const status of TASK_STATUSES) {
			expect(statusColor(status).length).toBeGreaterThan(0)
		}
	})

	it('maps every closed-vocabulary priority to a color', () => {
		for (const priority of TASK_PRIORITIES) {
			expect(priorityColor(priority).length).toBeGreaterThan(0)
		}
	})
})
