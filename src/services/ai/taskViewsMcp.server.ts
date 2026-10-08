/**
 * TanStack AI MCP registration for the agentic task views.
 *
 * `createMCPServer` publishes the view tools and their `ui://` documents.
 * `createMCPClient` discovers those tools. `chat({ mcp })` then stamps
 * `metadata.mcp.uiResourceUri` and binds `resources/read`. The tool handlers
 * return data only.
 */

import { toolDefinition } from '@tanstack/ai'
import { createMCPClient } from '@tanstack/ai-mcp'
import { createMCPServer, resourceDefinition } from '@tanstack/ai-mcp/server'
import { isDemoTestEmail } from '../../utils/testAuth.server'
import { getTask, getTasks } from '../api/serverFns'
import { MCP_APP_MIME_TYPE, TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from '../mcpUi/mcpUiResource'
import { readMcpUiResource } from '../mcpUi/mcpUiResources'
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

const TASK_VIEWS_MCP_URL = 'http://task-views.local/mcp'

function viewResource(name: string, uri: typeof TASKS_LIST_UI_URI | typeof TASK_DETAIL_UI_URI) {
	return resourceDefinition({
		name,
		uri,
		mimeType: MCP_APP_MIME_TYPE,
	}).read(async () => {
		const read = await readMcpUiResource(uri)
		const text = read.contents[0]?.text
		if (typeof text !== 'string') {
			throw new Error(`MCP UI resource ${uri} is empty`)
		}
		return { text }
	})
}

const showTasksViewTool = createSafeServerTool(
	toolDefinition({
		name: 'showTasksView',
		description:
			'Show the task list as an interactive UI. Set presentation to "table" when the user asks for a table. Set presentation to "cards" when they ask for cards or a grid. Omit presentation for the card grid. Prefer this over getTasks when the user needs to see tasks. Returns the tasks and the presentation. The linked MCP UI resource renders them.',
		inputSchema: ShowTasksViewInputSchema,
		metadata: { _meta: { ui: { resourceUri: TASKS_LIST_UI_URI } } },
	}),
	async (args) => {
		const { filter, presentation } = taskListRequest(args)
		const tasks = await getTasks({ data: filter })
		return { tasks, presentation }
	},
)

const showTaskViewTool = createSafeServerTool(
	toolDefinition({
		name: 'showTaskView',
		description:
			'Show one task in the detail view. Call this when the user opens or names a single task. Pass taskId. Returns the task. Do not list other tasks instead.',
		inputSchema: TaskIdInputSchema,
		metadata: { _meta: { ui: { resourceUri: TASK_DETAIL_UI_URI } } },
	}),
	async (args) => {
		const task = await getTask({ data: args })
		if (!task) return { error: 'Task not found.', code: 404 }
		return { task }
	},
)

/** In-process MCP server for `showTasksView` and `showTaskView`. */
export const taskViewsMcpServer = createMCPServer({
	name: 'task-views',
	version: '1.0.0',
	tools: [showTasksViewTool, showTaskViewTool],
	resources: [viewResource('tasks-list-view', TASKS_LIST_UI_URI), viewResource('task-detail-view', TASK_DETAIL_UI_URI)],
})

/**
 * Client for `chat({ mcp })`. Discovery reads `_meta.ui.resourceUri` off the
 * server tools. The fetch stays in this process and calls the same server
 * the `/api/mcp` route serves.
 */
export function connectTaskViewsMcp() {
	return createMCPClient({
		name: 'task-views-host',
		transport: {
			type: 'http',
			url: TASK_VIEWS_MCP_URL,
			fetch: (input, init) => taskViewsMcpServer.fetch(new Request(input, init)),
		},
	})
}
