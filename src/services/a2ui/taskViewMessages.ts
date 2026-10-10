/**
 * Deterministic A2UI documents for agentic task views.
 *
 * Tools return task data only. The shell builds these messages and validates
 * them before `Surface` renders. People-facing text never includes a task id.
 */

import type { ServerToClientMessage, UserAction } from '@a2ui-bridge/core'
import { z } from 'zod'
import { type Task, TaskSchema } from '../schemas/schemas'
import { isAllowedA2uiComponent } from './mantineCatalog'

const MAX_TASKS = 20
const MAX_TITLE = 120
const MAX_DESCRIPTION = 2000
const MAX_BADGE = 40
const SURFACE_ID = '@default'

const ComponentInstanceSchema = z
	.object({
		id: z.string().min(1).max(80),
		component: z.record(z.string(), z.unknown()),
	})
	.strict()

const A2uiMessageSchema = z
	.object({
		beginRendering: z
			.object({
				surfaceId: z.string().min(1).max(40),
				root: z.string().min(1).max(80),
			})
			.strict()
			.optional(),
		surfaceUpdate: z
			.object({
				surfaceId: z.string().min(1).max(40),
				components: z.array(ComponentInstanceSchema).max(400),
			})
			.strict()
			.optional(),
	})
	.strict()

const A2uiMessageListSchema = z.array(A2uiMessageSchema).max(4)

type ComponentInstance = z.infer<typeof ComponentInstanceSchema>

function clip(value: string, max: number): string {
	if (value.length <= max) return value
	return `${value.slice(0, max - 1)}…`
}

function textNode(id: string, text: string, usageHint: 'h3' | 'body' | 'caption', max = MAX_DESCRIPTION) {
	return {
		id,
		component: {
			Text: {
				text: { literalString: clip(text, max) },
				usageHint,
			},
		},
	}
}

function titleNode(id: string, text: string) {
	return {
		id,
		component: {
			Title: {
				text: { literalString: clip(text, MAX_TITLE) },
			},
		},
	}
}

function badgeNode(id: string, text: string, color: string) {
	return {
		id,
		component: {
			Badge: {
				text: { literalString: clip(text, MAX_BADGE) },
				color,
			},
		},
	}
}

function statusColor(status: string): string {
	switch (status) {
		case 'pending':
			return 'yellow'
		case 'in-progress':
			return 'blue'
		case 'done':
			return 'green'
		case 'cancelled':
			return 'gray'
		default:
			return 'gray'
	}
}

function priorityColor(priority: string): string {
	switch (priority) {
		case 'low':
			return 'gray'
		case 'medium':
			return 'blue'
		case 'high':
			return 'orange'
		case 'critical':
			return 'red'
		default:
			return 'gray'
	}
}

function componentBody(instance: ComponentInstance): Record<string, unknown> | null {
	const keys = Object.keys(instance.component)
	if (keys.length !== 1) return null
	const type = keys[0]
	if (!type || !isAllowedA2uiComponent(type)) return null
	const body = instance.component[type]
	if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
	return body as Record<string, unknown>
}

function referencedIds(instance: ComponentInstance): string[] {
	const body = componentBody(instance)
	if (!body) return []
	const ids: string[] = []
	if (typeof body.child === 'string') ids.push(body.child)
	const children = body.children
	if (typeof children === 'object' && children !== null && 'explicitList' in children) {
		const list = children.explicitList
		if (Array.isArray(list)) {
			for (const id of list) {
				if (typeof id === 'string') ids.push(id)
			}
		}
	}
	return ids
}

function withoutMissingRefs(instance: ComponentInstance, ids: Set<string>): ComponentInstance | null {
	const keys = Object.keys(instance.component)
	const type = keys[0]
	if (!type) return null
	const body = componentBody(instance)
	if (!body) return null
	if (typeof body.child === 'string' && !ids.has(body.child)) return null
	const children = body.children
	if (
		typeof children === 'object' &&
		children !== null &&
		'explicitList' in children &&
		Array.isArray(children.explicitList)
	) {
		const explicitList = children.explicitList.filter((id): id is string => typeof id === 'string' && ids.has(id))
		return {
			...instance,
			component: {
				[type]: { ...body, children: { explicitList } },
			},
		}
	}
	return instance
}

/** Drop component types outside the Mantine catalog, then drop dangling child ids. */
export function acceptA2uiMessages(input: unknown): ServerToClientMessage[] {
	const messages = A2uiMessageListSchema.parse(input)
	return messages.map((message) => {
		if (!message.surfaceUpdate) return message
		let components = message.surfaceUpdate.components.filter((instance) => componentBody(instance) !== null)
		let changed = true
		while (changed) {
			changed = false
			const ids = new Set(components.map((instance) => instance.id))
			const next: ComponentInstance[] = []
			for (const instance of components) {
				const cleaned = withoutMissingRefs(instance, ids)
				if (!cleaned) {
					changed = true
					continue
				}
				if (referencedIds(cleaned).join() !== referencedIds(instance).join()) changed = true
				next.push(cleaned)
			}
			components = next
		}
		return {
			...message,
			surfaceUpdate: { ...message.surfaceUpdate, components },
		}
	})
}

function messages(components: ComponentInstance[]): ServerToClientMessage[] {
	return acceptA2uiMessages([
		{
			surfaceUpdate: { surfaceId: SURFACE_ID, components },
		},
		{
			beginRendering: { surfaceId: SURFACE_ID, root: 'root' },
		},
	])
}

function note(text: string): ServerToClientMessage[] {
	return messages([
		{
			id: 'root',
			component: { Column: { children: { explicitList: ['note'] } } },
		},
		textNode('note', text, 'body'),
	])
}

function listCard(task: Task, index: number) {
	const base = `t${index}`
	const badgeIds = [`${base}-status`, `${base}-priority`]
	if (task.assignee) badgeIds.push(`${base}-assignee`)
	const bodyIds = [`${base}-title`]
	if (task.description) bodyIds.push(`${base}-desc`)
	bodyIds.push(`${base}-badges`)
	const nodes: ComponentInstance[] = [
		{
			id: base,
			component: {
				Button: {
					child: `${base}-body`,
					appearance: 'card',
					action: {
						name: 'open-task',
						context: [
							{ key: 'taskId', value: { literalString: clip(task.id, 80) } },
							{ key: 'title', value: { literalString: clip(task.title, MAX_TITLE) } },
						],
					},
				},
			},
		},
		{
			id: `${base}-body`,
			component: { Column: { children: { explicitList: bodyIds } } },
		},
		textNode(`${base}-title`, task.title, 'h3', MAX_TITLE),
		...(task.description ? [textNode(`${base}-desc`, task.description, 'caption', 140)] : []),
		{
			id: `${base}-badges`,
			component: { Row: { children: { explicitList: badgeIds } } },
		},
		badgeNode(`${base}-status`, task.status, statusColor(task.status)),
		badgeNode(`${base}-priority`, task.priority, priorityColor(task.priority)),
		...(task.assignee ? [badgeNode(`${base}-assignee`, task.assignee, 'gray')] : []),
	]
	return { rootId: base, nodes }
}

function listMessages(tasks: Task[]): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading']
	const nodes: ComponentInstance[] = [titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`)]
	if (shown.length === 0) {
		childIds.push('empty-title', 'empty-note')
		nodes.push(
			textNode('empty-title', 'No tasks match', 'h3', MAX_TITLE),
			textNode('empty-note', 'Try another filter, or ask to see every task.', 'body'),
		)
	}
	for (const [index, task] of shown.entries()) {
		const card = listCard(task, index)
		childIds.push(card.rootId)
		nodes.push(...card.nodes)
	}
	if (tasks.length > shown.length) {
		childIds.push('overflow')
		nodes.push(
			textNode('overflow', `Showing ${shown.length} of ${tasks.length}. Ask for a narrower filter.`, 'caption'),
		)
	}
	return messages([{ id: 'root', component: { Column: { children: { explicitList: childIds } } } }, ...nodes])
}

function tableRow(task: Task, index: number) {
	const base = `t${index}`
	const cellIds = [`${base}-title`, `${base}-status`, `${base}-priority`, `${base}-assignee`]
	const nodes: ComponentInstance[] = [
		{
			id: base,
			component: {
				Button: {
					child: `${base}-cells`,
					appearance: 'row',
					action: {
						name: 'open-task',
						context: [
							{ key: 'taskId', value: { literalString: clip(task.id, 80) } },
							{ key: 'title', value: { literalString: clip(task.title, MAX_TITLE) } },
						],
					},
				},
			},
		},
		{ id: `${base}-cells`, component: { Row: { children: { explicitList: cellIds } } } },
		textNode(`${base}-title`, task.title, 'body', MAX_TITLE),
		textNode(`${base}-status`, task.status, 'caption', MAX_BADGE),
		textNode(`${base}-priority`, task.priority, 'caption', MAX_BADGE),
		textNode(`${base}-assignee`, task.assignee ?? '—', 'caption', MAX_BADGE),
	]
	return { rootId: base, nodes }
}

function tableMessages(tasks: Task[]): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading', 'header']
	const nodes: ComponentInstance[] = [
		titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`),
		{
			id: 'header',
			component: { Row: { children: { explicitList: ['h-title', 'h-status', 'h-priority', 'h-assignee'] } } },
		},
		textNode('h-title', 'Title', 'caption', MAX_BADGE),
		textNode('h-status', 'Status', 'caption', MAX_BADGE),
		textNode('h-priority', 'Priority', 'caption', MAX_BADGE),
		textNode('h-assignee', 'Assignee', 'caption', MAX_BADGE),
	]
	if (shown.length === 0) {
		childIds.push('empty-title', 'empty-note')
		nodes.push(
			textNode('empty-title', 'No tasks match', 'h3', MAX_TITLE),
			textNode('empty-note', 'Try another filter, or ask to see every task.', 'body'),
		)
	}
	for (const [index, task] of shown.entries()) {
		const row = tableRow(task, index)
		childIds.push(row.rootId)
		nodes.push(...row.nodes)
	}
	return messages([{ id: 'root', component: { Column: { children: { explicitList: childIds } } } }, ...nodes])
}

function detailMessages(task: Task): ServerToClientMessage[] {
	// Component ids must not match bare string props (usageHint "body", colors, "card").
	// The processor treats any string equal to a component id as a child reference.
	const badgeIds = ['status', 'priority']
	if (task.assignee) badgeIds.push('assignee')
	const bodyIds = ['title', 'badges', 'description', 'back']
	const nodes: ComponentInstance[] = [
		{ id: 'root', component: { Card: { child: 'detail' } } },
		{ id: 'detail', component: { Column: { children: { explicitList: bodyIds } } } },
		textNode('title', task.title, 'h3', MAX_TITLE),
		{ id: 'badges', component: { Row: { children: { explicitList: badgeIds } } } },
		badgeNode('status', task.status, statusColor(task.status)),
		badgeNode('priority', task.priority, priorityColor(task.priority)),
		...(task.assignee ? [badgeNode('assignee', task.assignee, 'gray')] : []),
		textNode('description', task.description || 'No description.', 'body'),
		{
			id: 'back',
			component: {
				Button: {
					child: 'back-label',
					action: { name: 'back-to-list' },
				},
			},
		},
		textNode('back-label', 'All tasks', 'body', 40),
	]
	return messages(nodes)
}

function parseTasks(value: unknown): Task[] | null {
	if (!Array.isArray(value)) return null
	const tasks: Task[] = []
	for (const item of value) {
		const parsed = TaskSchema.safeParse(item)
		if (parsed.success) tasks.push(parsed.data)
	}
	return tasks
}

export function buildTaskViewMessages(payload: unknown): ServerToClientMessage[] {
	let data: unknown = payload
	if (typeof payload === 'string') {
		try {
			data = JSON.parse(payload)
		} catch {
			return note('This view has no data yet.')
		}
	}
	if (typeof data !== 'object' || data === null) return note('This view has no data yet.')
	if ('error' in data && typeof data.error === 'string') return note(clip(data.error, 240))
	if ('tasks' in data) {
		const tasks = parseTasks(data.tasks)
		if (!tasks) return note('This view has no data yet.')
		const presentation = 'presentation' in data && data.presentation === 'table' ? 'table' : 'cards'
		return presentation === 'table' ? tableMessages(tasks) : listMessages(tasks)
	}
	if ('task' in data) {
		const parsed = TaskSchema.safeParse(data.task)
		if (!parsed.success) return note('This view has no data yet.')
		return detailMessages(parsed.data)
	}
	return note('This view has no data yet.')
}

/** Map a catalog action to the next prompt. Unknown names are ignored. */
export function promptFromA2uiAction(action: UserAction): string | null {
	if (action.actionName === 'back-to-list') return 'Show my tasks'
	if (action.actionName !== 'open-task') return null
	const taskId = action.context?.taskId
	if (typeof taskId !== 'string' || taskId.length === 0) return null
	const title =
		typeof action.context?.title === 'string' && action.context.title.length > 0 ? action.context.title : 'Task'
	return `Open the detail view for ${title}. The task id is ${taskId}.`
}
