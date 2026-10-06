import { describe, expect, it } from 'vitest'
import { TASK_DETAIL_UI_URI, TASKS_LIST_UI_URI } from '../mcpUi/mcpUiResource'
import { connectTaskViewsMcp, withoutDemoAssignee } from './taskViewsMcp.server'

describe('task views MCP server', () => {
	it('discovers view tools with a ui resource URI and reads the document', async () => {
		const client = await connectTaskViewsMcp()
		try {
			const tools = await client.tools()
			const names = tools.map((tool) => tool.name).sort()
			expect(names).toEqual(['showTaskView', 'showTasksView'])

			const list = tools.find((tool) => tool.name === 'showTasksView')
			const detail = tools.find((tool) => tool.name === 'showTaskView')
			expect(list?.metadata?.mcp).toMatchObject({
				uiResourceUri: TASKS_LIST_UI_URI,
				serverToolName: 'showTasksView',
			})
			expect(detail?.metadata?.mcp).toMatchObject({
				uiResourceUri: TASK_DETAIL_UI_URI,
				serverToolName: 'showTaskView',
			})
			expect(list?.metadata?.mcp).not.toHaveProperty('readResource')

			const resource = await client.readResource(TASKS_LIST_UI_URI)
			const content = resource.contents[0]
			expect(content?.mimeType).toBe('text/html;profile=mcp-app')
			expect(content && 'text' in content ? content.text : '').toContain('/mcp-task-view.js')
			expect(content && 'text' in content ? content.text : '').not.toContain('__VIEW_DATA__')
		} finally {
			await client.close()
		}
	})

	it('drops a demo visitor email from the task list filter', () => {
		expect(withoutDemoAssignee({ assignee: 'random3a8cba9a@example.com', status: 'pending' })).toEqual({
			status: 'pending',
		})
		expect(withoutDemoAssignee({ assignee: 'alice@example.com' })).toEqual({ assignee: 'alice@example.com' })
	})
})
