import { afterEach, describe, expect, it, vi } from 'vitest'

describe('webEnv lazy parsing', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it('reads env vars that appear after module import', async () => {
		const { getWebServerEnv } = await import('./webEnv')
		vi.stubEnv('GEMINI_API_KEY', 'late-bound-key')
		expect(getWebServerEnv().GEMINI_API_KEY).toBe('late-bound-key')
	})
})
