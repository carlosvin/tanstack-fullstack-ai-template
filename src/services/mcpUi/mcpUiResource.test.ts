import { describe, expect, it } from 'vitest'
import type { Task } from '../schemas/schemas'
import {
	decodeMcpUiHtml,
	findMcpUiResource,
	isAllowedMcpUiUri,
	isMcpUiResource,
	MAX_MCP_UI_HTML_CHARS,
} from './mcpUiResource'
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
		expect(isAllowedMcpUiUri(undefined)).toBe(false)
	})

	it('builds a tasks view resource with escaped HTML', () => {
		const resource = createTasksViewResource([task])
		expect(isMcpUiResource(resource)).toBe(true)
		expect(resource.resource.uri).toBe('ui://tasks/list')
		expect(resource.resource.mimeType).toBe('text/html;profile=mcp-app')
		const html = decodeMcpUiHtml(resource.resource)
		expect(html).toContain('Write &lt;docs&gt;')
		expect(html).not.toContain('Write <docs>')
		expect(html).toContain('/mcp-app.js')
		expect(html).toContain('sendMessage')
	})

	it('emits a ui-resource event and skips a context that cannot emit', () => {
		const resource = createTasksViewResource([task])
		const events: unknown[] = []
		emitMcpUiResource(
			{
				emitCustomEvent: (name: string, value: unknown) => {
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
		expect(isMcpUiResource(resource)).toBe(true)
		expect(resource.resource.uri).toBe('ui://task/detail-abc123')
	})

	it('rejects HTML payloads that exceed the size cap', () => {
		const oversized = `<!doctype html><html><body>${'x'.repeat(MAX_MCP_UI_HTML_CHARS)}</body></html>`
		expect(() => assertMcpUiHtmlWithinCap(oversized, 'ui://tasks/list')).toThrow(/exceeds/)
	})

	it('finds embedded resources in tool outputs and rejects bad MIME types', () => {
		const resource = createTasksViewResource([task])
		expect(findMcpUiResource({ tasks: [task], ui: resource })).toEqual(resource)
		expect(findMcpUiResource({ tasks: [] })).toBeNull()
		expect(
			isMcpUiResource({
				type: 'resource',
				resource: { uri: 'ui://tasks/list', mimeType: 'text/html', text: '<p>x</p>' },
			}),
		).toBe(false)
	})
})
