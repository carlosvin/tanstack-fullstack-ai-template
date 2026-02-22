/**
 * AI adapter factory.
 *
 * Uses @tanstack/ai-openai which is compatible with OpenAI, Azure OpenAI,
 * and any OpenAI-compatible API (Ollama, Together, etc.).
 *
 * To swap to a different provider (Anthropic, Gemini), replace this file
 * with the corresponding @tanstack/ai-* adapter.
 *
 * Required environment variables:
 * - AZURE_OPENAI_API_KEY      – API key
 * - AZURE_OPENAI_ENDPOINT     – Base URL (e.g. https://host/openai/v1)
 * - AZURE_OPENAI_DEPLOYMENT   – Model name (default: gpt-4o)
 */

import type { OpenAIChatModel } from '@tanstack/ai-openai'
import { OpenAITextAdapter } from '@tanstack/ai-openai'

/** Returns true if all required AI environment variables are set. */
export function isAIConfigured(): boolean {
	return Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
}

/** Returns a human-readable message describing which AI env vars are missing. */
export function getMissingAIConfigMessage(): string | null {
	const missing: string[] = []
	if (!process.env.AZURE_OPENAI_API_KEY) missing.push('AZURE_OPENAI_API_KEY')
	if (!process.env.AZURE_OPENAI_ENDPOINT) missing.push('AZURE_OPENAI_ENDPOINT')
	if (missing.length === 0) return null
	return `Missing AI configuration: ${missing.join(', ')}`
}

/**
 * Creates the OpenAI adapter backed by the configured endpoint.
 * Returns null if required environment variables are missing.
 */
export function getAIAdapter(): OpenAITextAdapter | null {
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
