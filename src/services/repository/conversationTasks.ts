/**
 * Tasks the conversation already returned.
 *
 * The seed repository keeps its array in the process that handled the write.
 * A later request, including the detail read after a card click, can run in
 * another process and would otherwise report the new task as missing.
 * Replaying tool results restores those tasks before the next read.
 *
 * Supports TanStack UIMessage `parts` and AG-UI wire messages (`toolCalls` on
 * assistants + `{ role: 'tool' }` fan-out). `chatParamsFromRequest` drops
 * `parts`, so AG-UI fields are required after the AI 1.x migration.
 */

import { type TaskRepo, TaskRepoSchema } from '@/services/schemas/repository'

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
	if (Array.isArray(payload.updated)) return payload.updated.flatMap((item) => tasksInPayload(item))
	const candidate = 'task' in payload ? payload.task : payload
	const parsed = TaskRepoSchema.safeParse(candidate)
	return parsed.success ? [parsed.data] : []
}

function rememberToolCall(calls: Map<string, ToolCall>, id: string, name: string, input: unknown) {
	calls.set(id, { name, input })
}

function toolCalls(messages: unknown): Map<string, ToolCall> {
	const calls = new Map<string, ToolCall>()
	if (!Array.isArray(messages)) return calls
	for (const message of messages) {
		if (!isRecord(message)) continue
		if (Array.isArray(message.parts)) {
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
				rememberToolCall(calls, part.id, part.name, input)
			}
		}
		if (message.role === 'assistant' && Array.isArray(message.toolCalls)) {
			for (const call of message.toolCalls) {
				if (!isRecord(call) || typeof call.id !== 'string') continue
				const fn = isRecord(call.function) ? call.function : undefined
				const name = typeof fn?.name === 'string' ? fn.name : undefined
				if (!name) continue
				const input =
					typeof fn?.arguments === 'string'
						? parseJson(fn.arguments)
						: fn?.arguments !== undefined
							? fn.arguments
							: undefined
				rememberToolCall(calls, call.id, name, input)
			}
		}
	}
	return calls
}

function applyToolResult(
	tasks: Map<string, TaskRepo>,
	deleted: Set<string>,
	calls: Map<string, ToolCall>,
	toolCallId: string | undefined,
	content: unknown,
) {
	const call = typeof toolCallId === 'string' ? calls.get(toolCallId) : undefined
	const payload = payloadFromContent(content)
	if (call?.name === 'deleteTask' && !(isRecord(payload) && 'error' in payload)) {
		const taskId =
			isRecord(call.input) && typeof call.input.taskId === 'string' && call.input.taskId.length > 0
				? call.input.taskId
				: null
		if (!taskId) return
		tasks.delete(taskId)
		deleted.add(taskId)
		return
	}
	for (const task of tasksInPayload(payload)) {
		tasks.set(task.id, task)
		deleted.delete(task.id)
	}
}

export function conversationTaskState(messages: unknown): ConversationTaskState {
	const tasks = new Map<string, TaskRepo>()
	const deleted = new Set<string>()
	const calls = toolCalls(messages)
	if (!Array.isArray(messages)) return { tasks: [], deletedIds: [] }

	for (const message of messages) {
		if (!isRecord(message)) continue
		if (Array.isArray(message.parts)) {
			for (const part of message.parts) {
				if (!isRecord(part) || part.type !== 'tool-result') continue
				applyToolResult(
					tasks,
					deleted,
					calls,
					typeof part.toolCallId === 'string' ? part.toolCallId : undefined,
					part.content,
				)
			}
		}
		if (message.role === 'tool') {
			applyToolResult(
				tasks,
				deleted,
				calls,
				typeof message.toolCallId === 'string' ? message.toolCallId : undefined,
				message.content,
			)
		}
	}

	return { tasks: [...tasks.values()], deletedIds: [...deleted] }
}

export function findRememberedTask(messages: unknown, taskId: string): TaskRepo | null {
	const state = conversationTaskState(messages)
	return state.tasks.find((task) => task.id === taskId) ?? null
}
