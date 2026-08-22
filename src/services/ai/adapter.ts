/**
 * AI adapter implementations for Google Gemini, OpenAI (incl. Netlify AI Gateway), and Azure OpenAI.
 *
 * The factory selects the adapter based on validated `getWebServerEnv()` (first match wins):
 *
 * 1. Google Gemini:
 *    - GEMINI_API_KEY        - API key (also accepts GOOGLE_API_KEY; Netlify gateway placeholder)
 *    - GEMINI_MODEL          - Model name (default: gemini-2.5-flash)
 *
 * 2. OpenAI / Netlify AI Gateway:
 *    - OPENAI_API_KEY        - API key (Netlify gateway auto-injects a placeholder)
 *    - OPENAI_BASE_URL       - Gateway endpoint when on Netlify
 *    - OPENAI_MODEL          - Model name (default: gpt-4o)
 *
 * 3. Azure OpenAI:
 *    - AZURE_OPENAI_API_KEY      - API key
 *    - AZURE_OPENAI_ENDPOINT     - Base URL (e.g. https://host/openai/v1)
 *    - AZURE_OPENAI_DEPLOYMENT   - Model name (default: gpt-4o)
 */

import type { GeminiTextModel } from '@tanstack/ai-gemini'
import { createGeminiChat } from '@tanstack/ai-gemini'
import type { OpenAIChatModel } from '@tanstack/ai-openai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { getWebServerEnv } from '../../env/webEnv.server'
import type { AIAdapterService } from './types'

function hasNetlifyAIGateway(env: ReturnType<typeof getWebServerEnv>): boolean {
	return Boolean(env.NETLIFY_AI_GATEWAY_KEY || env.NETLIFY_AI_GATEWAY_BASE_URL)
}

class GeminiAdapterService implements AIAdapterService {
	isConfigured(): boolean {
		const env = getWebServerEnv()
		return Boolean(env.GEMINI_API_KEY || env.GOOGLE_API_KEY)
	}

	getMissingConfigMessage(): string | null {
		if (this.isConfigured()) return null
		return 'Missing AI configuration: GEMINI_API_KEY (or GOOGLE_API_KEY)'
	}

	getAdapter() {
		const env = getWebServerEnv()
		const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
		if (!apiKey) return null

		const model = (env.GEMINI_MODEL || 'gemini-2.5-flash') as GeminiTextModel
		return createGeminiChat(model, apiKey)
	}
}

class OpenAIAdapterService implements AIAdapterService {
	isConfigured(): boolean {
		const env = getWebServerEnv()
		return Boolean(env.OPENAI_API_KEY || hasNetlifyAIGateway(env))
	}

	getMissingConfigMessage(): string | null {
		if (this.isConfigured()) return null
		return 'Missing AI configuration: OPENAI_API_KEY'
	}

	getAdapter() {
		const env = getWebServerEnv()
		const apiKey = env.OPENAI_API_KEY ?? env.NETLIFY_AI_GATEWAY_KEY
		if (!apiKey) return null

		const model = (env.OPENAI_MODEL || 'gpt-4o') as OpenAIChatModel
		const baseURL = env.OPENAI_BASE_URL ?? env.NETLIFY_AI_GATEWAY_BASE_URL
		return baseURL ? createOpenaiChat(model, apiKey, { baseURL }) : createOpenaiChat(model, apiKey)
	}
}

class AzureOpenAIAdapterService implements AIAdapterService {
	isConfigured(): boolean {
		const env = getWebServerEnv()
		return Boolean(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT)
	}

	getMissingConfigMessage(): string | null {
		const env = getWebServerEnv()
		const missing: string[] = []
		if (!env.AZURE_OPENAI_API_KEY) missing.push('AZURE_OPENAI_API_KEY')
		if (!env.AZURE_OPENAI_ENDPOINT) missing.push('AZURE_OPENAI_ENDPOINT')
		if (missing.length === 0) return null
		return `Missing AI configuration: ${missing.join(', ')}`
	}

	getAdapter() {
		const env = getWebServerEnv()
		const apiKey = env.AZURE_OPENAI_API_KEY
		const baseURL = env.AZURE_OPENAI_ENDPOINT
		if (!apiKey || !baseURL) return null

		const model = (env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o') as OpenAIChatModel
		return createOpenaiChat(model, apiKey, { baseURL, defaultHeaders: { 'api-key': apiKey } })
	}
}

let instance: AIAdapterService | null = null
let instanceKey: string | undefined

function adapterEnvKey(env: ReturnType<typeof getWebServerEnv>): string {
	return [
		env.GEMINI_API_KEY,
		env.GOOGLE_API_KEY,
		env.OPENAI_API_KEY,
		env.AZURE_OPENAI_API_KEY,
		env.NETLIFY_AI_GATEWAY_KEY,
	].join('|')
}

function resolveAdapterService(env: ReturnType<typeof getWebServerEnv>): AIAdapterService {
	if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) return new GeminiAdapterService()
	if (env.OPENAI_API_KEY || hasNetlifyAIGateway(env)) return new OpenAIAdapterService()
	return new AzureOpenAIAdapterService()
}

/** Returns the singleton AI adapter service. Priority: Gemini > OpenAI/Gateway > Azure. */
export function getAIAdapterService(): AIAdapterService {
	const env = getWebServerEnv()
	const key = adapterEnvKey(env)
	if (!instance || instanceKey !== key) {
		instance = resolveAdapterService(env)
		instanceKey = key
	}
	return instance
}
