import { calendarToday } from '../../utils/calendarDate'
import { isTaskOverdue } from '../../utils/taskDue'
import type { TaskRepo, TaskRepoFilter, TaskRepoInput } from '../schemas/repository'

export { isTaskOverdue }

export function matchesDueFilter(
	task: Pick<TaskRepo, 'dueDate' | 'status'>,
	filter: TaskRepoFilter | undefined,
): boolean {
	if (!filter) return true
	const asOf = filter.asOf ?? calendarToday('UTC')
	if (filter.due === 'overdue' && !isTaskOverdue(task, asOf)) return false
	if (filter.due === 'unscheduled' && task.dueDate) return false
	if (filter.due === 'scheduled' && !task.dueDate) return false
	if (filter.dueOnOrBefore && (!task.dueDate || task.dueDate > filter.dueOnOrBefore)) return false
	return true
}

function sortsByDue(filter?: TaskRepoFilter): boolean {
	if (filter?.sort === 'updated') return false
	return (
		filter?.sort === 'due' || filter?.due === 'overdue' || filter?.due === 'scheduled' || Boolean(filter?.dueOnOrBefore)
	)
}

/** Soonest due date first when the caller asked what is due. `updated` stays newest first. */
export function sortTasks<T extends Pick<TaskRepo, 'dueDate' | 'updatedAt'>>(
	tasks: readonly T[],
	filter?: TaskRepoFilter,
): T[] {
	if (filter?.sort === 'updated') {
		return [...tasks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
	}
	if (!sortsByDue(filter)) return [...tasks]
	return [...tasks].sort((left, right) => {
		if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
			return left.dueDate < right.dueDate ? -1 : 1
		}
		if (left.dueDate && !right.dueDate) return -1
		if (!left.dueDate && right.dueDate) return 1
		return right.updatedAt.localeCompare(left.updatedAt)
	})
}

type ClearableText = 'description' | 'assignee'

/** Drop null and empty optional fields so creates do not persist a clear marker. */
export function taskWriteFields(
	input: TaskRepoInput,
): Omit<TaskRepoInput, 'dueDate' | ClearableText> & { dueDate?: string; description?: string; assignee?: string } {
	const { dueDate, description, assignee, ...rest } = input
	return {
		...rest,
		...(typeof description === 'string' && description.length > 0 ? { description } : {}),
		...(typeof assignee === 'string' && assignee.length > 0 ? { assignee } : {}),
		...(typeof dueDate === 'string' ? { dueDate } : {}),
	}
}

export type TaskFieldUnset = 'dueDate' | ClearableText

/** Split a partial update into fields to set and fields the caller cleared. */
export function taskUpdateFields(input: Partial<TaskRepoInput>): {
	set: Partial<
		Omit<TaskRepoInput, 'dueDate' | ClearableText> & { dueDate?: string; description?: string; assignee?: string }
	>
	unset: TaskFieldUnset[]
} {
	const set: Partial<
		Omit<TaskRepoInput, 'dueDate' | ClearableText> & { dueDate?: string; description?: string; assignee?: string }
	> = {}
	const unset: TaskFieldUnset[] = []
	if ('dueDate' in input) {
		if (typeof input.dueDate === 'string') set.dueDate = input.dueDate
		else if (input.dueDate === null) unset.push('dueDate')
	}
	if (input.title !== undefined) set.title = input.title
	if (input.status !== undefined) set.status = input.status
	if (input.priority !== undefined) set.priority = input.priority
	for (const key of ['description', 'assignee'] as const) {
		if (!(key in input)) continue
		const value = input[key]
		if (typeof value === 'string' && value.length > 0) set[key] = value
		else if (value === null || value === '') unset.push(key)
	}
	return { set, unset }
}
