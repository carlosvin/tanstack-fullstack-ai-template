import { describe, expect, it } from 'vitest'
import { authMiddleware } from '@/middleware/auth'
import { webEnvMiddleware } from '@/middleware/webEnv'

describe('webEnvMiddleware', () => {
	it('chains authMiddleware so auth and env share one request context', () => {
		expect(webEnvMiddleware.options.middleware).toEqual([authMiddleware])
	})
})
