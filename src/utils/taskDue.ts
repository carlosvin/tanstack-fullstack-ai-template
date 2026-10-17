import type { TaskStatus } from '../types'

const OPEN_STATUSES = new Set<TaskStatus>(['pending', 'in-progress'])

/** A past due date on an open task. Done and cancelled are never overdue. */
export function isTaskOverdue(task: { dueDate?: string | null; status: TaskStatus }, asOf: string): boolean {
	return Boolean(task.dueDate && task.dueDate < asOf && OPEN_STATUSES.has(task.status))
}
