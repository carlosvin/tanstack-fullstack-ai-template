/** Task statuses available in the application. */
export const TASK_STATUSES = ['pending', 'in-progress', 'done', 'cancelled'] as const

/** Task priority levels. */
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

/** Task fields that support distinct-value discovery for filters. */
export const DISTINCT_VALUE_FIELDS = ['assignee', 'status', 'priority'] as const
