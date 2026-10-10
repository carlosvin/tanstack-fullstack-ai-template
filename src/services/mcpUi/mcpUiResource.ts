/**
 * MCP UI resource wire format — client-safe helpers.
 *
 * Mirrors the MCP Apps `UIResource` payload (`text/html;profile=mcp-app`)
 * without pulling server-only builders into the browser bundle.
 */

export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app'

/** Upper bound for sandboxed HTML payloads (characters). */
export const MAX_MCP_UI_HTML_CHARS = 60000

export const TASKS_LIST_UI_URI = 'ui://tasks/list'
export const TASK_DETAIL_UI_URI = 'ui://task/detail'

const ALLOWED_MCP_UI_URI_PREFIXES = ['ui://tasks/', 'ui://task/'] as const

export interface McpUiResourceContent {
	uri: string
	mimeType: string
	text?: string
	blob?: string
}

export interface McpUiResource {
	type: 'resource'
	resource: McpUiResourceContent
}

/** Allowlist for tool-linked UI resource URIs. */
export function isAllowedMcpUiUri(uri: string): uri is `ui://${string}` {
	return ALLOWED_MCP_UI_URI_PREFIXES.some((prefix) => uri.startsWith(prefix))
}

/** Decode resource HTML from `text` or base64 `blob`. Returns null when oversized. */
export function decodeMcpUiHtml(resource: McpUiResourceContent): string | null {
	let html: string | null = null
	if (typeof resource.text === 'string') {
		html = resource.text
	} else if (typeof resource.blob === 'string') {
		try {
			html = atob(resource.blob)
		} catch {
			return null
		}
	}
	if (html === null || html.length > MAX_MCP_UI_HTML_CHARS) return null
	return html
}
