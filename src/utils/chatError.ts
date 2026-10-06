/** Turn a provider or transport failure into a sentence a person can act on. */
export function friendlyChatError(error: Error): string {
	const raw = error.message.trim()
	if (/high demand|UNAVAILABLE|\b503\b/i.test(raw)) {
		return 'The model is busy right now. Wait a moment and try again.'
	}
	if (/\b429\b|rate limit/i.test(raw)) {
		return 'Too many requests. Wait a moment and try again.'
	}
	if (raw.startsWith('{') || raw.includes('"error"') || raw.length > 180) {
		return 'The assistant could not answer. Try again.'
	}
	return raw
}
