import { describe, expect, it } from 'vitest'
import { authMiddleware } from './middleware/auth'
import { webEnvMiddleware } from './middleware/webEnv'
import { startInstance } from './start'

describe('startInstance', () => {
	it('registers a single global middleware that chains auth then public env', async () => {
		const options = await startInstance.getOptions()

		expect(options.requestMiddleware).toEqual([webEnvMiddleware])
		expect(webEnvMiddleware.options.middleware).toEqual([authMiddleware])
	})
})
