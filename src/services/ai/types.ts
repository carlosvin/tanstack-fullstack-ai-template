/**
 * AI adapter interface.
 *
 * Abstracts the AI/LLM provider behind an interface so the underlying
 * service (OpenAI, Anthropic, Gemini, Ollama, etc.) can be swapped
 * without touching application code.
 *
 * The adapter returned by getAdapter() must be compatible with TanStack AI's
 * `chat()` function — any @tanstack/ai-* adapter satisfies this.
 */

/** Provider-agnostic AI adapter that can be passed to TanStack AI's chat(). */
export interface AIAdapterService {
	/** Returns true if all required environment variables are set. */
	isConfigured(): boolean

	/** Returns a human-readable message listing missing env vars, or null if fully configured. */
	getMissingConfigMessage(): string | null

	/**
	 * Returns the underlying TanStack AI adapter instance for use with `chat()`.
	 * Returns null if the provider is not configured.
	 */
	getAdapter(): unknown | null
}
