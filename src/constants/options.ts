/** Task statuses available in the application. */
export const TASK_STATUSES = ['pending', 'in-progress', 'done', 'cancelled'] as const

/** Task priority levels. */
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

/** Task fields that support distinct-value discovery for filters. */
export const DISTINCT_VALUE_FIELDS = ['assignee', 'status', 'priority'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type DistinctValueField = (typeof DISTINCT_VALUE_FIELDS)[number]

/** Narrow a free-form Select value to a task status. */
export function parseTaskStatus(value: string | null | undefined): TaskStatus | undefined {
	return TASK_STATUSES.find((status) => status === value)
}

/** Narrow a free-form Select value to a task priority. */
export function parseTaskPriority(value: string | null | undefined): TaskPriority | undefined {
	return TASK_PRIORITIES.find((priority) => priority === value)
}
