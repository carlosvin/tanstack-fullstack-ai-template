import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/options'
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

const STATUS_LABEL = {
	pending: 'Pending',
	'in-progress': 'In Progress',
	done: 'Done',
	cancelled: 'Cancelled',
} as const satisfies Record<TaskStatus, string>

const PRIORITY_LABEL = {
	low: 'Low',
	medium: 'Medium',
	high: 'High',
	critical: 'Critical',
} as const satisfies Record<TaskPriority, string>

export function statusColor(status: TaskStatus): string {
	return STATUS_COLOR[status]
}

export function priorityColor(priority: TaskPriority): string {
	return PRIORITY_COLOR[priority]
}

export function statusLabel(status: TaskStatus): string {
	return STATUS_LABEL[status]
}

export function priorityLabel(priority: TaskPriority): string {
	return PRIORITY_LABEL[priority]
}

export const statusSelectOptions = TASK_STATUSES.map((value) => ({
	value,
	label: statusLabel(value),
}))

export const prioritySelectOptions = TASK_PRIORITIES.map((value) => ({
	value,
	label: priorityLabel(value),
}))
