import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
	decodeMcpUiHtml,
	isAllowedMcpUiUri,
	MAX_MCP_UI_HTML_CHARS,
	TASK_DETAIL_UI_URI,
	TASKS_LIST_UI_URI,
} from './mcpUiResource'
import { assertMcpUiHtmlWithinCap, readMcpUiResource } from './mcpUiResources'

describe('mcpUiResource', () => {
	it('allowlists only ui:// task URIs', () => {
		expect(isAllowedMcpUiUri(TASKS_LIST_UI_URI)).toBe(true)
		expect(isAllowedMcpUiUri(TASK_DETAIL_UI_URI)).toBe(true)
		expect(isAllowedMcpUiUri('https://example.com')).toBe(false)
		expect(isAllowedMcpUiUri('ui://other/x')).toBe(false)
	})

	it('serves the static view shell from resources/read', async () => {
		const result = await readMcpUiResource(TASKS_LIST_UI_URI)
		expect(result.contents).toHaveLength(1)
		const [content] = result.contents
		expect(content?.uri).toBe(TASKS_LIST_UI_URI)
		expect(content?.mimeType).toBe('text/html;profile=mcp-app')
		const html =
			content?.mimeType && content.text !== undefined
				? decodeMcpUiHtml({ uri: content.uri, mimeType: content.mimeType, text: content.text, blob: content.blob })
				: null
		expect(html).toContain('/mcp-task-view.js')
		expect(html).not.toContain('__VIEW_DATA__')
		expect(html).not.toContain('id="view-data"')

		const detail = await readMcpUiResource(TASK_DETAIL_UI_URI)
		expect(detail.contents[0]?.uri).toBe(TASK_DETAIL_UI_URI)
		expect(await readMcpUiResource('ui://other/x')).toEqual({ contents: [] })

		const guest = readFileSync(path.join(process.cwd(), 'public/mcp-task-view.js'), 'utf8')
		expect(guest).toContain('/mcp-app.js')
		expect(guest).toContain('ontoolresult')
		expect(guest).toContain('sendMessage')
		expect(guest).toContain('textContent')
		expect(guest).not.toContain('view-data')
	})

	it('rejects HTML payloads that exceed the size cap', () => {
		const oversized = `<!doctype html><html><body>${'x'.repeat(MAX_MCP_UI_HTML_CHARS)}</body></html>`
		expect(() => assertMcpUiHtmlWithinCap(oversized, TASKS_LIST_UI_URI)).toThrow(/exceeds/)
	})
})
