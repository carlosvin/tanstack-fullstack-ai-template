/**
 * Agentic task-view tools.
 *
 * These return task data only. The shell builds the A2UI surface from that
 * payload. They are not linked to an HTML resource.
 */

import { toolDefinition } from '@tanstack/ai'
import { isDemoTestEmail } from '../../utils/testAuth.server'
import { getTask, getTasks } from '../api/serverFns'
import { type TaskFilter, TaskFilterSchema, TaskIdInputSchema } from '../schemas/schemas'
import { createSafeServerTool } from './serverTool'

/** Demo visitors are not assignees. Drop that filter so "my tasks" shows the list. */
export function withoutDemoAssignee(filter: TaskFilter): TaskFilter {
	if (!filter.assignee || !isDemoTestEmail(filter.assignee)) return filter
	const { assignee: _assignee, ...rest } = filter
	return rest
}

export const showTasksViewTool = createSafeServerTool(
	toolDefinition({
		name: 'showTasksView',
		description:
			'Show the task list inline. Prefer this over getTasks when the user needs to see tasks. Returns the matching tasks.',
		inputSchema: TaskFilterSchema,
	}),
	async (args) => {
		const tasks = await getTasks({ data: withoutDemoAssignee(args) })
		return { tasks }
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
