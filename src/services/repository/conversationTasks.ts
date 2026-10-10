/**
 * Tasks the conversation already returned.
 *
 * The seed repository keeps its array in the process that handled the write.
 * A later request, including the detail read after a card click, can run in
 * another process and would otherwise report the new task as missing.
 * Replaying tool results restores those tasks before the next read.
 */

import { type TaskRepo, TaskRepoSchema } from '../schemas/repository'

export interface ConversationTaskState {
	tasks: TaskRepo[]
	deletedIds: string[]
}

interface ToolCall {
	name: string
	input: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch {
		return undefined
	}
}

function payloadFromContent(content: unknown): unknown {
	if (typeof content === 'string') return parseJson(content)
	if (!Array.isArray(content)) return content
	const text = content
		.map((block) => (isRecord(block) && typeof block.content === 'string' ? block.content : ''))
		.join('')
	return text ? parseJson(text) : undefined
}

function tasksInPayload(payload: unknown): TaskRepo[] {
	if (Array.isArray(payload)) return payload.flatMap((item) => tasksInPayload(item))
	if (!isRecord(payload) || 'error' in payload) return []
	if (Array.isArray(payload.tasks)) return payload.tasks.flatMap((item) => tasksInPayload(item))
	const candidate = 'task' in payload ? payload.task : payload
	const parsed = TaskRepoSchema.safeParse(candidate)
	return parsed.success ? [parsed.data] : []
}

function toolCalls(messages: unknown): Map<string, ToolCall> {
	const calls = new Map<string, ToolCall>()
	if (!Array.isArray(messages)) return calls
	for (const message of messages) {
		if (!isRecord(message) || !Array.isArray(message.parts)) continue
		for (const part of message.parts) {
			if (
				!isRecord(part) ||
				part.type !== 'tool-call' ||
				typeof part.id !== 'string' ||
				typeof part.name !== 'string'
			) {
				continue
			}
			const input =
				part.input !== undefined
					? part.input
					: typeof part.arguments === 'string'
						? parseJson(part.arguments)
						: undefined
			calls.set(part.id, { name: part.name, input })
		}
	}
	return calls
}

function taskIdFromInput(input: unknown): string | null {
	if (!isRecord(input) || typeof input.taskId !== 'string' || input.taskId.length === 0) return null
	return input.taskId
}

/** Fold create, update, list, and delete tool results into the tasks still in the thread. */
export function conversationTaskState(messages: unknown): ConversationTaskState {
	const tasks = new Map<string, TaskRepo>()
	const deleted = new Set<string>()
	const calls = toolCalls(messages)
	if (!Array.isArray(messages)) return { tasks: [], deletedIds: [] }

	for (const message of messages) {
		if (!isRecord(message) || !Array.isArray(message.parts)) continue
		for (const part of message.parts) {
			if (!isRecord(part) || part.type !== 'tool-result') continue
			const call = typeof part.toolCallId === 'string' ? calls.get(part.toolCallId) : undefined
			const payload = payloadFromContent(part.content)
			if (call?.name === 'deleteTask' && !(isRecord(payload) && 'error' in payload)) {
				const taskId = taskIdFromInput(call.input)
				if (!taskId) continue
				tasks.delete(taskId)
				deleted.add(taskId)
				continue
			}
			for (const task of tasksInPayload(payload)) {
				tasks.set(task.id, task)
				deleted.delete(task.id)
			}
		}
	}

	return { tasks: [...tasks.values()], deletedIds: [...deleted] }
}

/** Task from an earlier tool result, when the thread still contains it. */
export function findRememberedTask(messages: unknown, taskId: string): TaskRepo | null {
	const state = conversationTaskState(messages)
	return state.tasks.find((task) => task.id === taskId) ?? null
}
