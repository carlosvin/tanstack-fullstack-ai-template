/**
 * Deterministic A2UI documents for agentic task views.
 *
 * Tools return task data only. The shell builds these messages and validates
 * them before `Surface` renders. People-facing text never includes a task id.
 */

import type { ServerToClientMessage, UserAction } from '@a2ui-bridge/core'
import { z } from 'zod'
import { TASK_STATUSES } from '../../constants/options'
import { statusLabel } from '../../utils/taskDisplay'
import { type Task, TaskSchema, type TaskStatus, TaskStatusSchema } from '../schemas/schemas'
import { isAllowedA2uiComponent } from './mantineCatalog'

const MAX_TASKS = 20
const MAX_TITLE = 120
const MAX_DESCRIPTION = 2000
const MAX_BADGE = 40
const SURFACE_ID = '@default'
/** Private-use mark. Component ids start with it, and every other string has it removed. */
const ID_MARK = '\uE000'

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

function stripIdMark(value: unknown): unknown {
	if (typeof value === 'string') return value.replaceAll(ID_MARK, '')
	if (Array.isArray(value)) return value.map(stripIdMark)
	if (typeof value === 'object' && value !== null) {
		const next: Record<string, unknown> = {}
		for (const [key, item] of Object.entries(value)) next[key] = stripIdMark(item)
		return next
	}
	return value
}

/**
 * The processor treats any string equal to a component id as a child, including
 * text inside `literalString`. Ids use a private-use prefix that literals cannot contain.
 */
function sealComponentIds(components: ComponentInstance[]): { components: ComponentInstance[]; rootId: string } {
	const ids = new Map(components.map((instance, index) => [instance.id, `${ID_MARK}${index}`]))
	const ref = (id: string) => ids.get(id) ?? id
	const sealed = components.map((instance) => {
		const type = Object.keys(instance.component)[0]
		const body = type ? instance.component[type] : undefined
		if (!type || typeof body !== 'object' || body === null || Array.isArray(body)) {
			return { id: ref(instance.id), component: instance.component }
		}
		const next: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(body)) {
			if (key === 'child' && typeof value === 'string') {
				next.child = ref(value)
			} else if (
				key === 'children' &&
				typeof value === 'object' &&
				value !== null &&
				'explicitList' in value &&
				Array.isArray(value.explicitList)
			) {
				next.children = {
					explicitList: value.explicitList.map((id: unknown) => (typeof id === 'string' ? ref(id) : id)),
				}
			} else {
				next[key] = stripIdMark(value)
			}
		}
		return { id: ref(instance.id), component: { [type]: next } }
	})
	return { components: sealed, rootId: ref('root') }
}

function messages(components: ComponentInstance[]): ServerToClientMessage[] {
	const sealed = sealComponentIds(components)
	return acceptA2uiMessages([
		{
			surfaceUpdate: { surfaceId: SURFACE_ID, components: sealed.components },
		},
		{
			beginRendering: { surfaceId: SURFACE_ID, root: sealed.rootId },
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

function dueLabel(task: Task, asOf?: string): string | null {
	if (!task.dueDate) return null
	const overdue = Boolean(asOf && task.dueDate < asOf && task.status !== 'done' && task.status !== 'cancelled')
	return overdue ? `Overdue ${task.dueDate}` : `Due ${task.dueDate}`
}

function selectButton(task: Task, index: number, selected: boolean): ComponentInstance[] {
	const id = `t${index}-select`
	return [
		{
			id,
			component: {
				Button: {
					child: `${id}-label`,
					action: {
						name: 'toggle-select',
						context: [
							{ key: 'taskId', value: { literalString: clip(task.id, 80) } },
							{ key: 'title', value: { literalString: clip(task.title, MAX_TITLE) } },
						],
					},
				},
			},
		},
		textNode(`${id}-label`, `${selected ? 'Selected' : 'Select'} ${clip(task.title, 60)}`, 'caption', 80),
	]
}

const BULK_STATUSES = [
	['pending', 'Mark selected pending'],
	['in-progress', 'Mark selected in progress'],
	['done', 'Mark selected done'],
	['cancelled', 'Mark selected cancelled'],
] as const

function bulkActions(): { ids: string[]; nodes: ComponentInstance[] } {
	const ids = BULK_STATUSES.map(([status]) => `bulk-${status}`)
	const nodes: ComponentInstance[] = [{ id: 'bulk', component: { Row: { children: { explicitList: ids } } } }]
	for (const [status, label] of BULK_STATUSES) {
		nodes.push(
			{
				id: `bulk-${status}`,
				component: {
					Button: {
						child: `bulk-${status}-label`,
						action: {
							name: 'mark-selected',
							context: [{ key: 'status', value: { literalString: status } }],
						},
					},
				},
			},
			textNode(`bulk-${status}-label`, label, 'caption', 40),
		)
	}
	return { ids: ['bulk'], nodes }
}

function listCard(task: Task, index: number, asOf: string | undefined, selectedIds: readonly string[]) {
	const base = `t${index}`
	const badgeIds = [`${base}-status`, `${base}-priority`]
	const due = dueLabel(task, asOf)
	if (due) badgeIds.push(`${base}-due`)
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
		...(due ? [badgeNode(`${base}-due`, due, due.startsWith('Overdue') ? 'red' : 'gray')] : []),
		...(task.assignee ? [badgeNode(`${base}-assignee`, task.assignee, 'gray')] : []),
		...selectButton(task, index, selectedIds.includes(task.id)),
	]
	return { rootId: base, selectId: `${base}-select`, nodes }
}

function listMessages(
	tasks: Task[],
	asOf: string | undefined,
	selectedIds: readonly string[],
): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading']
	const nodes: ComponentInstance[] = [titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`)]
	if (shown.length > 0) {
		const bulk = bulkActions()
		childIds.push(...bulk.ids)
		nodes.push(...bulk.nodes)
	}
	if (shown.length === 0) {
		childIds.push('empty-title', 'empty-note')
		nodes.push(
			textNode('empty-title', 'No tasks match', 'h3', MAX_TITLE),
			textNode('empty-note', 'Try another filter, or ask to see every task.', 'body'),
		)
	}
	for (const [index, task] of shown.entries()) {
		const card = listCard(task, index, asOf, selectedIds)
		childIds.push(card.rootId, card.selectId)
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

function tableCell(id: string, text: string, header = false): ComponentInstance[] {
	return [
		{
			id,
			component: {
				[header ? 'TableHeaderCell' : 'TableCell']: { child: `${id}-text` },
			},
		},
		textNode(`${id}-text`, text, header ? 'caption' : 'body', header ? MAX_BADGE : MAX_TITLE),
	]
}

function tableRow(task: Task, index: number, asOf: string | undefined, selectedIds: readonly string[]) {
	const base = `t${index}`
	const cellIds = [
		`${base}-title`,
		`${base}-due`,
		`${base}-status`,
		`${base}-priority`,
		`${base}-assignee`,
		`${base}-pick`,
	]
	const nodes: ComponentInstance[] = [
		{ id: base, component: { TableRow: { children: { explicitList: cellIds } } } },
		{
			id: `${base}-title`,
			component: { TableCell: { child: `${base}-open` } },
		},
		{
			id: `${base}-open`,
			component: {
				Button: {
					child: `${base}-label`,
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
		textNode(`${base}-label`, task.title, 'body', MAX_TITLE),
		...tableCell(`${base}-due`, dueLabel(task, asOf) ?? '—'),
		...tableCell(`${base}-status`, task.status),
		...tableCell(`${base}-priority`, task.priority),
		...tableCell(`${base}-assignee`, task.assignee ?? '—'),
		{
			id: `${base}-pick`,
			component: { TableCell: { child: `t${index}-select` } },
		},
		...selectButton(task, index, selectedIds.includes(task.id)),
	]
	return { rootId: base, nodes }
}

function tableMessages(
	tasks: Task[],
	asOf: string | undefined,
	selectedIds: readonly string[],
): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading', 'table']
	const nodes: ComponentInstance[] = [
		titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`),
		{
			id: 'table',
			component: { Table: { children: { explicitList: ['thead', 'tbody'] } } },
		},
		{
			id: 'thead',
			component: {
				TableHead: {
					children: { explicitList: ['h-title', 'h-due', 'h-status', 'h-priority', 'h-assignee', 'h-select'] },
				},
			},
		},
		...tableCell('h-title', 'Title', true),
		...tableCell('h-due', 'Due', true),
		...tableCell('h-status', 'Status', true),
		...tableCell('h-priority', 'Priority', true),
		...tableCell('h-assignee', 'Assignee', true),
		...tableCell('h-select', 'Select', true),
		{ id: 'tbody', component: { TableBody: { children: { explicitList: [] } } } },
	]
	const bodyIds: string[] = []
	if (shown.length === 0) {
		childIds.push('empty-title', 'empty-note')
		nodes.push(
			textNode('empty-title', 'No tasks match', 'h3', MAX_TITLE),
			textNode('empty-note', 'Try another filter, or ask to see every task.', 'body'),
		)
	}
	for (const [index, task] of shown.entries()) {
		const row = tableRow(task, index, asOf, selectedIds)
		bodyIds.push(row.rootId)
		nodes.push(...row.nodes)
	}
	const body = nodes.find((node) => node.id === 'tbody')
	if (body) body.component = { TableBody: { children: { explicitList: bodyIds } } }
	if (tasks.length > shown.length) {
		childIds.push('overflow')
		nodes.push(
			textNode('overflow', `Showing ${shown.length} of ${tasks.length}. Ask for a narrower filter.`, 'caption'),
		)
	}
	if (shown.length > 0) {
		const bulk = bulkActions()
		childIds.push(...bulk.ids)
		nodes.push(...bulk.nodes)
	}
	return messages([{ id: 'root', component: { Column: { children: { explicitList: childIds } } } }, ...nodes])
}

function appendCards(
	tasks: Task[],
	startIndex: number,
	asOf: string | undefined,
	selectedIds: readonly string[],
	childIds: string[],
	nodes: ComponentInstance[],
): number {
	let index = startIndex
	for (const task of tasks) {
		const card = listCard(task, index, asOf, selectedIds)
		childIds.push(card.rootId, card.selectId)
		nodes.push(...card.nodes)
		index += 1
	}
	return index
}

function kanbanMessages(
	tasks: Task[],
	asOf: string | undefined,
	selectedIds: readonly string[],
): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading']
	const nodes: ComponentInstance[] = [titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`)]
	if (shown.length > 0) {
		const bulk = bulkActions()
		childIds.push(...bulk.ids)
		nodes.push(...bulk.nodes)
	}
	childIds.push('board')
	const laneIds = TASK_STATUSES.map((status) => `lane-${status}`)
	nodes.push({
		id: 'board',
		component: { Row: { children: { explicitList: laneIds }, distribution: 'board' } },
	})
	let index = 0
	for (const status of TASK_STATUSES) {
		const laneId = `lane-${status}`
		const laneTasks = shown.filter((task) => task.status === status)
		const laneChildIds = [`${laneId}-title`]
		const laneNodes: ComponentInstance[] = [titleNode(`${laneId}-title`, statusLabel(status))]
		if (laneTasks.length === 0) {
			laneChildIds.push(`${laneId}-empty`)
			laneNodes.push(textNode(`${laneId}-empty`, 'None', 'caption', 20))
		}
		index = appendCards(laneTasks, index, asOf, selectedIds, laneChildIds, laneNodes)
		nodes.push(
			{
				id: laneId,
				component: { Column: { children: { explicitList: laneChildIds }, distribution: 'lane' } },
			},
			...laneNodes,
		)
	}
	if (tasks.length > shown.length) {
		childIds.push('overflow')
		nodes.push(
			textNode('overflow', `Showing ${shown.length} of ${tasks.length}. Ask for a narrower filter.`, 'caption'),
		)
	}
	return messages([{ id: 'root', component: { Column: { children: { explicitList: childIds } } } }, ...nodes])
}

function timelineGroups(tasks: Task[]): Array<{ dueDate: string | null; tasks: Task[] }> {
	const sorted = [...tasks].sort((a, b) => {
		if (a.dueDate === b.dueDate) return 0
		if (!a.dueDate) return 1
		if (!b.dueDate) return -1
		return a.dueDate < b.dueDate ? -1 : 1
	})
	const groups: Array<{ dueDate: string | null; tasks: Task[] }> = []
	for (const task of sorted) {
		const dueDate = task.dueDate ?? null
		const last = groups.at(-1)
		if (last && last.dueDate === dueDate) last.tasks.push(task)
		else groups.push({ dueDate, tasks: [task] })
	}
	return groups
}

function timelineHeading(dueDate: string | null, group: Task[], asOf?: string): string {
	if (!dueDate) return 'No due date'
	const open = group.some((task) => task.status !== 'done' && task.status !== 'cancelled')
	return asOf && dueDate < asOf && open ? `Overdue ${dueDate}` : `Due ${dueDate}`
}

function timelineMessages(
	tasks: Task[],
	asOf: string | undefined,
	selectedIds: readonly string[],
): ServerToClientMessage[] {
	const shown = tasks.slice(0, MAX_TASKS)
	const childIds = ['heading']
	const nodes: ComponentInstance[] = [titleNode('heading', tasks.length === 1 ? '1 task' : `${tasks.length} tasks`)]
	if (shown.length > 0) {
		const bulk = bulkActions()
		childIds.push(...bulk.ids)
		nodes.push(...bulk.nodes)
		const groups = timelineGroups(shown)
		const itemIds = groups.map((_, index) => `day-${index}`)
		childIds.push('timeline')
		nodes.push({
			id: 'timeline',
			component: { Timeline: { children: { explicitList: itemIds } } },
		})
		let index = 0
		for (const [groupIndex, group] of groups.entries()) {
			const itemId = `day-${groupIndex}`
			const bodyId = `${itemId}-body`
			const bodyIds: string[] = []
			const bodyNodes: ComponentInstance[] = []
			index = appendCards(group.tasks, index, asOf, selectedIds, bodyIds, bodyNodes)
			nodes.push(
				{
					id: itemId,
					component: {
						TimelineItem: {
							title: { literalString: timelineHeading(group.dueDate, group.tasks, asOf) },
							child: bodyId,
						},
					},
				},
				{ id: bodyId, component: { Column: { children: { explicitList: bodyIds } } } },
				...bodyNodes,
			)
		}
	} else {
		childIds.push('empty-title', 'empty-note')
		nodes.push(
			textNode('empty-title', 'No tasks match', 'h3', MAX_TITLE),
			textNode('empty-note', 'Try another filter, or ask to see every task.', 'body'),
		)
	}
	if (tasks.length > shown.length) {
		childIds.push('overflow')
		nodes.push(
			textNode('overflow', `Showing ${shown.length} of ${tasks.length}. Ask for a narrower filter.`, 'caption'),
		)
	}
	return messages([{ id: 'root', component: { Column: { children: { explicitList: childIds } } } }, ...nodes])
}

function detailMessages(task: Task, asOf?: string): ServerToClientMessage[] {
	const due = dueLabel(task, asOf)
	const badgeIds = ['status', 'priority']
	if (due) badgeIds.push('due')
	if (task.assignee) badgeIds.push('assignee')
	const bodyIds = ['title', 'badges', 'description', 'back']
	const nodes: ComponentInstance[] = [
		{ id: 'root', component: { Card: { child: 'detail' } } },
		{ id: 'detail', component: { Column: { children: { explicitList: bodyIds } } } },
		textNode('title', task.title, 'h3', MAX_TITLE),
		{ id: 'badges', component: { Row: { children: { explicitList: badgeIds } } } },
		badgeNode('status', task.status, statusColor(task.status)),
		badgeNode('priority', task.priority, priorityColor(task.priority)),
		...(due ? [badgeNode('due', due, due.startsWith('Overdue') ? 'red' : 'gray')] : []),
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

function readAsOf(data: object): string | undefined {
	if (!('asOf' in data) || typeof data.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.asOf)) return undefined
	return data.asOf
}

export function buildTaskViewMessages(payload: unknown, selectedIds: readonly string[] = []): ServerToClientMessage[] {
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
		const presentation =
			'presentation' in data &&
			(data.presentation === 'table' || data.presentation === 'kanban' || data.presentation === 'timeline')
				? data.presentation
				: 'cards'
		const asOf = readAsOf(data)
		if (presentation === 'table') return tableMessages(tasks, asOf, selectedIds)
		if (presentation === 'kanban') return kanbanMessages(tasks, asOf, selectedIds)
		if (presentation === 'timeline') return timelineMessages(tasks, asOf, selectedIds)
		return listMessages(tasks, asOf, selectedIds)
	}
	if ('task' in data) {
		const parsed = TaskSchema.safeParse(data.task)
		if (!parsed.success) return note('This view has no data yet.')
		return detailMessages(parsed.data, readAsOf(data))
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

export type TaskViewIntent =
	| { kind: 'prompt'; text: string }
	| { kind: 'toggle'; taskId: string }
	| { kind: 'mark-selected'; status: TaskStatus }
	| { kind: 'ignore' }

function contextString(action: UserAction, key: string): string | null {
	const value = action.context?.[key]
	return typeof value === 'string' && value.length > 0 ? value : null
}

/** Catalog clicks: open and back become prompts. Select stays in the host. */
export function taskViewIntent(action: UserAction): TaskViewIntent {
	if (action.actionName === 'toggle-select') {
		const taskId = contextString(action, 'taskId')
		return taskId ? { kind: 'toggle', taskId } : { kind: 'ignore' }
	}
	if (action.actionName === 'mark-selected') {
		const parsed = TaskStatusSchema.safeParse(contextString(action, 'status'))
		return parsed.success ? { kind: 'mark-selected', status: parsed.data } : { kind: 'ignore' }
	}
	const text = promptFromA2uiAction(action)
	return text ? { kind: 'prompt', text } : { kind: 'ignore' }
}

/** Follow-up the model turns into updateTasksStatus. Empty selection sends nothing. */
export function bulkStatusPrompt(payload: unknown, selectedIds: readonly string[], status: TaskStatus): string | null {
	let data: unknown = payload
	if (typeof payload === 'string') {
		try {
			data = JSON.parse(payload)
		} catch {
			return null
		}
	}
	if (typeof data !== 'object' || data === null || !('tasks' in data)) return null
	const tasks = parseTasks(data.tasks)
	if (!tasks) return null
	const chosen = tasks.filter((task) => selectedIds.includes(task.id))
	if (chosen.length === 0) return null
	const titles = chosen.map((task) => clip(task.title, 80)).join(', ')
	const ids = chosen.map((task) => clip(task.id, 80)).join(', ')
	return `Set the status of these tasks to ${status}: ${titles}. Task ids: ${ids}.`
}
