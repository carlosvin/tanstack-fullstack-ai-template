/**
 * TanStack AI server tool definitions.
 * Each tool wraps a read-only repository method so the AI assistant can query data.
 *
 * Zod input schemas with .describe() annotations flow through to the LLM as
 * JSON Schema, giving the model rich context about each parameter.
 */
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import type { TaskFilter } from '../../types'
import { getReadRepository } from '../repository/getRepository'
import { TaskFilterSchema, TaskIdInputSchema } from '../schemas/schemas'

/**
 * Wraps a tool handler to catch errors and return them as a structured
 * message instead of crashing the AI agentic loop.
 */
function safeToolHandler<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
	return async (args: TArgs): Promise<TResult | { error: string }> => {
		try {
			return await fn(args)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred'
			return { error: message }
		}
	}
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const getTasksToolDef = toolDefinition({
	name: 'getTasks',
	description:
		'Get all tasks with optional filters. Supports filtering by status, priority, assignee, and full-text search.',
	inputSchema: TaskFilterSchema,
})

export const getTasksTool = getTasksToolDef.server(
	safeToolHandler((args) => getReadRepository().getTasks(args as TaskFilter)),
)

const getTaskToolDef = toolDefinition({
	name: 'getTask',
	description: 'Get a single task by its unique ID. Returns full task details including timestamps.',
	inputSchema: TaskIdInputSchema,
})

export const getTaskTool = getTaskToolDef.server(
	safeToolHandler((args) => getReadRepository().getTask((args as { taskId: string }).taskId)),
)

// ---------------------------------------------------------------------------
// Filters / Discovery
// ---------------------------------------------------------------------------

const getAssigneesToolDef = toolDefinition({
	name: 'getAssignees',
	description: 'Get all distinct assignee emails across all tasks. Useful for discovering who is working on tasks.',
	inputSchema: z.object({}),
})

export const getAssigneesTool = getAssigneesToolDef.server(safeToolHandler(() => getReadRepository().getAssignees()))
