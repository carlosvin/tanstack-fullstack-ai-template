import { describe, expect, it } from 'vitest'
import { authMiddleware } from './auth'
import { webEnvMiddleware } from './webEnv'

describe('webEnvMiddleware', () => {
	it('chains authMiddleware so auth and env share one request context', () => {
		expect(webEnvMiddleware.options.middleware).toEqual([authMiddleware])
	})
})
