/**
 * Registered MCP Apps view resources.
 *
 * The recommended MCP Apps pattern links a tool with `_meta.ui.resourceUri`
 * and serves the document from `resources/read`. Task data stays in the tool
 * result. The guest paints it with `textContent` after `toolresult`.
 */

import { createUIResource } from '@mcp-ui/server'
import {
	isAllowedMcpUiUri,
	MAX_MCP_UI_HTML_CHARS,
	type McpUiResource,
	TASK_DETAIL_UI_URI,
	TASKS_LIST_UI_URI,
} from './mcpUiResource'
import taskViewHtml from './views/task-view.html?raw'

export { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI }

/** @internal Used by unit tests to verify the HTML size cap. */
export function assertMcpUiHtmlWithinCap(htmlString: string, uri: string): void {
	if (htmlString.length > MAX_MCP_UI_HTML_CHARS) {
		throw new Error(`MCP UI HTML exceeds ${MAX_MCP_UI_HTML_CHARS} characters for ${uri}`)
	}
}

function registerView(uri: typeof TASKS_LIST_UI_URI | typeof TASK_DETAIL_UI_URI): McpUiResource {
	if (!isAllowedMcpUiUri(uri)) {
		throw new Error(`Refusing to register MCP UI resource for non-allowlisted URI: ${uri}`)
	}
	assertMcpUiHtmlWithinCap(taskViewHtml, uri)
	return createUIResource({
		uri,
		content: { type: 'rawHtml', htmlString: taskViewHtml },
		encoding: 'text',
	})
}

const views = new Map<string, McpUiResource>([
	[TASKS_LIST_UI_URI, registerView(TASKS_LIST_UI_URI)],
	[TASK_DETAIL_UI_URI, registerView(TASK_DETAIL_UI_URI)],
])

/** `resources/read` for a registered view. Unknown URIs return no contents. */
export function readMcpUiResource(uri: string): Promise<{
	contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>
}> {
	const resource = isAllowedMcpUiUri(uri) ? views.get(uri) : undefined
	if (!resource) return Promise.resolve({ contents: [] })
	return Promise.resolve({
		contents: [
			{
				uri: resource.resource.uri,
				mimeType: resource.resource.mimeType,
				text: resource.resource.text,
				blob: resource.resource.blob,
			},
		],
	})
}

/** Tool metadata: `_meta.ui.resourceUri` plus the host `resources/read` binding. */
export function mcpAppToolMetadata(uri: string, toolName: string) {
	return {
		_meta: { ui: { resourceUri: uri } },
		mcp: {
			uiResourceUri: uri,
			serverToolName: toolName,
			readResource: readMcpUiResource,
		},
	}
}
