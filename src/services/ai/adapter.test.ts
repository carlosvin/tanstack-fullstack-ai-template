import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getAIAdapterService', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.resetModules()
	})

	it('reports configured when GEMINI_API_KEY is present in webServerEnv', async () => {
		vi.stubEnv('GEMINI_API_KEY', 'test-key')
		const { getAIAdapterService } = await import('./adapter')
		expect(getAIAdapterService().isConfigured()).toBe(true)
	})

	it('reports configured when Azure OpenAI env vars are present', async () => {
		vi.stubEnv('AZURE_OPENAI_API_KEY', 'azure-key')
		vi.stubEnv('AZURE_OPENAI_ENDPOINT', 'https://example.openai.azure.com')
		const { getAIAdapterService } = await import('./adapter')
		expect(getAIAdapterService().isConfigured()).toBe(true)
	})

	it('reports not configured when no AI env vars are set', async () => {
		const { getAIAdapterService } = await import('./adapter')
		expect(getAIAdapterService().isConfigured()).toBe(false)
	})
})
