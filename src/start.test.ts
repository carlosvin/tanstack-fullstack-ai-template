import { describe, expect, it } from 'vitest'
import { authMiddleware } from './middleware/auth'
import { webEnvMiddleware } from './middleware/webEnv'
import { startInstance } from './start'

describe('startInstance', () => {
	it('registers auth and public env middleware globally', async () => {
		const options = await startInstance.getOptions()

		expect(options.requestMiddleware).toEqual(expect.arrayContaining([authMiddleware, webEnvMiddleware]))
	})
})
