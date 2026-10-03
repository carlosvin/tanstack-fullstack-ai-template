import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Task } from '../schemas/schemas'
import { decodeMcpUiHtml, isAllowedMcpUiUri, MAX_MCP_UI_HTML_CHARS } from './mcpUiResource'
import {
	assertMcpUiHtmlWithinCap,
	createTasksViewResource,
	createTaskViewResource,
	emitMcpUiResource,
} from './mcpUiResources'

const task = {
	id: 'abc123',
	title: 'Write <docs>',
	description: 'Details & more',
	status: 'pending',
	priority: 'high',
	assignee: 'ada@example.com',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
	createdBy: 'ada@example.com',
} as Task

describe('mcpUiResource', () => {
	it('allowlists only ui:// task URIs', () => {
		expect(isAllowedMcpUiUri('ui://tasks/list')).toBe(true)
		expect(isAllowedMcpUiUri('ui://task/detail-abc')).toBe(true)
		expect(isAllowedMcpUiUri('https://example.com')).toBe(false)
		expect(isAllowedMcpUiUri('ui://other/x')).toBe(false)
	})

	it('builds a tasks view from the shared template and JSON task data', () => {
		const resource = createTasksViewResource([task])
		expect(resource.type).toBe('resource')
		expect(resource.resource.uri).toBe('ui://tasks/list')
		expect(resource.resource.mimeType).toBe('text/html;profile=mcp-app')
		const html = decodeMcpUiHtml(resource.resource)
		expect(html).toContain('id="view-data"')
		expect(html).toContain('/mcp-task-view.js')
		expect(html).toContain('Write \\u003cdocs>')
		expect(html).not.toContain('Write <docs>')
		const guest = readFileSync(path.join(process.cwd(), 'public/mcp-task-view.js'), 'utf8')
		expect(guest).toContain('/mcp-app.js')
		expect(guest).toContain('sendMessage')
		expect(guest).toContain('textContent')
	})

	it('emits a ui-resource event and skips a context that cannot emit', () => {
		const resource = createTasksViewResource([task])
		const events: Array<{ name: string; value: unknown }> = []
		emitMcpUiResource(
			{
				emitCustomEvent: (name, value) => {
					events.push({ name, value })
				},
			},
			'showTasksView',
			resource,
		)
		expect(events).toEqual([
			{
				name: 'ui-resource',
				value: {
					resource: {
						uri: 'ui://tasks/list',
						mimeType: 'text/html;profile=mcp-app',
						text: resource.resource.text,
						blob: resource.resource.blob,
					},
					toolName: 'showTasksView',
				},
			},
		])
		expect(() => emitMcpUiResource(undefined, 'showTasksView', resource)).not.toThrow()
	})

	it('builds a task detail resource with an allowlisted detail URI', () => {
		const resource = createTaskViewResource(task)
		expect(resource.resource.uri).toBe('ui://task/detail-abc123')
		const html = decodeMcpUiHtml(resource.resource)
		expect(html).toContain('Details & more')
		expect(html).toContain('"view":"task"')
	})

	it('rejects HTML payloads that exceed the size cap', () => {
		const oversized = `<!doctype html><html><body>${'x'.repeat(MAX_MCP_UI_HTML_CHARS)}</body></html>`
		expect(() => assertMcpUiHtmlWithinCap(oversized, 'ui://tasks/list')).toThrow(/exceeds/)
	})
})
