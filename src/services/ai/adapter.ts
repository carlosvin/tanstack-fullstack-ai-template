/**
 * AI adapter implementations for Google Gemini and Azure OpenAI.
 *
 * The factory selects the adapter based on which env vars are set (first match wins):
 *
 * 1. Google Gemini:
 *    - GEMINI_API_KEY        - API key (also accepts GOOGLE_API_KEY)
 *    - GEMINI_MODEL          - Model name (default: gemini-2.5-flash)
 *
 * 2. Azure OpenAI:
 *    - AZURE_OPENAI_API_KEY      - API key
 *    - AZURE_OPENAI_ENDPOINT     - Base URL (e.g. https://host/openai/v1)
 *    - AZURE_OPENAI_DEPLOYMENT   - Model name (default: gpt-4o)
 */

import type { GeminiTextModel } from '@tanstack/ai-gemini'
import { createGeminiChat } from '@tanstack/ai-gemini'
import type { OpenAIChatModel } from '@tanstack/ai-openai'
import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AIAdapterService } from './types'

class GeminiAdapterService implements AIAdapterService {
	isConfigured(): boolean {
		return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
	}

	getMissingConfigMessage(): string | null {
		if (this.isConfigured()) return null
		return 'Missing AI configuration: GEMINI_API_KEY (or GOOGLE_API_KEY)'
	}

	getAdapter() {
		const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
		if (!apiKey) return null

		const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash') as GeminiTextModel
		return createGeminiChat(model, apiKey)
	}
}

class AzureOpenAIAdapterService implements AIAdapterService {
	isConfigured(): boolean {
		return Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
	}

	getMissingConfigMessage(): string | null {
		const missing: string[] = []
		if (!process.env.AZURE_OPENAI_API_KEY) missing.push('AZURE_OPENAI_API_KEY')
		if (!process.env.AZURE_OPENAI_ENDPOINT) missing.push('AZURE_OPENAI_ENDPOINT')
		if (missing.length === 0) return null
		return `Missing AI configuration: ${missing.join(', ')}`
	}

	getAdapter() {
		const apiKey = process.env.AZURE_OPENAI_API_KEY
		const baseURL = process.env.AZURE_OPENAI_ENDPOINT
		if (!apiKey || !baseURL) return null

		const model = (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o') as OpenAIChatModel
		return createOpenaiChat(model, apiKey, { baseURL, defaultHeaders: { 'api-key': apiKey } })
	}
}

let instance: AIAdapterService | null = null

/** Returns the singleton AI adapter service. Priority: Gemini > Azure. */
export function getAIAdapterService(): AIAdapterService {
	if (!instance) {
		if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
			instance = new GeminiAdapterService()
		} else {
			instance = new AzureOpenAIAdapterService()
		}
	}
	return instance
}
