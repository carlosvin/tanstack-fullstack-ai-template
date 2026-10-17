/**
 * Agentic task-view tools.
 *
 * These return task data only. The shell builds the A2UI surface from that
 * payload. They are not linked to an HTML resource.
 */

import { toolDefinition } from '@tanstack/ai'
import { isDemoTestEmail } from '../../utils/testAuth.server'
import { getTask, getTasks } from '../api/serverFns'
import {
	type ShowTasksViewInput,
	ShowTasksViewInputSchema,
	type TaskFilter,
	TaskIdInputSchema,
} from '../schemas/schemas'
import { createSafeServerTool } from './serverTool'

/** Demo visitors are not assignees. Drop that filter so "my tasks" shows the list. */
export function withoutDemoAssignee(filter: TaskFilter): TaskFilter {
	if (!filter.assignee || !isDemoTestEmail(filter.assignee)) return filter
	const { assignee: _assignee, ...rest } = filter
	return rest
}

/** Split the view choice from the repository filter. A table is opt-in. */
export function taskListRequest(args: ShowTasksViewInput): { filter: TaskFilter; presentation: 'cards' | 'table' } {
	const { presentation, ...filter } = args
	return {
		filter: withoutDemoAssignee(filter),
		presentation: presentation === 'table' ? 'table' : 'cards',
	}
}

export const showTasksViewTool = createSafeServerTool(
	toolDefinition({
		name: 'showTasksView',
		description:
			'Show the task list inline. Set presentation to "table" when the user asks for a table. Set presentation to "cards" when they ask for cards or a grid. Omit presentation for the card grid. Prefer this over getTasks when the user needs to see tasks. Returns the tasks and the presentation.',
		inputSchema: ShowTasksViewInputSchema,
	}),
	async (args) => {
		const { filter, presentation } = taskListRequest(args)
		const tasks = await getTasks({ data: filter })
		return { tasks, presentation }
	},
)

export const showTaskViewTool = createSafeServerTool(
	toolDefinition({
		name: 'showTaskView',
		description:
			'Show one task inline. Call this when the user opens or names a single task. Pass taskId. Returns the task. Do not list other tasks instead.',
		inputSchema: TaskIdInputSchema,
	}),
	async (args) => {
		const task = await getTask({ data: args })
		if (!task) return { error: 'Task not found.', code: 404 }
		return { task }
	},
)
