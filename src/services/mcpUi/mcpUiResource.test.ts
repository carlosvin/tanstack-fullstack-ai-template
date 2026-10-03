import { describe, expect, it } from 'vitest'
import type { Task } from '../schemas/schemas'
import { decodeMcpUiHtml, findMcpUiResource, isAllowedMcpUiUri, isMcpUiResource } from './mcpUiResource'
import { createTasksViewResource, createTaskViewResource } from './mcpUiResources'

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
	})

	it('builds a task detail resource with an allowlisted detail URI', () => {
		const resource = createTaskViewResource(task)
		expect(isMcpUiResource(resource)).toBe(true)
		expect(resource.resource.uri).toBe('ui://task/detail-abc123')
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
