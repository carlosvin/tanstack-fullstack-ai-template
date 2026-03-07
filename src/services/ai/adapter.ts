/**
 * OpenAI-compatible AI adapter implementation.
 *
 * Uses @tanstack/ai-openai which works with OpenAI, Azure OpenAI,
 * and any OpenAI-compatible API (Ollama, Together, etc.).
 *
 * To swap to a different provider (Anthropic, Gemini), create a new
 * implementation of AIAdapterService and update the factory below.
 *
 * Required environment variables:
 * - AZURE_OPENAI_API_KEY      - API key
 * - AZURE_OPENAI_ENDPOINT     - Base URL (e.g. https://host/openai/v1)
 * - AZURE_OPENAI_DEPLOYMENT   - Model name (default: gpt-4o)
 */

import type { OpenAIChatModel } from '@tanstack/ai-openai'
import { OpenAITextAdapter } from '@tanstack/ai-openai'
import type { AIAdapterService } from './types'

class OpenAIAdapterService implements AIAdapterService {
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

	getAdapter(): OpenAITextAdapter<OpenAIChatModel> | null {
		const apiKey = process.env.AZURE_OPENAI_API_KEY
		const baseURL = process.env.AZURE_OPENAI_ENDPOINT
		if (!apiKey || !baseURL) return null

		const model = (process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o') as OpenAIChatModel

		return new OpenAITextAdapter(
			{
				apiKey,
				baseURL,
				defaultHeaders: { 'api-key': apiKey },
			},
			model,
		)
	}
}

let instance: AIAdapterService | null = null

/** Returns the singleton AI adapter service. */
export function getAIAdapterService(): AIAdapterService {
	if (!instance) {
		instance = new OpenAIAdapterService()
	}
	return instance
}
