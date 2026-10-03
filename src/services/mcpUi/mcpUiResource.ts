/**
 * MCP UI resource wire format — client-safe validators.
 *
 * Mirrors the MCP Apps `UIResource` payload (`text/html;profile=mcp-app`)
 * without pulling server-only builders into the browser bundle.
 */

export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app'

/** Upper bound for sandboxed HTML payloads (characters). */
export const MAX_MCP_UI_HTML_CHARS = 60000

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
export function isAllowedMcpUiUri(uri: unknown): uri is string {
	if (typeof uri !== 'string') return false
	return ALLOWED_MCP_UI_URI_PREFIXES.some((prefix) => uri.startsWith(prefix))
}

/** Type guard for the MCP Apps UI resource wire shape. */
export function isMcpUiResource(value: unknown): value is McpUiResource {
	if (typeof value !== 'object' || value === null) return false
	const record = value as Record<string, unknown>
	if (record.type !== 'resource') return false
	const resource = record.resource as Record<string, unknown> | undefined
	if (typeof resource !== 'object' || resource === null) return false
	if (!isAllowedMcpUiUri(resource.uri)) return false
	if (resource.mimeType !== MCP_APP_MIME_TYPE) return false
	return typeof resource.text === 'string' || typeof resource.blob === 'string'
}

/** Scan an unknown tool output for an embedded MCP UI resource. */
export function findMcpUiResource(value: unknown): McpUiResource | null {
	if (isMcpUiResource(value)) return value
	if (typeof value !== 'object' || value === null) return null
	for (const entry of Object.values(value as Record<string, unknown>)) {
		if (isMcpUiResource(entry)) return entry
	}
	return null
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
