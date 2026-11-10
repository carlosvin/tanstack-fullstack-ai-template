import { A2uiMessageProcessor, type ServerToClientMessage } from '@a2ui-bridge/core'
import { describe, expect, it } from 'vitest'
import {
	acceptA2uiMessages,
	buildTaskViewMessages,
	bulkStatusPrompt,
	promptFromA2uiAction,
	taskViewIntent,
} from '@/services/a2ui/taskViewMessages'
import type { Task } from '@/services/schemas/schemas'

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
		expect(flat).toContain('TableHeaderCell')
		expect(flat).not.toContain('"appearance":"card"')
		const processor = new A2uiMessageProcessor()
		expect(() => processor.processMessages(messages)).not.toThrow()
	})

	it('says when a table is only the first page of matches', () => {
		const tasks = Array.from({ length: 21 }, (_, index) => ({ ...task, id: `task-${index}`, title: `Task ${index}` }))
		expect(visibleText(buildTaskViewMessages({ tasks, presentation: 'table' })).join(' ')).toContain('Showing 20 of 21')
	})

	it('renders when task text matches a component id', () => {
		const colliding = { ...task, title: 'title', description: 'body', assignee: 'heading' }
		const messages = buildTaskViewMessages({ tasks: [colliding] })
		const text = visibleText(messages)
		expect(text).toContain('title')
		expect(text).toContain('body')
		expect(text).toContain('heading')
		const processor = new A2uiMessageProcessor()
		expect(() => processor.processMessages(messages)).not.toThrow()
	})

	it('shows a due date and a select control without a second open button', () => {
		const dated = { ...task, dueDate: '2026-10-01' }
		const text = visibleText(buildTaskViewMessages({ tasks: [dated], asOf: '2026-10-17' })).join(' ')
		expect(text).toContain('Overdue 2026-10-01')
		const detail = visibleText(buildTaskViewMessages({ task: dated }, [], '2026-10-17')).join(' ')
		expect(detail).toContain('Overdue 2026-10-01')
		expect(text).toContain('Select Ship the report')
		expect(text).toContain('Mark selected done')
		const selected = visibleText(buildTaskViewMessages({ tasks: [dated], asOf: '2026-10-17' }, ['task-1'])).join(' ')
		expect(selected).toContain('Selected Ship the report')
	})

	it('draws a kanban lane for each status', () => {
		const other = { ...task, id: 'task-2', title: 'File the notes', status: 'done' as const }
		const text = visibleText(buildTaskViewMessages({ tasks: [task, other], presentation: 'kanban' })).join(' ')
		expect(text).toContain('Pending')
		expect(text).toContain('In Progress')
		expect(text).toContain('Done')
		expect(text).toContain('Cancelled')
		expect(text).toContain('Ship the report')
		expect(text).toContain('File the notes')
		expect(text).toContain('None')
		expect(text).not.toContain('task-1')
		const processor = new A2uiMessageProcessor()
		expect(() =>
			processor.processMessages(buildTaskViewMessages({ tasks: [task], presentation: 'kanban' })),
		).not.toThrow()
	})

	it('draws a timeline with overdue dates before unscheduled tasks', () => {
		const later = { ...task, id: 'task-2', title: 'File the notes', dueDate: '2026-11-15', status: 'pending' as const }
		const dated = { ...task, dueDate: '2026-10-01' }
		const open = { ...task, id: 'task-3', title: 'Clear the inbox' }
		const flat = JSON.stringify(
			buildTaskViewMessages({ tasks: [open, later, dated], presentation: 'timeline', asOf: '2026-10-17' }),
		)
		expect(flat.indexOf('Overdue 2026-10-01')).toBeLessThan(flat.indexOf('Due 2026-11-15'))
		expect(flat.indexOf('Due 2026-11-15')).toBeLessThan(flat.indexOf('No due date'))
		expect(flat).toContain('Clear the inbox')
		expect(visibleText(buildTaskViewMessages({ tasks: [open], presentation: 'timeline' })).join(' ')).not.toContain(
			'task-3',
		)
		const processor = new A2uiMessageProcessor()
		expect(() =>
			processor.processMessages(
				buildTaskViewMessages({ tasks: [dated], presentation: 'timeline', asOf: '2026-10-17' }),
			),
		).not.toThrow()
	})

	it('draws totals and breakdown charts from the task counts', () => {
		const later = { ...task, id: 'task-2', title: 'File the notes', dueDate: '2026-11-15', status: 'done' as const }
		const messages = buildTaskViewMessages({
			tasks: [task, later],
			presentation: 'chart',
			asOf: '2026-10-17',
		})
		const text = visibleText(messages).join(' ')
		expect(text).toContain('2 tasks')
		expect(text).toContain('Status mix')
		expect(text).toContain('Priority')
		expect(text).toContain('Assignees')
		expect(text).toContain('Due dates')
		const flat = JSON.stringify(messages)
		expect(flat).toContain('StatCard')
		expect(flat).toContain('DistributionBar')
		expect(flat).toContain('DonutChart')
		expect(flat).toContain('BarChart')
		expect(flat).toContain('"base":{"literalNumber":1}')
		expect(flat).toContain('"sm":{"literalNumber":2}')
		expect(flat).toContain('ada@example.com')
		expect(flat).toContain('2026-11')
		expect(flat).not.toContain('Showing 20 of')
		const processor = new A2uiMessageProcessor()
		expect(() => processor.processMessages(messages)).not.toThrow()
	})

	it('charts every returned task instead of the 20-row page', () => {
		const tasks = Array.from({ length: 21 }, (_, index) => ({ ...task, id: `task-${index}`, title: `Task ${index}` }))
		const flat = JSON.stringify(buildTaskViewMessages({ tasks, presentation: 'chart' }))
		expect(flat).toContain('21 tasks')
		expect(flat).not.toContain('Showing 20 of 21')
	})

	it.each([1, 8, 9, 10])('preserves all task counts with %i assignees', (assignees) => {
		const tasks = Array.from({ length: assignees * 2 }, (_, index) => ({
			...task,
			id: `task-${index}`,
			assignee: `person-${Math.floor(index / 2)}@example.com`,
		}))
		const messages = buildTaskViewMessages({ tasks, presentation: 'chart' })
		const components = messages.flatMap((message) => message.surfaceUpdate?.components ?? [])
		const rows = Array.from({ length: Math.min(assignees, 8) }, (_, index) => ({
			name: { literalString: `person-${index}@example.com` },
			count: { literalNumber: 2 },
		}))
		if (assignees > 8) {
			rows.push({ name: { literalString: 'Other' }, count: { literalNumber: (assignees - 8) * 2 } })
		}
		expect(components.map((instance) => instance.component)).toContainEqual({
			BarChart: expect.objectContaining({ orientation: { literalString: 'vertical' }, data: rows }),
		})
	})

	it.each([
		{ asOf: undefined, fallbackAsOf: '2026-10-17', expected: '1' },
		{ asOf: '2026-09-30', fallbackAsOf: '2026-10-17', expected: '0' },
		{ asOf: undefined, fallbackAsOf: undefined, expected: '—' },
	])('uses the chart date with $asOf and fallback $fallbackAsOf', ({ asOf, fallbackAsOf, expected }) => {
		const messages = buildTaskViewMessages(
			{ tasks: [{ ...task, dueDate: '2026-10-01' }], presentation: 'chart', asOf },
			[],
			fallbackAsOf,
		)
		const components = messages.flatMap((message) => message.surfaceUpdate?.components ?? [])
		expect(components.map((instance) => instance.component)).toContainEqual({
			StatCard: expect.objectContaining({
				label: { literalString: 'Overdue' },
				value: { literalString: expected },
			}),
		})
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

	it('turns a selected set into one status prompt and ignores an empty set', () => {
		const payload = { tasks: [task] }
		expect(bulkStatusPrompt(payload, ['task-1'], 'done')).toBe(
			'Set the status of these tasks to done: Ship the report. Task ids: task-1.',
		)
		expect(bulkStatusPrompt(payload, [], 'done')).toBeNull()
		expect(
			taskViewIntent({
				actionName: 'mark-selected',
				sourceComponentId: 'bulk-done',
				timestamp: '2026-01-01T00:00:00.000Z',
				context: { status: 'done' },
			}),
		).toEqual({ kind: 'mark-selected', status: 'done' })
		expect(
			taskViewIntent({
				actionName: 'toggle-select',
				sourceComponentId: 't0-select',
				timestamp: '2026-01-01T00:00:00.000Z',
				context: { taskId: 'task-1' },
			}),
		).toEqual({ kind: 'toggle', taskId: 'task-1' })
	})
})
