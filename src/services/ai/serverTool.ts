import { HttpError } from '../../utils/httpError'

/** Structured error shape returned to the AI when a tool call fails. */
export type ToolErrorResult = {
	error: string
	code?: number
}

/** Discriminated union: either the successful result or a structured error. */
export type SafeToolResult<T> = T | ToolErrorResult

/**
 * Wraps an async tool handler so that thrown HttpErrors (and unexpected errors)
 * are caught and returned as `{ error, code }` instead of propagating.
 * This lets the AI interpret failures (401, 403, 404) and respond helpfully.
 */
export function safeToolHandler<TArgs, TResult>(
	execute: (args: TArgs, context?: unknown) => Promise<TResult> | TResult,
): (args: TArgs, context?: unknown) => Promise<SafeToolResult<TResult>> {
	return async (args: TArgs, context?: unknown) => {
		try {
			return await execute(args, context)
		} catch (err) {
			if (err instanceof HttpError) {
				return { error: err.message, code: err.statusCode }
			}

			const message = err instanceof Error ? err.message : 'An unexpected error occurred'
			return { error: message }
		}
	}
}

/**
 * Convenience factory: creates a server-side AI tool from a `toolDefinition`
 * and an execution function, wrapping both in `safeToolHandler` for error safety.
 */
export function createSafeServerTool<TArgs, TServerTool>(
	tool: {
		server: (execute: (args: TArgs, context?: unknown) => Promise<unknown> | unknown) => TServerTool
	},
	execute: (args: TArgs, context?: unknown) => Promise<unknown> | unknown,
): TServerTool {
	return tool.server(safeToolHandler(execute))
}
