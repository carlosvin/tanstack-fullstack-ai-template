import type { TaskPriority, TaskStatus } from '../types'
import { assertNever } from './assertNever'

const STATUS_COLOR = {
	pending: 'yellow',
	'in-progress': 'teal',
	done: 'green',
	cancelled: 'gray',
} as const satisfies Record<TaskStatus, string>

const PRIORITY_COLOR = {
	low: 'gray',
	medium: 'blue',
	high: 'orange',
	critical: 'red',
} as const satisfies Record<TaskPriority, string>

export function statusColor(status: TaskStatus): string {
	switch (status) {
		case 'pending':
			return STATUS_COLOR.pending
		case 'in-progress':
			return STATUS_COLOR['in-progress']
		case 'done':
			return STATUS_COLOR.done
		case 'cancelled':
			return STATUS_COLOR.cancelled
		default:
			return assertNever(status)
	}
}

export function priorityColor(priority: TaskPriority): string {
	switch (priority) {
		case 'low':
			return PRIORITY_COLOR.low
		case 'medium':
			return PRIORITY_COLOR.medium
		case 'high':
			return PRIORITY_COLOR.high
		case 'critical':
			return PRIORITY_COLOR.critical
		default:
			return assertNever(priority)
	}
}
