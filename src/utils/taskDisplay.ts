import type { TaskPriority, TaskStatus } from '../types'

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
	return STATUS_COLOR[status]
}

export function priorityColor(priority: TaskPriority): string {
	return PRIORITY_COLOR[priority]
}
