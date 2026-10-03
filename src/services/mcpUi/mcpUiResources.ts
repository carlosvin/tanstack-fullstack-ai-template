/**
 * MCP UI view resources for the agentic shell.
 *
 * The document shell lives in `views/task-view.html`. Tool handlers fill
 * `__VIEW_DATA__` with JSON and wrap the result with `createUIResource`.
 * The guest writes repository text with `textContent`, so this module does
 * not assemble HTML from task fields.
 */

import { createUIResource } from '@mcp-ui/server'
import type { ToolExecutionContext } from '@tanstack/ai'
import type { Task } from '../schemas/schemas'
import { isAllowedMcpUiUri, MAX_MCP_UI_HTML_CHARS, type McpUiResource } from './mcpUiResource'
import taskViewHtml from './views/task-view.html?raw'

const MAX_TASKS_PER_VIEW = 20
const MAX_TITLE_CHARS = 200
const MAX_DESCRIPTION_CHARS = 2_000
const VIEW_DATA_SLOT = '__VIEW_DATA__'

interface TaskCardData {
	id: string
	title: string
	status: string
	priority: string
	assignee?: string
}

interface TasksViewData {
	view: 'tasks'
	total: number
	tasks: TaskCardData[]
}

interface TaskDetailData extends TaskCardData {
	description: string
	createdAt: string
	updatedAt: string
}

interface TaskViewData {
	view: 'task'
	task: TaskDetailData
}

function truncatePlain(value: string, max: number): string {
	if (value.length <= max) return value
	return `${value.slice(0, max - 1)}…`
}

function cardData(task: Task): TaskCardData {
	return {
		id: task.id,
		title: truncatePlain(task.title, MAX_TITLE_CHARS),
		status: task.status,
		priority: task.priority,
		...(task.assignee ? { assignee: truncatePlain(task.assignee, MAX_TITLE_CHARS) } : {}),
	}
}

/** JSON embedded in HTML. `<` is escaped so the payload cannot close the script. */
function embedViewData(data: TasksViewData | TaskViewData): string {
	const json = JSON.stringify(data).replaceAll('<', '\\u003c')
	if (!taskViewHtml.includes(VIEW_DATA_SLOT)) {
		throw new Error('Task view template is missing the view-data slot')
	}
	return taskViewHtml.replace(VIEW_DATA_SLOT, json)
}

/** @internal Used by unit tests to verify the HTML size cap. */
export function assertMcpUiHtmlWithinCap(htmlString: string, uri: string): void {
	if (htmlString.length > MAX_MCP_UI_HTML_CHARS) {
		throw new Error(`MCP UI HTML exceeds ${MAX_MCP_UI_HTML_CHARS} characters for ${uri}`)
	}
}

function toResource(uri: `ui://${string}`, htmlString: string): McpUiResource {
	if (!isAllowedMcpUiUri(uri)) {
		throw new Error(`Refusing to build MCP UI resource for non-allowlisted URI: ${uri}`)
	}
	assertMcpUiHtmlWithinCap(htmlString, uri)
	return createUIResource({
		uri,
		content: { type: 'rawHtml', htmlString },
		encoding: 'text',
	})
}

/**
 * Emit the MCP Apps `ui-resource` custom event from a tool execute context.
 * TanStack AI turns that event into a `UIResourcePart` on the assistant message.
 * The HTML stays out of the model-facing tool result.
 */
export function emitMcpUiResource(
	context: ToolExecutionContext | undefined,
	toolName: string,
	resource: McpUiResource,
): void {
	context?.emitCustomEvent('ui-resource', {
		resource: {
			uri: resource.resource.uri,
			mimeType: resource.resource.mimeType,
			text: resource.resource.text,
			blob: resource.resource.blob,
		},
		toolName,
	})
}

/** Task list view for the `showTasksView` tool. */
export function createTasksViewResource(tasks: Task[]): McpUiResource {
	const shown = tasks.slice(0, MAX_TASKS_PER_VIEW)
	const htmlString = embedViewData({
		view: 'tasks',
		total: tasks.length,
		tasks: shown.map(cardData),
	})
	return toResource('ui://tasks/list', htmlString)
}

/** Task detail view for the `showTaskView` tool. */
export function createTaskViewResource(task: Task): McpUiResource {
	const htmlString = embedViewData({
		view: 'task',
		task: {
			...cardData(task),
			description: truncatePlain(task.description ?? 'No description.', MAX_DESCRIPTION_CHARS),
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
		},
	})
	return toResource(`ui://task/detail-${task.id}`, htmlString)
}
