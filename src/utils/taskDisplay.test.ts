import { describe, expect, it } from 'vitest'
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/options'
import {
	priorityColor,
	priorityLabel,
	prioritySelectOptions,
	statusColor,
	statusLabel,
	statusSelectOptions,
} from './taskDisplay'

describe('taskDisplay', () => {
	it('maps every closed-vocabulary status to a color and label', () => {
		expect(statusSelectOptions.map((option) => option.value)).toEqual([...TASK_STATUSES])
		for (const status of TASK_STATUSES) {
			expect(statusColor(status).length).toBeGreaterThan(0)
			expect(statusLabel(status).length).toBeGreaterThan(0)
			expect(statusSelectOptions.find((option) => option.value === status)?.label).toBe(statusLabel(status))
		}
		expect(statusLabel('in-progress')).toBe('In Progress')
		expect(statusLabel('cancelled')).toBe('Cancelled')
	})

	it('maps every closed-vocabulary priority to a color and label', () => {
		expect(prioritySelectOptions.map((option) => option.value)).toEqual([...TASK_PRIORITIES])
		for (const priority of TASK_PRIORITIES) {
			expect(priorityColor(priority).length).toBeGreaterThan(0)
			expect(priorityLabel(priority).length).toBeGreaterThan(0)
			expect(prioritySelectOptions.find((option) => option.value === priority)?.label).toBe(priorityLabel(priority))
		}
		expect(priorityLabel('critical')).toBe('Critical')
	})
})
