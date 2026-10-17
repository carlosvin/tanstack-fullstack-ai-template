import { describe, expect, it } from 'vitest'
import {
	decodeMcpUiHtml,
	isAllowedMcpUiUri,
	MAX_MCP_UI_HTML_CHARS,
	TASK_DETAIL_UI_URI,
	TASKS_LIST_UI_URI,
} from './mcpUiResource'
import { assertMcpUiHtmlWithinCap, readMcpUiResource, registerRawHtmlView } from './mcpUiResources'

describe('mcpUiResource', () => {
	it('allowlists only ui:// task URIs', () => {
		expect(isAllowedMcpUiUri(TASKS_LIST_UI_URI)).toBe(true)
		expect(isAllowedMcpUiUri(TASK_DETAIL_UI_URI)).toBe(true)
		expect(isAllowedMcpUiUri('https://example.com')).toBe(false)
		expect(isAllowedMcpUiUri('ui://other/x')).toBe(false)
	})

	it('serves a registered raw document and refuses unknown URIs', async () => {
		expect(await readMcpUiResource('ui://other/x')).toEqual({ contents: [] })
		const html = '<!doctype html><html><body><p>Widget</p></body></html>'
		registerRawHtmlView(TASKS_LIST_UI_URI, html)
		const result = await readMcpUiResource(TASKS_LIST_UI_URI)
		expect(result.contents).toHaveLength(1)
		const content = result.contents[0]
		expect(content?.uri).toBe(TASKS_LIST_UI_URI)
		expect(content?.mimeType).toBe('text/html;profile=mcp-app')
		expect(
			content?.text
				? decodeMcpUiHtml({ uri: content.uri, mimeType: content.mimeType ?? '', text: content.text })
				: null,
		).toContain('Widget')
		expect(() => registerRawHtmlView('https://example.com', html)).toThrow(/non-allowlisted/)
	})

	it('rejects HTML payloads that exceed the size cap', () => {
		const oversized = `<!doctype html><html><body>${'x'.repeat(MAX_MCP_UI_HTML_CHARS)}</body></html>`
		expect(() => assertMcpUiHtmlWithinCap(oversized, TASKS_LIST_UI_URI)).toThrow(/exceeds/)
	})
})
