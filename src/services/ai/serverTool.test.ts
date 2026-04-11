import { describe, expect, it } from 'vitest'
import { HttpError } from '../../utils/httpError'
import { createSafeServerTool, safeToolHandler } from './serverTool'

describe('safeToolHandler', () => {
	it('returns successful handler results unchanged', async () => {
		const handler = safeToolHandler(async ({ value }: { value: number }) => ({ doubled: value * 2 }))

		await expect(handler({ value: 2 })).resolves.toEqual({ doubled: 4 })
	})

	it('converts HttpError into a structured tool error', async () => {
		const handler = safeToolHandler(async () => {
			throw new HttpError(403, 'Forbidden')
		})

		await expect(handler({})).resolves.toEqual({ error: 'Forbidden', code: 403 })
	})

	it('converts unexpected errors into a generic structured tool error', async () => {
		const handler = safeToolHandler(async () => {
			throw new Error('Boom')
		})

		await expect(handler({})).resolves.toEqual({ error: 'Boom' })
	})
})

describe('createSafeServerTool', () => {
	it('wraps tool execution with structured error handling', async () => {
		const def = {
			server: (execute: (args: { taskId: string }) => Promise<unknown> | unknown) => ({ execute }),
		}

		const tool = createSafeServerTool(def, async (args: unknown) => {
			const { taskId } = args as { taskId: string }

			if (taskId === 'missing') {
				throw new HttpError(404, 'Task not found')
			}

			return { taskId }
		})

		await expect(tool.execute?.({ taskId: 'missing' })).resolves.toEqual({
			error: 'Task not found',
			code: 404,
		})
	})
})
