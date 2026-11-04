import { describe, expect, it } from 'vitest'
import { applySeedConversation } from '@/services/ai/seedConversation.server'
import { conversationTaskState, findRememberedTask } from '@/services/repository/conversationTasks'
import { SeedRepository } from '@/services/repository/seedRepository'

const created = {
	id: 'task-7',
	title: 'Fix timeline display issue',
	description: 'The timeline view is not displaying correctly.',
	status: 'pending',
	priority: 'high',
	createdAt: '2026-10-12T20:00:00.000Z',
	updatedAt: '2026-10-12T20:00:00.000Z',
	createdBy: 'ada@example.com',
}

const seedOnly = {
	id: 'task-1',
	title: 'Set up project repository',
	description: 'Initialize the Git repository.',
	status: 'done',
	priority: 'high',
	assignee: 'alice@example.com',
	createdAt: '2025-01-15T09:00:00.000Z',
	updatedAt: '2025-01-16T14:30:00.000Z',
}

function call(id: string, name: string, input: unknown) {
	return { type: 'tool-call', id, name, input, arguments: JSON.stringify(input), state: 'output-available' }
}

function result(toolCallId: string, payload: unknown) {
	return { type: 'tool-result', toolCallId, content: JSON.stringify(payload), state: 'output-available' }
}

function thread(parts: unknown[]) {
	return [{ id: 'm1', role: 'assistant', parts }]
}

describe('conversationTaskState', () => {
	it('keeps a created task when a later list from a fresh process omits it', () => {
		const messages = thread([
			call('create', 'createTask', { title: created.title }),
			result('create', { task: created, message: 'Task created.' }),
			call('list', 'showTasksView', {}),
			result('list', { tasks: [seedOnly], presentation: 'cards' }),
		])
		const state = conversationTaskState(messages)
		expect(state.tasks.map((task) => task.id)).toEqual(['task-7', 'task-1'])
		expect(findRememberedTask(messages, 'task-7')?.title).toBe('Fix timeline display issue')
	})

	it('drops a deleted task and ignores a failed delete', () => {
		const createdThread = thread([
			call('create', 'createTask', { title: created.title }),
			result('create', { task: created }),
			call('fail', 'deleteTask', { taskId: 'task-7' }),
			result('fail', { error: 'Task not found.', code: 404 }),
		])
		expect(conversationTaskState(createdThread).deletedIds).toEqual([])
		expect(findRememberedTask(createdThread, 'task-7')?.id).toBe('task-7')

		const deleted = thread([
			call('create', 'createTask', { title: created.title }),
			result('create', { task: created }),
			call('delete', 'deleteTask', { taskId: 'task-7' }),
			result('delete', { message: 'Task deleted.' }),
		])
		const state = conversationTaskState(deleted)
		expect(state.tasks).toEqual([])
		expect(state.deletedIds).toEqual(['task-7'])
		expect(findRememberedTask(deleted, 'task-7')).toBeNull()
	})
})

describe('SeedRepository conversation replay', () => {
	it('finds a task created in another process after the conversation is replayed', async () => {
		const fresh = new SeedRepository()
		expect(await fresh.getTask(created.id)).toBeNull()
		const messages = thread([
			call('list', 'showTasksView', {}),
			result('list', { tasks: [created], presentation: 'cards' }),
		])
		await applySeedConversation(fresh, messages)
		expect((await fresh.getTask(created.id))?.title).toBe(created.title)
		const next = await fresh.createTask({ title: 'Another', status: 'pending', priority: 'low' })
		expect(next.id).not.toBe(created.id)
	})
})
