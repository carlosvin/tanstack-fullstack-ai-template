/** Task statuses available in the application. */
export const TASK_STATUSES = ['pending', 'in-progress', 'done', 'cancelled'] as const

/** Task priority levels. */
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

/** Due-date filters for the task list. */
export const TASK_DUE_FILTERS = ['overdue', 'unscheduled', 'scheduled'] as const

/** List order. `due` puts the soonest calendar date first. */
export const TASK_SORTS = ['updated', 'due'] as const

/** Task fields that support distinct-value discovery for filters. */
export const DISTINCT_VALUE_FIELDS = ['assignee', 'status', 'priority'] as const

export type DistinctValueField = (typeof DISTINCT_VALUE_FIELDS)[number]
