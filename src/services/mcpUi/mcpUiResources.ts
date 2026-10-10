/**
 * Registered MCP Apps view resources.
 *
 * Raw HTML documents still use the MCP Apps pattern: link a tool with
 * `_meta.ui.resourceUri` and serve the document from `resources/read`.
 * Task list and detail views are A2UI surfaces, so this registry starts empty.
 */

import { createUIResource } from '@mcp-ui/server'
import { isAllowedMcpUiUri, MAX_MCP_UI_HTML_CHARS, type McpUiResource } from './mcpUiResource'

export { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from './mcpUiResource'

/** @internal Used by unit tests to verify the HTML size cap. */
export function assertMcpUiHtmlWithinCap(htmlString: string, uri: string): void {
	if (htmlString.length > MAX_MCP_UI_HTML_CHARS) {
		throw new Error(`MCP UI HTML exceeds ${MAX_MCP_UI_HTML_CHARS} characters for ${uri}`)
	}
}

/** Register one raw HTML document. Refuses a non-allowlisted URI or an oversized document. */
export function registerRawHtmlView(uri: string, htmlString: string): McpUiResource {
	if (!isAllowedMcpUiUri(uri)) {
		throw new Error(`Refusing to register MCP UI resource for non-allowlisted URI: ${uri}`)
	}
	assertMcpUiHtmlWithinCap(htmlString, uri)
	const resource = createUIResource({
		uri,
		content: { type: 'rawHtml', htmlString },
		encoding: 'text',
	})
	views.set(uri, resource)
	return resource
}

const views = new Map<string, McpUiResource>()

/** `resources/read` for a registered raw document. Unknown URIs return no contents. */
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
