import { A2uiMessageProcessor, type ServerToClientMessage } from '@a2ui-bridge/core'
import { describe, expect, it } from 'vitest'
import type { Task } from '../schemas/schemas'
import { acceptA2uiMessages, buildTaskViewMessages, promptFromA2uiAction } from './taskViewMessages'

const task: Task = {
	id: 'task-1',
	title: 'Ship the report',
	description: 'Quarterly summary',
	status: 'pending',
	priority: 'high',
	assignee: 'ada@example.com',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
}

function visibleText(messages: ServerToClientMessage[]): string[] {
	const texts: string[] = []
	for (const message of messages) {
		const components = message.surfaceUpdate?.components
		if (!components) continue
		for (const instance of components) {
			if (!instance.component) continue
			for (const [type, body] of Object.entries(instance.component)) {
				if (type === 'Button' || typeof body !== 'object' || body === null || !('text' in body)) continue
				const text = body.text
				if (
					typeof text === 'object' &&
					text !== null &&
					'literalString' in text &&
					typeof text.literalString === 'string'
				) {
					texts.push(text.literalString)
				}
			}
		}
	}
	return texts
}

describe('buildTaskViewMessages', () => {
	it('builds a list surface from task data and hides the id', () => {
		const messages = buildTaskViewMessages({ tasks: [task] })
		const text = visibleText(messages).join(' ')
		expect(text).toContain('Ship the report')
		expect(text).toContain('pending')
		expect(text).toContain('high')
		expect(text).toContain('ada@example.com')
		expect(text).not.toContain('task-1')
		expect(JSON.stringify(messages)).toContain('open-task')
		expect(JSON.stringify(messages)).toContain('task-1')
	})

	it('draws a table when the payload asks for one', () => {
		const messages = buildTaskViewMessages({ tasks: [task], presentation: 'table' })
		const text = visibleText(messages).join(' ')
		expect(text).toContain('Ship the report')
		expect(text).toContain('Title')
		expect(text).toContain('Status')
		expect(text).not.toContain('task-1')
		const flat = JSON.stringify(messages)
		expect(flat).toContain('"appearance":"row"')
		expect(flat).not.toContain('"appearance":"card"')
		const processor = new A2uiMessageProcessor()
		expect(() => processor.processMessages(messages)).not.toThrow()
	})

	it('says when no rows match', () => {
		expect(visibleText(buildTaskViewMessages({ tasks: [] })).join(' ')).toContain('No tasks match')
	})

	it('builds a detail surface with a way back to the list', () => {
		const messages = buildTaskViewMessages(JSON.stringify({ task }))
		const text = visibleText(messages).join(' ')
		expect(text).toContain('Ship the report')
		expect(text).toContain('All tasks')
		expect(text).toContain('Quarterly summary')
		expect(text).not.toContain('task-1')
		const processor = new A2uiMessageProcessor()
		expect(() => processor.processMessages(messages)).not.toThrow()
		const tree = processor.getSurfaces().get('@default')?.componentTree
		expect(tree?.type).toBe('Card')
	})

	it('drops a component type outside the catalog', () => {
		const accepted = acceptA2uiMessages([
			{
				surfaceUpdate: {
					surfaceId: '@default',
					components: [
						{ id: 'root', component: { Column: { children: { explicitList: ['safe', 'evil'] } } } },
						{ id: 'safe', component: { Text: { text: { literalString: 'Safe title' }, usageHint: 'body' } } },
						{ id: 'evil', component: { NotAWidget: { text: { literalString: 'pwned' } } } },
					],
				},
			},
			{ beginRendering: { surfaceId: '@default', root: 'root' } },
		])
		const flat = JSON.stringify(accepted)
		expect(flat).toContain('Safe title')
		expect(flat).not.toContain('NotAWidget')
		expect(flat).not.toContain('pwned')
	})
})

describe('promptFromA2uiAction', () => {
	it('turns an open-task action into the detail prompt and ignores unknown names', () => {
		expect(
			promptFromA2uiAction({
				actionName: 'open-task',
				sourceComponentId: 't0',
				timestamp: '2026-01-01T00:00:00.000Z',
				context: { taskId: 'task-1', title: 'Ship the report' },
			}),
		).toBe('Open the detail view for Ship the report. The task id is task-1.')
		expect(
			promptFromA2uiAction({
				actionName: 'back-to-list',
				sourceComponentId: 'back',
				timestamp: '2026-01-01T00:00:00.000Z',
			}),
		).toBe('Show my tasks')
		expect(
			promptFromA2uiAction({
				actionName: 'submit',
				sourceComponentId: 'x',
				timestamp: '2026-01-01T00:00:00.000Z',
			}),
		).toBeNull()
	})
})
