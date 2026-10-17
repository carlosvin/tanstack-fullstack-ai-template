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
	return (
		filter?.sort === 'due' || filter?.due === 'overdue' || filter?.due === 'scheduled' || Boolean(filter?.dueOnOrBefore)
	)
}

/** Soonest due date first when the caller asked what is due. Otherwise keep the incoming order. */
export function sortTasks<T extends Pick<TaskRepo, 'dueDate' | 'updatedAt'>>(
	tasks: readonly T[],
	filter?: TaskRepoFilter,
): T[] {
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

/** Drop a null due date so creates do not persist a clear marker. */
export function taskWriteFields(input: TaskRepoInput): Omit<TaskRepoInput, 'dueDate'> & { dueDate?: string } {
	const { dueDate, ...rest } = input
	if (typeof dueDate === 'string') return { ...rest, dueDate }
	return rest
}

/** Split a partial update into fields to set and a due-date clear. */
export function taskUpdateFields(input: Partial<TaskRepoInput>): {
	set: Partial<Omit<TaskRepoInput, 'dueDate'> & { dueDate?: string }>
	unsetDueDate: boolean
} {
	const set: Partial<Omit<TaskRepoInput, 'dueDate'> & { dueDate?: string }> = {}
	let unsetDueDate = false
	if ('dueDate' in input) {
		if (typeof input.dueDate === 'string') set.dueDate = input.dueDate
		else if (input.dueDate === null) unsetDueDate = true
	}
	if (input.title !== undefined) set.title = input.title
	if (input.description !== undefined) set.description = input.description
	if (input.status !== undefined) set.status = input.status
	if (input.priority !== undefined) set.priority = input.priority
	if (input.assignee !== undefined) set.assignee = input.assignee
	return { set, unsetDueDate }
}
